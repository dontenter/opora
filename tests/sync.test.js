import test from 'node:test';
import assert from 'node:assert/strict';
import {trainingData,archiveWorkout,combineImport} from '../src/data.js';
import {SyncEngine} from '../src/sync.js';
const empty=()=>({sessions:{},history:[]});
const populated=()=>({sessions:{A:{note:'test',exercises:{0:{note:'tip',sets:[{weight:'12',reps:'10',done:true}]}}}},history:[]});
function fixture(meta={},data=empty()){
  let m={revision:0,dirty:false,seq:0,...meta},d=data;
  const store={meta:()=>({...m}),data:()=>structuredClone(d),setMeta:patch=>Object.assign(m,patch),apply:value=>{d=structuredClone(value);}};
  return store;
}
test('archive preserves notes and sets, resets current marks, keeps weights',()=>{
 const original=populated(),result=archiveWorkout(original,'A','2026-09-16T00:00:00Z','uuid');
 assert.equal(result.history[0].session.exercises[0].sets[0].done,true);
 assert.equal(result.sessions.A.exercises[0].sets[0].done,false);
 assert.equal(result.sessions.A.exercises[0].sets[0].weight,'12');
 assert.equal(original.sessions.A.note,'test');
});
test('import preserves cloud current training and archives local data',()=>{
 const local=populated(),cloud=empty();cloud.sessions.B={note:'cloud'};
 const result=combineImport(local,cloud);assert.equal(result.sessions.B.note,'cloud');assert.equal(result.history[0].session.note,'test');
});
test('device preferences never enter training payload',()=>assert.deepEqual(trainingData({...empty(),timer:{end:42},active:'C',sync:{revision:9}}),empty()));
test('loads cloud when local is clean',async()=>{
 const store=fixture();const engine=new SyncEngine({store,transport:{read:async()=>({data:populated(),revision:3})},status:()=>{},conflict:()=>{}});
 await engine.run();assert.equal(store.meta().revision,3);assert.equal(store.data().sessions.A.note,'test');
});
test('offline failure keeps dirty edits',async()=>{
 const store=fixture({dirty:true,seq:1},populated());const engine=new SyncEngine({store,transport:{read:async()=>{throw new Error('offline');}},status:()=>{},conflict:()=>{}});
 await engine.run();assert.equal(store.meta().dirty,true);assert.equal(store.data().sessions.A.note,'test');
});
test('stale local revision never overwrites remote',async()=>{
 const store=fixture({dirty:true,revision:1,seq:1},populated());let writes=0,conflict=false;
 const engine=new SyncEngine({store,transport:{read:async()=>({revision:2,data:empty()}),write:async()=>{writes++;}},status:()=>{},conflict:value=>conflict=value});
 await engine.run();assert.equal(writes,0);assert.equal(conflict,true);assert.equal(store.meta().dirty,true);
});
test('edit during write is retried with newer revision',async()=>{
 const store=fixture({dirty:true,seq:1},populated());let revision=0,writes=0;
 const engine=new SyncEngine({store,transport:{read:async()=>revision?{revision,data:empty()}:null,write:async()=>{writes++;revision++;if(writes===1)store.setMeta({seq:2,dirty:true});return {ok:true,revision};}},status:()=>{},conflict:()=>{}});
 await engine.run();assert.equal(writes,2);assert.equal(store.meta().dirty,false);assert.equal(store.meta().revision,2);
});
test('response from former account cannot replace newly selected account data',async()=>{
 const store=fixture();let release;const gate=new Promise(r=>release=r);
 const engine=new SyncEngine({store,transport:{read:()=>gate},status:()=>{},conflict:()=>{}});
 const pending=engine.run();engine.stop();release({revision:3,data:populated()});await pending;assert.deepEqual(store.data(),empty());
});
