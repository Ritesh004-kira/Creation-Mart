import { z } from 'zod';
const group=z.array(z.string().min(1).max(80)).max(20);
export const discoverySchema=z.strictObject({
 q:z.string().max(160).optional(),specialties:group.optional(),skills:group.optional(),tools:group.optional(),models:group.optional(),mediaKinds:z.array(z.enum(['image','video','audio','text','three_d'])).max(5).optional(),formats:group.optional(),aspectRatios:z.array(z.string().regex(/^[1-9]\d*:[1-9]\d*$/)).max(20).optional(),styles:group.optional(),languages:group.optional(),
 availableOnly:z.boolean().optional(),budgetMaxMinor:z.number().int().positive().max(1000000000).optional(),currency:z.string().regex(/^[A-Z]{3}$/).optional(),rightsState:z.enum(['compatible_declared','needs_review','blocked']).optional(),
});
export type DiscoveryFilters=z.infer<typeof discoverySchema>;
export function parseDiscoveryParams(params:URLSearchParams){
 const body:Record<string,unknown>={};
 for(const key of ['q','currency','rightsState'])if(params.get(key))body[key]=params.get(key);
 for(const key of ['specialties','skills','tools','models','mediaKinds','formats','aspectRatios','styles','languages']){const values=params.getAll(key).flatMap(v=>v.split(',')).filter(Boolean);if(values.length)body[key]=values;}
 if(params.get('availableOnly')==='true')body.availableOnly=true;
 if(params.get('budgetMaxMinor'))body.budgetMaxMinor=Number(params.get('budgetMaxMinor'));
 return discoverySchema.parse(body);
}
