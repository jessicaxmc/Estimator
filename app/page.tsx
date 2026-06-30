'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Item = { id: string; name: string; created_at: string };

export default function Page() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    setStatus('checking');
    const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    setStatus('ok');
    setItems(data as Item[]);
  }

  async function addItem() {
    if (!name.trim()) return;
    const { error } = await supabase.from('items').insert({ name: name.trim() });
    if (!error) {
      setName('');
      checkConnection();
    }
  }

  async function deleteItem(id: string) {
    await supabase.from('items').delete().eq('id', id);
    checkConnection();
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>App starter</h1>
      <p style={{ color: '#666', marginTop: 0, marginBottom: 24 }}>Next.js + Supabase connection check</p>

      {status === 'checking' && <p>Checking connection to Supabase…</p>}

      {status === 'error' && (
        <div style={{ background: '#fdecec', border: '1px solid #f4b8b8', borderRadius: 6, padding: 16, fontSize: 14 }}>
          <strong>Couldn't reach the <code>items</code> table.</strong>
          <p style={{ margin: '8px 0 0' }}>{errorMsg}</p>
          <p style={{ margin: '8px 0 0', color: '#555' }}>
            Check that you ran <code>schema.sql</code> in Supabase, and that{' '}
            <code>NEXT_PUBLIC_SUPABASE_URL</code> / <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set correctly.
          </p>
        </div>
      )}

      {status === 'ok' && (
        <div>
          <div style={{ background: '#eaf6ec', border: '1px solid #b8dec0', borderRadius: 6, padding: 12, fontSize: 14, marginBottom: 24 }}>
            Connected to Supabase. The <code>items</code> table is reachable.
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
              placeholder="Type something and add it"
              style={{ flex: 1, padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 }}
            />
            <button
              onClick={addItem}
              style={{ padding: '8px 16px', border: 'none', borderRadius: 4, background: '#222', color: '#fff', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>

          {items.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>No rows yet — add one above to confirm writes work.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map(item => (
                <li
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee',
                    fontSize: 14,
                  }}
                >
                  <span>{item.name}</span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: 13 }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
