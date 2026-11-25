import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';

type Item = { id: string; place_name: string | null; category: string | null; planned_at: string | null; notes: string | null };
type Trip = { id: string; title: string; location_name: string; start_date: string; end_date: string; is_shared: boolean };
type Itinerary = { trip: Trip; items: Item[]; share: { token: string; is_active: boolean } | null };

export default function TripItinerary({ tripId }: { tripId: string }) {
  const [data, setData] = useState<Itinerary | null>(null);
  const [error, setError] = useState('');

  const load = () =>
    api<Itinerary>(`/trips/${tripId}`).then(setData).catch((e: ApiError) => {
      // 401 = not logged in: send the person to the Login page.
      if (e.status === 401) window.location.hash = '#/login';
      else setError(e.message);
    });

  useEffect(() => { load(); }, [tripId]);

  async function move(index: number, dir: -1 | 1) {
    if (!data) return;
    const ids = data.items.map((i) => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    try { await api(`/trips/${tripId}/items/reorder`, { method: 'PATCH', body: { item_ids: ids } }); await load(); }
    catch (e) { setError((e as ApiError).message); }
  }

  async function remove(itemId: string) {
    try { await api(`/trips/${tripId}/items/${itemId}`, { method: 'DELETE' }); await load(); }
    catch (e) { setError((e as ApiError).message); }
  }

  async function toggleShare() {
    try {
      await api(`/trips/${tripId}/share`, { method: 'PUT', body: { is_active: !data?.share?.is_active } });
      await load();
    } catch (e) { setError((e as ApiError).message); }
  }

  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <main>
      <h1>{data.trip.title}</h1>
      <p>{data.trip.location_name} · {data.trip.start_date} to {data.trip.end_date}</p>
      <ol>
        {data.items.map((it, i) => (
          <li key={it.id}>
            <strong>{it.place_name}</strong> <small>{it.category}</small>
            {it.planned_at && <div>{new Date(it.planned_at).toLocaleString()}</div>}
            <button onClick={() => move(i, -1)} disabled={i === 0}>Up</button>
            <button onClick={() => move(i, 1)} disabled={i === data.items.length - 1}>Down</button>
            <button onClick={() => remove(it.id)}>Remove</button>
          </li>
        ))}
      </ol>
      <button onClick={toggleShare}>{data.share?.is_active ? 'Stop sharing' : 'Share trip'}</button>
      {data.share?.is_active && <p>Link: {window.location.origin}/#/shared/{data.share.token}</p>}
    </main>
  );
}
