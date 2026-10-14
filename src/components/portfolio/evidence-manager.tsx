'use client';
import { trackedFetch } from '@/lib/tracked-fetch';
import { useId, useRef, useState } from 'react';
import { AssetUploader } from './asset-uploader';
import { ClaimSignals, type ClaimSignal } from '../passport/claim-signals';
type Evidence = { id: string; format: string; checked_at: string };
export function EvidenceManager({ itemId, initialAssets, initialSignals }: { itemId: string; initialAssets: Evidence[]; initialSignals: ClaimSignal[] }) {
  const [assets, setAssets] = useState(initialAssets), [selected, setSelected] = useState<string[]>([]), [signals, setSignals] = useState(initialSignals);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [status, setStatus] = useState('');
  const inputId = useId(), action = useRef<{ body: string; key: string } | null>(null);
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setStatus('');
    const body = JSON.stringify({ itemId, assertion: String(new FormData(event.currentTarget).get('assertion') ?? '').trim(), evidenceAssetIds: selected });
    if (action.current?.body !== body) action.current = { body, key: crypto.randomUUID() };
    try {
      const response = await trackedFetch('/api/v1/claims', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': action.current.key }, body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? 'Your claim could not be saved.');
      setSignals(previous => [...previous.filter(signal => signal.id !== result.data.id), result.data]); action.current = null;
      setStatus('Claim saved. Attachment status is derived from your checked private files.');
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'Try saving again.'); }
    finally { setBusy(false); }
  }
  return <section className="card stack"><h2>Private process evidence</h2><p className="muted">Attach checked evidence to a specific assertion. Screenshots do not prove authorship or licensing. Only the assertion and its status are public after publication.</p>
    <AssetUploader parentId={itemId} purpose="evidence" kind="image" onReady={asset => { setAssets(previous => [...previous.filter(existing => existing.id !== asset.id), { id: asset.id, format: asset.format, checked_at: asset.checked_at }]); setSelected(previous => [...new Set([...previous, asset.id])]); }} />
    <form onSubmit={save} className="stack"><div className="field"><label htmlFor={inputId}>Assertion supported by this evidence *</label><textarea id={inputId} name="assertion" required maxLength={500} /></div>
      {assets.length > 0 && <fieldset><legend>Private checked files for this assertion</legend>{assets.map((asset, index) => <label className="check" key={asset.id}><input type="checkbox" checked={selected.includes(asset.id)} onChange={event => setSelected(previous => event.target.checked ? [...previous, asset.id] : previous.filter(id => id !== asset.id))} />Evidence {index + 1} · {asset.format.toUpperCase()} · checked {new Date(asset.checked_at).toISOString().slice(0, 10)}</label>)}</fieldset>}
      <button className="button button-primary" aria-busy={busy} disabled={busy}>{busy ? 'Saving assertion…' : 'Save evidence assertion'}</button><p role="status">{status}</p>{error && <p className="error" role="alert">{error}</p>}
    </form><ClaimSignals signals={signals} />
  </section>;
}
