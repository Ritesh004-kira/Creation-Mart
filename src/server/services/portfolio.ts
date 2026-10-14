import type { PortfolioInputV1 } from '@/domain/contracts';
export function portfolioInput(row:Record<string,unknown>):Partial<PortfolioInputV1> {
  return {title:row.title,objective:row.objective,description:row.description,kind:row.media_kind,previewAssetId:row.preview_asset_id,outputFormats:row.output_formats,
    ...(row.width_px?{widthPx:row.width_px}:{}),...(row.height_px?{heightPx:row.height_px}:{}),...(row.duration_sec?{durationSec:Number(row.duration_sec)}:{}),
    outcomes:row.outcomes,styles:row.styles,workflow:row.workflow,modelRefs:row.model_refs,generationDisclosure:row.generation_disclosure,modelDisclosureNote:row.model_disclosure_note,humanContribution:row.human_contribution,rightsOffer:row.rights_offer,artifactOrigin:row.artifact_origin} as Partial<PortfolioInputV1>;
}
