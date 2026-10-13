import { HttpError } from './errors';
export function rpcError(error:{message:string;code?:string}):never {
  const text=error.message;
  const mapping:[string,string,number,string][]=[
    ['RIGHTS_BLOCKED','RIGHTS_BLOCKED',409,'The requested usage is explicitly prohibited. It cannot be acknowledged away.'],
    ['RIGHTS_REVIEW_REQUIRED','INVALID_TRANSITION',409,'Resolve the required usage declarations before continuing.'],
    ['IDEMPOTENCY_CONFLICT','VERSION_CONFLICT',409,'This action key was already used with different information.'],
    ['VERSION_CONFLICT','VERSION_CONFLICT',409,'This record changed. Reload its saved version before trying again.'],
    ['PUBLICATION_INCOMPLETE','VALIDATION_FAILED',400,'Complete the work, process and ready preview before publishing.'],
    ['UPLOAD_TOO_LARGE','UPLOAD_TOO_LARGE',413,'This file exceeds the supported size limit.'],
    ['UNSUPPORTED_MEDIA','UNSUPPORTED_MEDIA',415,'This file type is not supported.'],
    ['RATE_LIMITED','RATE_LIMITED',429,'Your upload allowance is full. Finish or remove a pending upload, then try again.'],
    ['NOT_FOUND','NOT_FOUND',404,'That record is unavailable.'],
    ['FORBIDDEN','FORBIDDEN',403,'You cannot perform this action.'],
    ['INVALID_TRANSITION','INVALID_TRANSITION',409,'This action is unavailable in the current state.'],
    ['VALIDATION_FAILED','VALIDATION_FAILED',400,'Check the supplied fields and try again.'],
  ];
  const found=mapping.find(([token])=>text.includes(token));
  if(found)throw new HttpError(found[1],found[2],found[3]);
  throw new HttpError('DEPENDENCY_UNAVAILABLE',503,'The service could not complete this action. Please try again.');
}
