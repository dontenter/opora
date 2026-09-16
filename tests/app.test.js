import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('app inputs, archive, account isolation and local persistence',async()=>{
 const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
 const dom=new JSDOM(html,{url:'https://opora-snowy.vercel.app/'});
 const original={window:globalThis.window,document:globalThis.document,localStorage:globalThis.localStorage,Event:globalThis.Event,setInterval:globalThis.setInterval};
 Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,Event:dom.window.Event,setInterval:()=>0});
 const $=id=>document.getElementById(id);
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;};
 try{
  await import('../dist/app.js');
  assert.equal(document.querySelectorAll('.exercise').length,9);
  const weight=document.querySelector('input[aria-label="Chest-supported row, set 1, weight in kg"]');
  weight.value='10';weight.dispatchEvent(new Event('input'));
  const check=document.querySelector('input[type=checkbox]');check.checked=true;check.dispatchEvent(new Event('change'));
  assert.match($('progress-label').textContent,/1 of 24/);
  assert.equal(JSON.parse(localStorage.getItem('opora-training-v1')).sessions.A.exercises[0].sets[0].weight,'10');
  $('new-session').click();assert.equal($('reset-dialog').open,true);$('confirm-reset').click();
  assert.equal($('history-count').textContent,'1');
  assert.equal(window.opora.data().history[0].session.exercises[0].sets[0].done,true);
  assert.equal(window.opora.data().sessions.A.exercises[0].sets[0].done,false);
  assert.match(document.querySelector('.previous-performance').textContent,/10 kg/);
  assert.match(document.querySelector('.previous-performance').textContent,/Set 1/);
  assert.equal(document.documentElement.lang,'en');
  assert.doesNotMatch(document.body.textContent,/[А-Яа-яЁё]/);
  $('history-filter').value='B';$('history-filter').dispatchEvent(new Event('change'));
  assert.equal($('history-count').textContent,'0');
  $('history-filter').value='all';$('history-filter').dispatchEvent(new Event('change'));
  assert.equal($('history-count').textContent,'1');
  document.querySelector('[data-workout="B"]').click();
  assert.match(document.querySelector('.previous-performance').textContent,/No previous workout/);
  document.querySelector('[data-workout="A"]').click();
  assert.match(document.querySelector('.previous-performance').textContent,/10 kg/);
  window.opora.switchAccount('account-one');assert.equal(window.opora.data().history.length,0);
  window.opora.apply({sessions:{},history:[]});window.opora.setMeta({revision:2,dirty:true});
  window.opora.switchAccount('account-two');assert.equal(window.opora.meta().revision,0);
  window.opora.switchAccount('account-one');assert.equal(window.opora.meta().revision,2);
  window.opora.switchAccount(null);assert.equal(window.opora.data().history.length,1);
  for(const day of ['B','C','A']){document.querySelector(`[data-workout="${day}"]`).click();assert.match($('workout-label').textContent,new RegExp(day));}
 }finally{Object.assign(globalThis,original);dom.window.close();}
});
