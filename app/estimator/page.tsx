'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  supabase,
  type LabourRate,
  type Material,
  type LabourLine,
  type MaterialLine,
  type Estimate,
} from '@/lib/supabase';

let seq = 0;
const newId = () => 'l' + (++seq);

function fmt(n: number) {
  if (!isFinite(n)) n = 0;
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function EstimatorPage() {
  const [labourRates, setLabourRates] = useState<LabourRate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingRates, setLoadingRates] = useState(true);

  const [jobName, setJobName] = useState('');
  const [clientName, setClientName] = useState('');
  const [markupPct, setMarkupPct] = useState(20);
  const [labourLines, setLabourLines] = useState<LabourLine[]>([]);
  const [materialLines, setMaterialLines] = useState<MaterialLine[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [saved, setSaved] = useState<Estimate[]>([]);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRates();
    loadSaved();
  }, []);

  async function loadRates() {
    setLoadingRates(true);
    const [lr, mt] = await Promise.all([
      supabase.from('labour_rates').select('*').order('name'),
      supabase.from('materials').select('*').order('name'),
    ]);
    if (lr.data) setLabourRates(lr.data as LabourRate[]);
    if (mt.data) setMaterials(mt.data as Material[]);
    setLoadingRates(false);
  }

  async function loadSaved() {
    const { data } = await supabase.from('estimates').select('*').order('updated_at', { ascending: false });
    if (data) setSaved(data as Estimate[]);
  }

  function flash(msg: string, isError = false) {
    setStatus((isError ? '! ' : '') + msg);
    setTimeout(() => setStatus(''), 2500);
  }

  function addLabourLine() {
    if (labourRates.length === 0) return;
    const r = labourRates[0];
    setLabourLines(prev => [...prev, { line_id: newId(), rate_id: r.id, name: r.name, hourly_rate: r.hourly_rate, hours: 1 }]);
  }

  function addMaterialLine() {
    if (materials.length === 0) return;
    const m = materials[0];
    setMaterialLines(prev => [...prev, { line_id: newId(), material_id: m.id, name: m.name, unit_cost: m.unit_cost, qty: 1 }]);
  }

  function updateLabourLine(id: string, field: 'rate_id' | 'hours', value: string) {
    setLabourLines(prev =>
      prev.map(l => {
        if (l.line_id !== id) return l;
        if (field === 'rate_id') {
          const r = labourRates.find(x => x.id === value);
          return r ? { ...l, rate_id: r.id, name: r.name, hourly_rate: r.hourly_rate } : l;
        }
        return { ...l, hours: Number(value) };
      })
    );
  }

  function updateMaterialLine(id: string, field: 'material_id' | 'qty', value: string) {
    setMaterialLines(prev =>
      prev.map(l => {
        if (l.line_id !== id) return l;
        if (field === 'material_id') {
          const m = materials.find(x => x.id === value);
          return m ? { ...l, material_id: m.id, name: m.name, unit_cost: m.unit_cost } : l;
        }
        return { ...l, qty: Number(value) };
      })
    );
  }

  function removeLabourLine(id: string) {
    setLabourLines(prev => prev.filter(l => l.line_id !== id));
  }
  function removeMaterialLine(id: string) {
    setMaterialLines(prev => prev.filter(l => l.line_id !== id));
  }

  function totals() {
    const labourSub = labourLines.reduce((sum, l) => sum + (Number(l.hours) || 0) * (Number(l.hourly_rate) || 0), 0);
    const materialSub = materialLines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.unit_cost) || 0), 0);
    const costSub = labourSub + materialSub;
    const markupAmt = costSub * (markupPct / 100);
    const grand = costSub + markupAmt;
    return { labourSub, materialSub, costSub, markupAmt, grand };
  }

  function resetForm() {
    setJobName('');
    setClientName('');
    setMarkupPct(20);
    setLabourLines([]);
    setMaterialLines([]);
    setCurrentId(null);
    setStatus('');
  }

  function loadEstimate(rec: Estimate) {
    setCurrentId(rec.id);
    setJobName(rec.job_name);
    setClientName(rec.client_name || '');
    setMarkupPct(rec.markup_pct);
    setLabourLines((rec.labour_items || []).map(l => ({ ...l, line_id: newId() })));
    setMaterialLines((rec.material_items || []).map(m => ({ ...m, line_id: newId() })));
    flash('estimate loaded');
  }

  async function saveEstimate() {
    if (!jobName.trim()) {
      flash('add a job name before saving', true);
      return;
    }
    setSaving(true);
    const t = totals();
    const payload = {
      job_name: jobName.trim(),
      client_name: clientName.trim() || null,
      markup_pct: markupPct,
      labour_items: labourLines.map(({ line_id, ...rest }) => rest),
      material_items: materialLines.map(({ line_id, ...rest }) => rest),
      total: t.grand,
    };
    let error;
    if (currentId) {
      ({ error } = await supabase.from('estimates').update(payload).eq('id', currentId));
    } else {
      const res = await supabase.from('estimates').insert(payload).select().single();
      error = res.error;
      if (!error && res.data) setCurrentId(res.data.id);
    }
    setSaving(false);
    if (error) {
      flash('could not save — check connection', true);
      console.error(error);
      return;
    }
    flash('estimate saved');
    loadSaved();
  }

  async function deleteEstimate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase.from('estimates').delete().eq('id', id);
    if (!error) {
      loadSaved();
      if (currentId === id) resetForm();
    }
  }

  const t = totals();
  const noRatesYet = !loadingRates && labourRates.length === 0 && materials.length === 0;

  return (
    <div className="wrap">
      <header className="app-head">
        <div>
          <p className="eyebrow">Job costing &middot; estimator</p>
          <h1>Build the bid</h1>
        </div>
        <Link href="/" className="nav-link">&larr; Home</Link>
      </header>

      {noRatesYet && (
        <div className="status-msg error" style={{ padding: '0 0 16px', fontSize: 13 }}>
          No labour rates or materials set up yet. <Link href="/settings" className="nav-link" style={{ color: 'var(--rust-dark)' }}>Add some in Settings</Link> first.
        </div>
      )}

      <div className="layout">
        <div>
          <div className="ticket">
            <div className="ticket-head">
              <div className="field-row">
                <div>
                  <label>Job name</label>
                  <input type="text" value={jobName} onChange={e => setJobName(e.target.value)} placeholder="Kitchen remodel — Harlow residence" />
                </div>
                <div>
                  <label>Client</label>
                  <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client or project owner" />
                </div>
              </div>
            </div>

            <div className="tear" />

            <p className="section-label">Labour</p>
            <div className="items">
              {labourLines.length > 0 && (
                <div className="item-table-head">
                  <span>Type</span><span>Rate / hr</span><span>Hours</span><span style={{ textAlign: 'right' }}>Total</span><span></span>
                </div>
              )}
              {labourLines.map(line => {
                const lineTotal = (Number(line.hours) || 0) * (Number(line.hourly_rate) || 0);
                return (
                  <div className="item-row" key={line.line_id}>
                    <select value={line.rate_id} onChange={e => updateLabourLine(line.line_id, 'rate_id', e.target.value)}>
                      {labourRates.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                    <span className="line-total">{fmt(line.hourly_rate)}</span>
                    <input type="number" min={0} step={0.25} value={line.hours} onChange={e => updateLabourLine(line.line_id, 'hours', e.target.value)} />
                    <span className="line-total">{fmt(lineTotal)}</span>
                    <button className="del-btn" onClick={() => removeLabourLine(line.line_id)} title="Remove">&times;</button>
                  </div>
                );
              })}
              {labourLines.length === 0 && <p className="empty-hint">No labour added yet.</p>}
              <button className="add-row-btn" onClick={addLabourLine} disabled={labourRates.length === 0}>+ Add labour</button>
            </div>

            <p className="section-label">Materials</p>
            <div className="items">
              {materialLines.length > 0 && (
                <div className="item-table-head">
                  <span>Material</span><span>Cost / unit</span><span>Qty</span><span style={{ textAlign: 'right' }}>Total</span><span></span>
                </div>
              )}
              {materialLines.map(line => {
                const lineTotal = (Number(line.qty) || 0) * (Number(line.unit_cost) || 0);
                const mat = materials.find(m => m.id === line.material_id);
                return (
                  <div className="item-row" key={line.line_id}>
                    <select value={line.material_id} onChange={e => updateMaterialLine(line.line_id, 'material_id', e.target.value)}>
                      {materials.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                    <span className="line-total">{fmt(line.unit_cost)}</span>
                    <input type="number" min={0} step={0.5} value={line.qty} onChange={e => updateMaterialLine(line.line_id, 'qty', e.target.value)} />
                    <span className="line-total">{fmt(lineTotal)}</span>
                    <button className="del-btn" onClick={() => removeMaterialLine(line.line_id)} title="Remove">&times;</button>
                  </div>
                );
              })}
              {materialLines.length === 0 && <p className="empty-hint">No materials added yet.</p>}
              <button className="add-row-btn" onClick={addMaterialLine} disabled={materials.length === 0}>+ Add material</button>
            </div>

            <div className="tear" />

            <div className="totals">
              <div className="totals-row"><span>Labour subtotal</span><span className="val">{fmt(t.labourSub)}</span></div>
              <div className="totals-row"><span>Materials subtotal</span><span className="val">{fmt(t.materialSub)}</span></div>
              <div className="totals-row"><span>Cost subtotal</span><span className="val">{fmt(t.costSub)}</span></div>
              <div className="totals-row">
                <span className="markup-control">
                  Markup
                  <input type="number" min={0} step={1} value={markupPct} onChange={e => setMarkupPct(Number(e.target.value))} />%
                </span>
                <span className="val">{fmt(t.markupAmt)}</span>
              </div>
              <div className="totals-row grand"><span>Estimate total</span><span className="val">{fmt(t.grand)}</span></div>
            </div>

            <div className="actions">
              <button className="primary" onClick={saveEstimate} disabled={saving}>{saving ? 'Saving…' : 'Save estimate'}</button>
              <button className="secondary" onClick={resetForm}>Start new</button>
            </div>
            <div className={`status-msg ${status.startsWith('!') ? 'error' : ''}`}>{status.replace(/^! /, '')}</div>
          </div>
        </div>

        <div className="sidebar">
          <h2>Saved estimates</h2>
          {saved.length === 0 ? (
            <div className="sidebar-empty">No saved estimates yet.</div>
          ) : (
            saved.map(rec => (
              <div className="saved-card" key={rec.id} onClick={() => loadEstimate(rec)}>
                <button className="remove" onClick={e => deleteEstimate(rec.id, e)} title="Delete">&times;</button>
                <div className="name">{rec.job_name}</div>
                <div className="client">{rec.client_name || 'No client listed'}</div>
                <div className="amount">{fmt(rec.total)}</div>
                <div className="when">{new Date(rec.updated_at).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
