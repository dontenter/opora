export const clone = value => JSON.parse(JSON.stringify(value));
export function trainingData(state) {
  return clone({sessions:state.sessions || {},history:Array.isArray(state.history)?state.history:[]});
}
export function hasRecords(data) {
  return (data.history?.length || 0)>0 || Object.values(data.sessions || {}).some(s => s.note || s.before || s.after || Object.values(s.exercises || {}).some(e => e.note || e.sets?.some(r => r.done || r.weight || r.reps || r.left || r.right)));
}
export function archiveWorkout(state, id, now, uuid) {
  const data=trainingData(state), current=data.sessions[id];
  if(!current) return data;
  if(hasRecords({sessions:{[id]:current}})) data.history.unshift({id:uuid,workout:id,finishedAt:now,session:clone(current)});
  const next=clone(current);
  for(const e of Object.values(next.exercises || {})){e.note='';for(const set of e.sets || [])set.done=false;}
  next.note='';next.before='';next.after='';next.startedAt=now;
  data.sessions[id]=next;
  return data;
}
export function combineImport(local, remote) {
  // Local current workouts become history to avoid replacing cloud workouts.
  const result=clone(remote), existing=new Set(result.history.map(x=>x.id));
  for(const item of local.history || [])if(!existing.has(item.id)){result.history.push(clone(item));existing.add(item.id);}
  for(const [workout,session] of Object.entries(local.sessions || {}))if(hasRecords({sessions:{[workout]:session}}))result.history.push({id:crypto.randomUUID(),workout,finishedAt:new Date().toISOString(),session:clone(session),imported:true});
  result.history.sort((a,b)=>b.finishedAt.localeCompare(a.finishedAt));
  return result;
}
