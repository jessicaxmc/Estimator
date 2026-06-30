'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type LabourRate, type Material } from '@/lib/supabase';

export default function SettingsPage() {
  const [labourRates, setLabourRates] = useState<LabourRate[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const [newLabourName, setNewLabourName] = useState('');
  const [newLabourRate, setNewLabourRate] = useState('');
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialCost, setNewMaterialCost] = useState('');
  const [newMaterialUnit, setNewMaterialUnit] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2000);
  }

  async function loadAll() {
    setLoading(true);
    const [lr, mt] = await Promise.all([
      supabase.from('labour_rates').select('*').order('name'),
      supabase.from('materials').select('*').order('name'),
    ]);
    if (lr.data) setLabourRates(lr.data as LabourRate[]);
    if (mt.data) setMaterials(mt.data as Material[]);
    setLoading(false);
  }

  async function addLabourRate() {
    if (!newLabourName.trim()) return;
    const { error } = await supabase.from('labour_rates').insert({
      name: newLabourName.trim(),
      hourly_rate: Number(newLabourRate) || 0,
    });
    if (!error) {
      setNewLabourName('');
      setNewLabourRate('');
      flash('labour type added');
      loadAll();
    }
  }

  async function updateLabourRate(id: string, field: 'name' | 'hourly_rate', value: string) {
    setLabourRates(prev => prev.map(r => (r.id === id ? { ...r, [field]: field === 'hourly_rate' ? Number(value) : value } : r)));
  }

  async function saveLabourRate(rate: LabourRate) {
    await supabase.from('labour_rates').update({ name: rate.name, hourly_rate: rate.hourly_rate }).eq('id', rate.id);
    flash('saved');
  }

  async function deleteLabourRate(id: string) {
    await supabase.from('labour_rates').delete().eq('id', id);
    loadAll();
  }

  async function addMaterial() {
    if (!newMaterialName.trim()) return;
    const { error } = await supabase.from('materials').insert({
      name: newMaterialName.trim(),
      unit_cost: Number(newMaterialCost) || 0,
      unit: newMaterialUnit.trim() || 'unit',
    });
    if (!error) {
      setNewMaterialName('');
      setNewMaterialCost('');
      setNewMaterialUnit('');
      flash('material added');
      loadAll();
    }
  }

  function updateMaterial(id: string, field: 'name' | 'unit_cost' | 'unit', value: string) {
    setMaterials(prev => prev.map(m => (m.id === id ? { ...m, [field]: field === 'unit_cost' ? Number(value) : value } : m)));
  }

  async function saveMaterial(material: Material) {
    await supabase.from('materials').update({ name: material.name, unit_cost: material.unit_cost, unit: material.unit }).eq('id', material.id);
    flash('saved');
  }

  async function deleteMaterial(id: string) {
    await supabase.from('materials').delete().eq('id', id);
    loadAll();
  }

  return (
    <div className="wrap">
      <header className="app-head">
        <div>
          <p className="eyebrow">Job costing &middot; settings</p>
          <h1>Rates and materials</h1>
        </div>
        <Link href="/" className="nav-link">&larr; Home</Link>
      </header>

      <div className="status-msg" style={{ padding: '0 0 14px' }}>{status}</div>

      {loading ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>Loading…</p>
      ) : (
        <>
          <div className="rate-card">
            <div className="rate-card-head">
              <div>
                <h2>Labour types</h2>
                <p>Hourly rate charged for each kind of work.</p>
              </div>
            </div>
            <div className="rate-row-head">
              <span>Name</span><span>Rate / hr</span><span></span><span></span>
            </div>
            {labourRates.map(rate => (
              <div className="rate-row" key={rate.id}>
                <input type="text" value={rate.name} onChange={e => updateLabourRate(rate.id, 'name', e.target.value)} onBlur={() => saveLabourRate(rate)} />
                <input type="number" min={0} step={0.5} value={rate.hourly_rate} onChange={e => updateLabourRate(rate.id, 'hourly_rate', e.target.value)} onBlur={() => saveLabourRate(rate)} />
                <span></span>
                <button className="del-btn" onClick={() => deleteLabourRate(rate.id)} title="Remove">&times;</button>
              </div>
            ))}
            <div className="add-rate-row">
              <div className="field-row" style={{ gridTemplateColumns: '1fr 110px 90px', marginBottom: 0, alignItems: 'end' }}>
                <div>
                  <label>New labour type</label>
                  <input type="text" value={newLabourName} onChange={e => setNewLabourName(e.target.value)} placeholder="e.g. Tiling" />
                </div>
                <div>
                  <label>Rate / hr</label>
                  <input type="number" min={0} step={0.5} value={newLabourRate} onChange={e => setNewLabourRate(e.target.value)} placeholder="0.00" />
                </div>
                <button className="small" onClick={addLabourRate}>Add</button>
              </div>
            </div>
          </div>

          <div className="rate-card">
            <div className="rate-card-head">
              <div>
                <h2>Materials</h2>
                <p>Cost per unit for materials used on jobs.</p>
              </div>
            </div>
            <div className="rate-row-head">
              <span>Name</span><span>Cost</span><span>Unit</span><span></span>
            </div>
            {materials.map(material => (
              <div className="rate-row" key={material.id}>
                <input type="text" value={material.name} onChange={e => updateMaterial(material.id, 'name', e.target.value)} onBlur={() => saveMaterial(material)} />
                <input type="number" min={0} step={0.01} value={material.unit_cost} onChange={e => updateMaterial(material.id, 'unit_cost', e.target.value)} onBlur={() => saveMaterial(material)} />
                <input type="text" value={material.unit} onChange={e => updateMaterial(material.id, 'unit', e.target.value)} onBlur={() => saveMaterial(material)} />
                <button className="del-btn" onClick={() => deleteMaterial(material.id)} title="Remove">&times;</button>
              </div>
            ))}
            <div className="add-rate-row">
              <div className="field-row" style={{ gridTemplateColumns: '1fr 90px 90px 70px', marginBottom: 0, alignItems: 'end' }}>
                <div>
                  <label>New material</label>
                  <input type="text" value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} placeholder="e.g. Grout" />
                </div>
                <div>
                  <label>Cost</label>
                  <input type="number" min={0} step={0.01} value={newMaterialCost} onChange={e => setNewMaterialCost(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label>Unit</label>
                  <input type="text" value={newMaterialUnit} onChange={e => setNewMaterialUnit(e.target.value)} placeholder="kg" />
                </div>
                <button className="small" onClick={addMaterial}>Add</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
