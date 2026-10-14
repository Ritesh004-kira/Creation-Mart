import { execFileSync } from 'node:child_process';
import { readFileSync,writeFileSync,mkdirSync,existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
export const credentialPath=join(homedir(),'.codex','secrets','creation-mart','c213484a-0c12-4cd6-a2a0-e4f67ae38db8.dpapi');
export function saveCredentials(records){
  if(process.platform!=='win32')throw new Error('This bootstrap uses Windows user-bound encryption.');
  const command='$taskCredentialText = [Console]::In.ReadToEnd(); $taskSecureValue = ConvertTo-SecureString -String $taskCredentialText -AsPlainText -Force; ConvertFrom-SecureString -SecureString $taskSecureValue';
  let encrypted;
  try{encrypted=execFileSync('pwsh.exe',['-NoProfile','-NonInteractive','-Command',command],{input:JSON.stringify(records),encoding:'utf8',windowsHide:true}).trim();}catch{throw new Error('Secure credential encryption failed. No credentials are logged.');}
  if(!encrypted)throw new Error('Secure credential encryption returned no data.');
  mkdirSync(join(homedir(),'.codex','secrets','creation-mart'),{recursive:true});
  writeFileSync(credentialPath,encrypted,{mode:0o600});
}
export function loadCredentials(){
  if(!existsSync(credentialPath))return [];
  const command='$taskEncryptedValue = [Console]::In.ReadToEnd(); $taskSecureValue = ConvertTo-SecureString -String $taskEncryptedValue; $taskPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecureValue); try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPtr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPtr) }';
  try{
    const plaintext=execFileSync('pwsh.exe',['-NoProfile','-NonInteractive','-Command',command],{input:readFileSync(credentialPath,'utf8'),encoding:'utf8',windowsHide:true});
    return JSON.parse(plaintext);
  }catch{throw new Error('Secure credential decryption failed. No credentials are logged.');}
}
