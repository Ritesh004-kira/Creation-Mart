import { brandReviewSchema } from '@/domain/contracts/engagement';
import { workflowAction } from '@/server/services/workflow-action';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){return workflowAction(request,(await params).id,'brand',brandReviewSchema,'accept_engagement');}
