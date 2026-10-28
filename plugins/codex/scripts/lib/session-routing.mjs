import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import readline from 'node:readline';

// This short-lived server performs metadata reads only. Writes use native codex queue,
// which discovers the shared server and never resumes/steals a Desktop writer.
export class SessionRpc {
  constructor({ executable = 'codex', timeoutMs = 15000 } = {}) {
    this.timeoutMs = timeoutMs;
    this.pending = new Map();
    this.id = 0;
    this.child = spawn(executable, ['app-server'], { stdio: ['pipe', 'pipe', 'pipe'], shell: false });
    this.lines = readline.createInterface({ input: this.child.stdout });
    this.lines.on('line', line => {
      let message;
      try { message = JSON.parse(line); } catch { this.fail(new Error('Invalid app-server JSON')); return; }
      if (message.method && message.id !== undefined) {
        this.child.stdin.write(JSON.stringify({id:message.id,error:{code:-32601,message:'Session routing does not handle approvals or tool execution'}})+'\n');
        return;
      }
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    });
    // Do not expose arbitrary daemon stderr, which can contain private paths/payloads.
    this.child.stderr.resume();
    this.child.on('error', () => this.fail(new Error('Cannot start codex app-server')));
    this.child.on('exit', () => { this.closed = true; this.fail(new Error('Read-only app-server connection closed')); });
    this.child.stdin.on('error', () => this.fail(new Error('Read-only app-server input closed')));
  }
  fail(error) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(error); }
    this.pending.clear();
  }
  request(method, params) {
    if (this.closed) return Promise.reject(new Error('Read-only app-server connection is closed'));
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out: ${method}. Read did not finish; no write is performed by this connection.`));
      }, this.timeoutMs);
      this.pending.set(id,{resolve,reject,timer});
      this.child.stdin.write(JSON.stringify({id,method,params})+'\n');
    });
  }
  async initialize() {
    await this.request('initialize',{clientInfo:{name:'codex-in-claude',version:'1.0.6-nb.1'},capabilities:{experimentalApi:true}});
    this.child.stdin.write(JSON.stringify({method:'initialized',params:{}})+'\n');
  }
  close() {
    this.closed = true;
    this.fail(new Error('Connection closed'));
    this.lines.close(); this.child.stdin.end(); this.child.kill();
  }
}

export async function pages(rpc, method, params = {}) {
  const data = []; const seen = new Set(); let cursor;
  do {
    const result = await rpc.request(method,{...params,limit:100,...(cursor ? {cursor} : {})});
    if (!Array.isArray(result?.data)) throw new Error(`Invalid ${method} response`);
    data.push(...result.data); cursor = result.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error(`Repeated ${method} cursor; result incomplete`);
    if (cursor) seen.add(cursor);
  } while (cursor);
  return data;
}

const SOURCE_KINDS = ['cli','vscode','exec','appServer','subAgent','subAgentReview','subAgentCompact','subAgentThreadSpawn','subAgentOther','unknown'];
export async function listSessions(rpc, { archived = false } = {}) {
  const sections = await pages(rpc,'threadSection/list');
  const threads = [];
  for (const sectionId of [...sections.map(s=>s.id),null]) {
    threads.push(...await pages(rpc,'thread/list',{archived,sectionId,sourceKinds:SOURCE_KINDS,modelProviders:[],useStateDbOnly:true,sortKey:sectionId ? 'section_position' : 'updated_at',sortDirection:'asc'}));
  }
  if (new Set(threads.map(t=>t.id)).size !== threads.length) throw new Error('Sections changed during listing; retry the read');
  const groups = sections.map(s=>({id:s.id,name:s.name,threads:[]}));
  const byId = new Map(groups.map(s=>[s.id,s]));
  for (const t of threads) {
    const id = t.section?.id ?? null;
    if (!byId.has(id)) { const g={id,name:t.section?.name ?? 'Bez sekcji',threads:[]};byId.set(id,g);groups.push(g); }
    byId.get(id).threads.push({id:t.id,title:t.name ?? t.id,cwd:t.cwd,projectId:t.projectId ?? null,status:t.status?.type ?? 'unknown',model:t.model,reasoningEffort:t.reasoningEffort});
  }
  return {scope:'local-app-server',archived,complete:true,sectionOrder:'app-server (Desktop visual order not guaranteed)',remoteHosts:'not queried',chatgptConversations:'not included',sections:groups};
}

export function validateTarget(threadId) {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(threadId ?? '')) throw new Error('Use an exact thread UUID from sessions; titles are not accepted');
}
const runFile = promisify(execFile);
export async function nativeQueue(threadId, message) {
  let stdout;
  try {
    ({stdout} = await runFile('codex',['queue','--thread',threadId,'--message',message],{timeout:30000,maxBuffer:65536,windowsHide:true,shell:false}));
  } catch {
    throw new Error('Native codex queue failed or timed out. Delivery UNKNOWN; inspect the target queue/history before retrying.');
  }
  const receipt = /Queued message ([0-9a-f-]+) for thread ([0-9a-f-]+)\./i.exec(stdout);
  if (!receipt || receipt[2] !== threadId) throw new Error('Unverified native queue receipt; delivery UNKNOWN, do not retry blindly');
  return receipt[1];
}
export async function sendSession(rpc,{threadId,message,execute=false},queue=nativeQueue) {
  validateTarget(threadId);
  if (typeof message !== 'string' || !message.trim()) throw new Error('A nonempty message on stdin is required');
  if (Buffer.byteLength(message,'utf8')>65536) throw new Error('Message exceeds 64 KiB');
  const {thread} = await rpc.request('thread/read',{threadId,includeTurns:false});
  if (thread?.id !== threadId) throw new Error('Target identity mismatch');
  const target={id:thread.id,title:thread.name ?? thread.id,cwd:thread.cwd,model:thread.model,reasoningEffort:thread.reasoningEffort};
  if (!execute) return {state:'PREVIEW',target,bytes:Buffer.byteLength(message,'utf8')};
  const queuedSubmissionId=await queue(threadId,message);
  return {state:'QUEUED',target,queuedSubmissionId,execution:'not confirmed'};
}
