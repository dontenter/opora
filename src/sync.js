import {clone,combineImport} from './data.js';

export class SyncEngine {
  constructor({store,transport,status,conflict}) {
    Object.assign(this,{store,transport,status,conflict});
    this.stopped=false;this.running=null;this.again=false;this.remoteConflict=null;
  }
  stop(){this.stopped=true;}
  run(){
    if(this.stopped)return Promise.resolve();
    if(this.running){this.again=true;return this.running;}
    this.running=this.work().finally(()=>{this.running=null;});
    return this.running;
  }
  async work(){
    do {
      this.again=false;
      if(this.remoteConflict || this.stopped)return;
      const before=this.store.meta();
      this.status('syncing');
      try {
        const remote=await this.transport.read();
        if(this.stopped)return;
        const current=this.store.meta();
        if(current.dirty){
          if((remote?.revision || 0)!==current.revision){
            this.remoteConflict=remote || {revision:0,data:{sessions:{},history:[]}};
            this.conflict(true);this.status('conflict');return;
          }
          const snapshot=clone(this.store.data()), seq=current.seq;
          const result=await this.transport.write(snapshot,current.revision);
          if(this.stopped)return;
          if(!result.ok){this.again=true;continue;}
          const dirty=this.store.meta().seq!==seq;
          this.store.setMeta({revision:result.revision,dirty});
          this.again=dirty;
        }else if(before.seq===current.seq){
          if(remote){this.store.apply(remote.data);this.store.setMeta({revision:remote.revision,dirty:false});}
        }else this.again=true;
        this.status(this.store.meta().dirty?'pending':'synced');
      } catch(error){if(!this.stopped)this.status('error',error);return;}
    } while(this.again&&!this.stopped);
  }
  resolve(useLocal){
    if(!this.remoteConflict||this.stopped)return;
    const remote=this.remoteConflict,local=this.store.data();
    const data=useLocal?combineImport(remote.data,local):combineImport(local,remote.data);
    this.store.apply(data);
    this.store.setMeta({revision:remote.revision,dirty:true,seq:this.store.meta().seq+1});
    this.remoteConflict=null;this.conflict(false);
    return this.run();
  }
}
