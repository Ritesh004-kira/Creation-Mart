import { serverSupabase } from '@/server/supabase';
import { HttpError, errorResponse } from '@/server/http/errors';
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const requestId = crypto.randomUUID();
  try {
    const { slug } = await params;
    if (!/^[a-z0-9-]{1,80}$/.test(slug)) throw new HttpError('NOT_FOUND', 404, 'That creator is unavailable.');
    const db = await serverSupabase();
    const { data: profile, error } = await db.from('creator_profiles').select('*').eq('slug', slug).eq('published', true).maybeSingle();
    if (error) throw new HttpError('DEPENDENCY_UNAVAILABLE', 503, 'The creator could not be loaded.');
    if (!profile) throw new HttpError('NOT_FOUND', 404, 'That creator is unavailable.');
    const { data: items, error: itemError } = await db.from('portfolio_items').select('id,title,objective,description,media_kind,preview_asset_id,output_formats,width_px,height_px,duration_sec,outcomes,styles,workflow,model_refs,generation_disclosure,model_disclosure_note,human_contribution,rights_offer,artifact_origin,updated_at').eq('creator_id', profile.user_id).eq('published', true).order('created_at').order('id');
    if (itemError) throw new HttpError('DEPENDENCY_UNAVAILABLE', 503, 'The creator work could not be loaded.');
    return Response.json({ data: { profile, items }, requestId });
  } catch (error) { return errorResponse(error, requestId); }
}
