import { randomBytes,randomUUID } from 'node:crypto';
import { mkdirSync,writeFileSync } from 'node:fs';
import bcrypt from 'bcryptjs';
import { loadCredentials,saveCredentials,credentialPath } from './secure-store.mjs';
const runId='c213484a-0c12-4cd6-a2a0-e4f67ae38db8',records=loadCredentials();
const names=process.argv.includes('--foundation')?[['asha','creator'],['lumaleaf','brand']]:[
  ...['asha','bala','chloe','dev','ena','farah','gautam','hana','ivo','jaya','kai','lena'].map(n=>[n,'creator']),['lumaleaf','brand'],['orbitnote','brand'],
];
for(const [name,role] of names)if(!records.some(r=>r.name===name))records.push({name,role,email:'cm-'+runId.slice(0,8)+'-'+name+'@example.com',password:randomBytes(32).toString('base64url'),userId:randomUUID()});
saveCredentials(records);
const q=value=>"'"+String(value).replaceAll("'","''")+"'";
let sql='begin;\n';
for(const r of records){
  const hash=await bcrypt.hash(r.password,10);
  const metadata=JSON.stringify({demo_run_id:runId,demo_origin:'fictional',demo_name:r.name});
  sql+="insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,is_super_admin,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change,email_change_token_current,reauthentication_token) values('00000000-0000-0000-0000-000000000000',"+q(r.userId)+",'authenticated','authenticated',"+q(r.email)+","+q(hash)+",now(),'{\"provider\":\"email\",\"providers\":[\"email\"]}'::jsonb,"+q(metadata)+"::jsonb,false,now(),now(),'','','','','','') on conflict(id) do nothing;\n";
  sql+="insert into auth.identities(id,provider_id,user_id,identity_data,provider,created_at,updated_at) select "+q(r.userId)+"::uuid,"+q(r.userId)+",u.id,jsonb_build_object('sub',u.id::text,'email',u.email,'email_verified',true,'phone_verified',false),'email',now(),now() from auth.users u where u.id="+q(r.userId)+"::uuid and u.raw_user_meta_data->>'demo_run_id'="+q(runId)+" on conflict(provider_id,provider) do nothing;\n";
}
sql+="commit;\nselect count(*) as demo_accounts from auth.users where raw_user_meta_data->>'demo_run_id'="+q(runId)+";\n";
mkdirSync('work/bootstrap',{recursive:true});writeFileSync('work/bootstrap/demo-accounts.sql',sql);
console.log(JSON.stringify({accounts:records.length,credentialAccessLocation:credentialPath,bootstrapSql:'work/bootstrap/demo-accounts.sql',containsPlaintextPasswords:false}));
