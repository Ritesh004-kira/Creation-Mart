import {execFileSync} from 'node:child_process';
import {loadCredentials,credentialPath} from './secure-store.mjs';
const records=loadCredentials(),[name,action]=process.argv.slice(2);
if(!name){console.log('Demo aliases: '+records.map(r=>r.name).join(', '));console.log('User-bound encrypted store: '+credentialPath);console.log('Usage: node scripts/demo-access.mjs <alias> --copy-email | --copy-password');}
else{
 const record=records.find(r=>r.name===name);if(!record||!['--copy-email','--copy-password'].includes(action))throw new Error('Choose an existing demo alias and a clipboard action.');
 if(process.platform!=='win32')throw new Error('This credential store requires its original Windows user.');
 execFileSync('pwsh.exe',['-NoProfile','-NonInteractive','-Command','Set-Clipboard -Value ([Console]::In.ReadToEnd())'],{input:action==='--copy-email'?record.email:record.password,windowsHide:true,stdio:['pipe','ignore','ignore']});
 console.log((action==='--copy-email'?'Email':'Password')+' copied for '+name+'. Paste into Creation Mart; clear the clipboard afterward.');
}
