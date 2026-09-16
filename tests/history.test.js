import test from 'node:test';
import assert from 'node:assert/strict';
import {previousWorkout,formatSet} from '../src/data.js';
const entry=(id,workout,finishedAt,done=true,imported=false)=>({id,workout,finishedAt,imported,session:{exercises:{0:{sets:[{weight:'20',reps:'12',done}]}}}});
test('previous workout selects latest same-day completed session regardless of array order',()=>{
 const history=[entry('old','B','2026-09-01'),entry('other','A','2026-09-16'),entry('last','B','2026-09-09'),entry('copy','B','2026-09-15',true,true),entry('unchecked','B','2026-09-14',false)];
 assert.equal(previousWorkout(history,'B').id,'last');
 assert.equal(previousWorkout(history,'C'),null);
 assert.equal(history[0].id,'old');
});
test('previous results preserve seconds, both sides, zero and missing values',()=>{
 assert.equal(formatSet({weight:'0',left:'30',right:'25'},{side:true,unit:'sec'}),'0 kg × L 30 / R 25 sec');
 assert.equal(formatSet({weight:'10',reps:'12'},{unit:'reps'}),'10 kg × 12 reps');
 assert.equal(formatSet({weight:'',reps:''},{unit:'reps'}),'weight not recorded × not recorded reps');
});
test('invalid dates and empty or imported history do not appear as prior training',()=>{
 assert.equal(previousWorkout(null,'A'),null);
 assert.equal(previousWorkout([entry('bad','A','invalid')],'A'),null);
 assert.equal(previousWorkout([entry('copy','A','2026-09-09',true,true)],'A'),null);
});
