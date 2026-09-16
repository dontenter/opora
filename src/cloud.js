import {createClient} from '@supabase/supabase-js';
import {hasRecords,combineImport} from './data.js';
import {SyncEngine} from './sync.js';
const $=id=>document.getElementById(id);
const ready=window.opora?Promise.resolve():new Promise(resolve=>window.addEventListener('opora:ready',resolve,{once:true}));
await ready;
const store=window.opora;
let engine=null,user=null,client=null,timer=null,epoch=0;
function status(kind,error){
  const messages={syncing:'Syncing…',synced:'Saved to cloud',pending:'Changes waiting to sync',conflict:'Choose which workout version to keep',error:'Unable to sync. Your records remain on this device. We will retry when the connection returns.'};
  $('sync-status').textContent=messages[kind] || kind;
  if(!store.storageAvailable())$('sync-status').textContent+=' Browser storage is unavailable. Keep this page open until your changes are saved to the cloud.';
  if(error?.code==='PGRST205'||error?.code==='42P01'||error?.code==='PGRST202')$('sync-status').textContent='Cloud storage is not set up yet. Your records remain on this device.';
}
function changed(){
  if(!engine)return;
  if(engine.remoteConflict){status('conflict');return;}
  status('pending');clearTimeout(timer);timer=setTimeout(()=>engine?.run(),800);
}
window.addEventListener('opora:changed',changed);
function account(next){
  if(user?.id===next?.id)return;
  epoch++;engine?.stop();engine=null;clearTimeout(timer);user=next;
  store.switchAccount(user?.id);
  $('open-auth').hidden=!!user;$('sync-now').hidden=!user;$('sign-out').hidden=!user;
  $('conflict-box').hidden=true;
  $('account-label').textContent=user?user.email:'Workouts on this device';
  $('import-box').hidden=!user||!hasRecords(store.guest())||!!store.meta().guestImported;
  if(!user){status('Sign in to save your workouts to the cloud.');return;}
  const id=user.id,ownEpoch=epoch;
  engine=new SyncEngine({store,status,conflict:show=>$('conflict-box').hidden=!show,transport:{
    async read(){const {data,error}=await client.from('opora_training').select('data,revision').eq('user_id',id).maybeSingle();if(error)throw error;return data;},
    async write(data,revision){if(ownEpoch!==epoch)throw new Error('Account changed');const {data:result,error}=await client.rpc('opora_save',{p_data:data,p_revision:revision});if(error)throw error;return result;}
  }});
  engine.run();
}
$('open-auth').addEventListener('click',()=>$('auth-dialog').showModal());
$('close-auth').addEventListener('click',()=>$('auth-dialog').close());
$('sync-now').addEventListener('click',()=>engine?.run());
$('use-remote').addEventListener('click',()=>engine?.resolve(false));
$('use-local').addEventListener('click',()=>engine?.resolve(true));
$('import-local').addEventListener('click',async()=>{
  const current=engine;
  if(!current)return;
  await current.run();
  if(current!==engine||current.remoteConflict)return;
  store.apply(combineImport(store.guest(),store.data()));
  store.setMeta({dirty:true,seq:store.meta().seq+1,guestImported:true});
  $('import-box').hidden=true;await current.run();
});
$('sign-out').addEventListener('click',async()=>{
  $('sign-out').disabled=true;
  try{await engine?.run();const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;account(null);}
  catch{status('Unable to sign out. Please try again.');}
  finally{$('sign-out').disabled=false;}
});
$('auth-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!client)return;
  $('send-link').disabled=true;$('auth-status').textContent='Sending your email…';
  try{
    const {error}=await client.auth.signInWithOtp({email:$('auth-email').value.trim(),options:{emailRedirectTo:new URL('/',location.href).href}});
    if(error)throw error;
    $('auth-status').textContent='Check your inbox and spam folder. Open the email link to sign in. If it does not arrive, check your address and the Supabase email settings.';
  }catch(error){$('auth-status').textContent=error?.status===429?'Too many requests. Wait a minute and try again.':'Unable to send the email. Check your connection and email address. The project owner may also need to configure email delivery in Supabase.';}
  finally{$('send-link').disabled=false;}
});
if(!__SUPABASE_KEY__){status('Cloud sync is not set up yet. Local mode is available.');$('open-auth').disabled=true;}
else {
  try {
    client=createClient(__SUPABASE_URL__,__SUPABASE_KEY__);
    client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>{account(session?.user || null);if(session?.user)$('auth-dialog').close();},0);});
    const {data,error}=await client.auth.getSession();if(error)throw error;account(data.session?.user || null);
    window.addEventListener('online',()=>engine?.run());
    window.addEventListener('focus',()=>engine?.run());
    setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)engine?.run();},30000);
  }catch{status('Unable to connect to your account. Local workouts are still available.');}
}
