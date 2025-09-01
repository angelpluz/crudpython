import { useEffect, useState } from "react";
import "../App.css";

type Item = { id: number; name: string; price: number; in_stock: boolean | number; };
const API = "http://127.0.0.1:8000";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API}/items`);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setItems(await res.json()); setError(null);
    } catch (e:any) { setError(`Load failed: ${e.message}`); }
    finally { setLoading(false); }
  }

  async function create() {
    try {
      const res = await fetch(`${API}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, price: Number(price), in_stock: true }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setName(""); setPrice("0"); await load();
    } catch (e:any) { setError(`Create failed: ${e.message}`); }
  }

  async function remove(id:number) {
    try {
      const res = await fetch(`${API}/items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await load();
    } catch (e:any) { setError(`Delete failed: ${e.message}`); }
  }

  async function toggleStock(it:Item) {
    const next = !(it.in_stock === 1 || it.in_stock === true);
    try {
      const res = await fetch(`${API}/items/${it.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: it.name, price: it.price, in_stock: next }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      await load();
    } catch (e:any) { setError(`Update failed: ${e.message}`); }
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Items CRUD<span className="brand"> (React ↔ FastAPI)</span></h1>
      </header>
      <section className="card">
        <h2 className="card__title">Add new item</h2>
        <div className="form">
          <input className="input" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="Price" type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} />
          <button className="btn btn--primary" onClick={create}>Add</button>
        </div>
        {error && <div className="alert">{error}</div>}
      </section>
      <section className="card">
        <div className="table__header">
          <h2 className="card__title">Inventory</h2>
          <span className="badge">{items.length} items</span>
        </div>
        {loading ? (
          <div className="skeleton">Loading...</div>
        ) : (
          <div className="table__wrap">
            <table className="table">
              <thead><tr><th>ID</th><th>Name</th><th>Price</th><th>In stock</th><th>Action</th></tr></thead>
              <tbody>
                {items.map(it => {
                  const inStock = it.in_stock === 1 || it.in_stock === true;
                  return (
                    <tr key={it.id}>
                      <td>{it.id}</td>
                      <td className="td--name">{it.name}</td>
                      <td>฿ {Number(it.price).toFixed(2)}</td>
                      <td>
                        <button className={`toggle ${inStock ? "toggle--on" : ""}`} onClick={()=>toggleStock(it)} title="Toggle stock">
                          <span className="toggle__knob" />
                        </button>
                      </td>
                      <td><button className="btn btn--ghost" onClick={()=>remove(it.id)}>Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <footer className="page__footer"><small>© {new Date().getFullYear()} CRUD Demo • Styled for interview</small></footer>
    </main>
  );
}
