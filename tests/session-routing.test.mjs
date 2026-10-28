import test from 'node:test';
import assert from 'node:assert/strict';
import { pages, listSessions, sendSession, validateTarget, SessionRpc } from '../plugins/codex/scripts/lib/session-routing.mjs';

const id='00000000-0000-4000-8000-000000000001';
const thread={id,name:'Existing chat',cwd:'/repo',model:'owner-model',reasoningEffort:'max'};
test('pagination preserves filters and rejects a looping cursor', async()=>{
 const calls=[];
 const rpc={request:async(m,p)=>{calls.push(p);return p.cursor?{data:[2],nextCursor:null}:{data:[1],nextCursor:'next'};}};
 assert.deepEqual(await pages(rpc,'thread/list',{archived:true}),[1,2]);
 assert.equal(calls[1].archived,true);assert.equal(calls[1].cursor,'next');
 await assert.rejects(pages({request:async()=>({data:[],nextCursor:'loop'})},'thread/list'),/Repeated/);
});
test('sections come from API, include empty sections and actual membership, with unassigned sessions',async()=>{
 const calls=[];
 const rpc={request:async(m,p)=>{calls.push([m,p]);if(m==='threadSection/list')return {data:[{id:'s',name:'Real section'},{id:'empty',name:'Empty'}]};
 if(p.sectionId==='s')return {data:[{...thread,section:{id:'s',name:'Real section'}}]};
 if(p.sectionId===null)return {data:[{...thread,id:'unassigned'}]};return {data:[]};}};
 const result=await listSessions(rpc);
 assert.equal(result.sections[0].threads[0].id,id);assert.deepEqual(result.sections[1].threads,[]);
 assert.equal(result.sections[2].name,'Bez sekcji');assert.equal(result.remoteHosts,'not queried');
 assert.equal(calls.find(([,p])=>p.sectionId===null)[1].sortKey,'updated_at');
 assert.ok(calls.find(([m])=>m==='thread/list')[1].sourceKinds.includes('appServer'));
});
test('a thread moving between section pages does not produce a false complete listing',async()=>{
 const rpc={request:async(m)=>m==='threadSection/list'?{data:[{id:'s',name:'S'}]}:{data:[thread]}};
 await assert.rejects(listSessions(rpc),/changed during listing/);
});
test('preview performs only an exact metadata read and preserves selected model',async()=>{
 const calls=[];const rpc={request:async(m,p)=>{calls.push([m,p]);return {thread};}};
 const r=await sendSession(rpc,{threadId:id,message:'Do the authorized task'},()=>{throw Error('must not send')});
 assert.equal(r.state,'PREVIEW');assert.equal(r.target.model,'owner-model');
 assert.deepEqual(calls,[['thread/read',{threadId:id,includeTurns:false}]]);
});
test('execute sends literal text once to exact ID and reports only QUEUED',async()=>{
 const message='hello $(touch /bad) `echo nope`\nsecond line';const calls=[];
 const r=await sendSession({request:async()=>({thread})},{threadId:id,message,execute:true},async(...args)=>{calls.push(args);return 'queue-id';});
 assert.deepEqual(calls,[[id,message]]);assert.equal(r.state,'QUEUED');assert.equal(r.execution,'not confirmed');
 assert.equal(r.target.reasoningEffort,'max');
});
test('bad identity, blank message and huge messages stop before sending',async()=>{
 assert.throws(()=>validateTarget('Existing chat'),/exact thread UUID/);
 const rpc={request:async()=>({thread:{...thread,id:'other'}})};
 await assert.rejects(sendSession(rpc,{threadId:id,message:'test',execute:true}),/identity mismatch/);
 for(const message of ['', ' ', 'x'.repeat(65537)]) await assert.rejects(sendSession(rpc,{threadId:id,message}));
});
test('uncertain native failure is not retried',async()=>{
 let attempts=0;
 await assert.rejects(sendSession({request:async()=>({thread})},{threadId:id,message:'hello',execute:true},async()=>{attempts++;throw Error('UNKNOWN');}),/UNKNOWN/);
 assert.equal(attempts,1);
});
test('read transport handles missing binary without hanging',async()=>{
 const rpc=new SessionRpc({executable:'/nonexistent/codex-in-claude',timeoutMs:100});
 try {await assert.rejects(rpc.initialize(),/Cannot start|closed/);}finally{rpc.close();}
});
