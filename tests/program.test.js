import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
test('removing shoulder press preserves original keys and historical names',async()=>{
 const source=await readFile(new URL('../dist/app.js',import.meta.url),'utf8');
 const context={};vm.createContext(context);
 vm.runInContext(source.slice(source.indexOf("'use strict';"),source.indexOf('const GUEST_KEY'))+';this.current=plans;this.historical=historyPlans;',context);
 assert.equal(context.current.B.items.length,8);
 assert.equal(context.current.B.items.some(e=>e.name==='Seated dumbbell shoulder press'),false);
 assert.equal(context.current.B.items[4].key,5);
 assert.equal(context.current.B.items[4].name,'Lateral raise');
 assert.equal(context.historical.B.items[4].name,'Seated dumbbell shoulder press');
 assert.equal(context.current.B.items.reduce((n,e)=>n+e.sets,0),22);
 context.state={active:'C'};context.document={createElement:tag=>({tag,children:[],append(...nodes){this.children.push(...nodes);}})};
 vm.runInContext(source.slice(source.indexOf('function exerciseIllustration(index)')),context);
 for(let i=0;i<4;i++){const fig=context.exerciseIllustration(i);const img=fig.children[0];assert.match(img.src,/lat-pulldown|flat-dumbbell-press|seated-cable-row/);await readFile(new URL('../dist/'+img.src,import.meta.url));assert.match(fig.children[1].children[1].textContent,i===2?/Press up/:i===3?/Pull toward/:/Pull down/);}
 assert.equal(context.exerciseIllustration(4),null);
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');assert.match(html,/<small>Friday<\/small>/);assert.doesNotMatch(html,/Saturday/);
});
