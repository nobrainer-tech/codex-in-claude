#!/usr/bin/env node
import { parseArgs } from 'node:util';
import process from 'node:process';
import { SessionRpc, listSessions, sendSession, pages, validateTarget } from './lib/session-routing.mjs';

const {values,positionals}=parseArgs({options:{json:{type:'boolean'},archived:{type:'boolean'},thread:{type:'string'},execute:{type:'boolean'},help:{type:'boolean'}},allowPositionals:true});
const [command]=positionals;
if (values.help || !command) {
 console.log('codex-sessions.mjs sessions [--archived] [--json]\ncodex-sessions.mjs send --thread UUID [--execute] < message.txt\ncodex-sessions.mjs queue --thread UUID');
} else {
 let rpc;
 try {
  if (!['sessions','send','queue'].includes(command) || positionals.length!==1) throw new Error('Unknown command or unexpected arguments');
  if (command!=='sessions') validateTarget(values.thread);
  let message='';
  if(command==='send') {
   if(process.stdin.isTTY) throw new Error('Supply message on stdin');
   for await(const chunk of process.stdin) {message+=chunk;if(Buffer.byteLength(message)>65536)throw new Error('Message exceeds 64 KiB');}
  }
  rpc=new SessionRpc(); await rpc.initialize();
  let result;
  if(command==='sessions') result=await listSessions(rpc,{archived:values.archived});
  if(command==='send') result=await sendSession(rpc,{threadId:values.thread,message,execute:values.execute});
  if(command==='queue') result={threadId:values.thread,queue:(await pages(rpc,'thread/queue/list',{threadId:values.thread})).map(q=>({id:q.id,requestId:q.clientUserMessageId})),note:'Queue presence proves pending only; absence does not prove execution'};
  if(command==='sessions'&&!values.json){
   console.log('Local Codex sessions by section. Remote hosts and ChatGPT conversations excluded.\n');
   for(const section of result.sections){console.log(section.name);for(const t of section.threads)console.log(`  ${t.title} [${t.id}] (${t.status})`);}
  } else console.log(JSON.stringify(result,null,2));
 } catch(e) {console.error(e.message);process.exitCode=1;} finally {rpc?.close();}
}
