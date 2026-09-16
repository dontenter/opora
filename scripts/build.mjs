import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
// Only public configuration is included in browser assets.
try { for(const line of (await readFile('.env.local','utf8')).split('\n')){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');} } catch(e){if(e.code!=='ENOENT')throw e;}
const publicConfig=JSON.parse(await readFile('src/public-config.json','utf8'));
const url=process.env.SUPABASE_URL || publicConfig.url;
const key=process.env.SUPABASE_PUBLISHABLE_KEY || publicConfig.key;
if(key && !key.startsWith('sb_publishable_')) throw new Error('Use a public sb_publishable_ key, never a secret or service-role key.');
await build({entryPoints:['src/cloud.js'],bundle:true,format:'esm',outfile:'dist/cloud.js',minify:true,target:['es2022'],define:{__SUPABASE_URL__:JSON.stringify(url),__SUPABASE_KEY__:JSON.stringify(key)}});
await writeFile('dist/data.js',await readFile('src/data.js'));
console.log(key?'Supabase public configuration included.':'Supabase key missing: local mode remains available.');
