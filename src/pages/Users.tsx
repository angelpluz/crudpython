import { useEffect, useMemo, useState } from "react";
import "../App.css";

type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  dob?: string;       // "YYYY-MM-DD"
  address?: string;
};

const API = "http://127.0.0.1:8000";

export default function UsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  async function load() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
        ...(q ? { q } : {}),
      });
      const res = await fetch(`${API}/users?` + params.toString());
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      setRows(await res.json());
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page, pageSize, q]);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(u: User) { setEditing(u); setShowForm(true); }
  function closeForm(refresh?: boolean) { setShowForm(false); if (refresh) load(); }

  async function remove(id: number) {
    if (!confirm(`Delete user #${id}?`)) return;
    const res = await fetch(`${API}/users/${id}`, { method: "DELETE" });
    if (!res.ok) return alert("Delete failed");
    load();
  }

  // client-side sort
  const [sortKey, setSortKey] = useState<keyof User>("first_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      const A = String(a[sortKey] ?? "").toLowerCase();
      const B = String(b[sortKey] ?? "").toLowerCase();
      return A.localeCompare(B) * (sortDir === "asc" ? 1 : -1);
    });
    return s;
  }, [rows, sortKey, sortDir]);

  function onSort(k: keyof User) {
    if (k === sortKey) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1>Users <span className="brand">(React ↔ FastAPI)</span></h1>
      </header>

      <section className="card">
        <div className="form" style={{ gridTemplateColumns: "1fr auto auto auto" }}>
          <input className="input" placeholder="Search name/email/phone"
                 value={q} onChange={(e)=>{ setPage(1); setQ(e.target.value); }} />
          <select className="input" value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
            {[10,25,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>
          <button className="btn" onClick={()=>setQ("")}>Clear</button>
          <button className="btn btn--primary" onClick={openCreate}>Add user</button>
        </div>
      </section>

      <section className="card">
        <div className="table__header">
          <h2 className="card__title">User list</h2>
          <div style={{display:"flex", gap:8}}>
            <a className="btn" href={`${API}/users/template`} target="_blank" rel="noreferrer">Download template</a>
            <UploadBox onDone={load} />
          </div>
        </div>

        {error && <div className="alert">Error: {error}</div>}
        {loading ? (
          <div className="skeleton">Loading...</div>
        ) : (
          <div className="table__wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th onClick={()=>onSort("first_name")} style={{cursor:"pointer"}}>Name</th>
                  <th onClick={()=>onSort("email")} style={{cursor:"pointer"}}>Email</th>
                  <th>Phone</th>
                  <th>DOB</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              {sorted.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="td--name">{u.first_name} {u.last_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || "-"}</td>
                  <td>{u.dob || "-"}</td>
                  <td>{u.address || "-"}</td>
                  <td style={{whiteSpace:"nowrap"}}>
                    <button className="btn" onClick={()=>openEdit(u)}>Edit</button>{" "}
                    <button className="btn btn--ghost" onClick={()=>remove(u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{display:"flex", gap:8, marginTop:12, justifyContent:"flex-end"}}>
          <button className="btn" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <span style={{alignSelf:"center"}}>Page {page}</span>
          <button className="btn" onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </section>

      {showForm && (
        <UserForm
          initial={editing || undefined}
          onClose={(refresh?: boolean)=>closeForm(refresh)}
        />
      )}
    </main>
  );
}

/* ---------- Modal Form (white theme) ---------- */
function UserForm({
  initial,
  onClose,
}: { initial?: Partial<User>, onClose: (refresh?: boolean)=>void }) {
  const [f, setF] = useState<Partial<User>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set<K extends keyof User>(k: K, v: User[K]) {
    setF(prev => ({ ...prev, [k]: v }));
  }

  // close with ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  async function submit() {
    setErr(null);
    // basic validate
    if (!f.first_name?.trim() || !f.last_name?.trim() || !f.email?.trim()) {
      setErr("First name, Last name, and Email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(f.email)) {
      setErr("Invalid email format.");
      return;
    }

    try {
      setSaving(true);
      const body = {
        first_name: f.first_name || "",
        last_name:  f.last_name  || "",
        email:      f.email      || "",
        phone:      f.phone      || "",
        dob:        f.dob || null,
        address:    f.address    || "",
      };
      const isEdit = Boolean(f.id);
      const url = isEdit ? `${API}/users/${f.id}` : `${API}/users`;
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error((await res.text()) || "Save failed");
      onClose(true);
    } catch (e: any) {
      setErr(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // overlay click to close
  const onOverlay = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  return (
    <div className="modal" onClick={onOverlay} role="dialog" aria-modal="true">
      <div className="modal__overlay" />
      <div className="modal-card" onClick={(e)=>e.stopPropagation()}>
        <h3 className="modal-title">{f.id ? "Edit user" : "Add user"}</h3>

        <div className="grid-2">
          <input className="input" placeholder="First name"
                 value={f.first_name||""} onChange={e=>set("first_name", e.target.value)} />
          <input className="input" placeholder="Last name"
                 value={f.last_name||""} onChange={e=>set("last_name", e.target.value)} />
        </div>

        <div className="grid-2">
          <input className="input" placeholder="Email"
                 value={f.email||""} onChange={e=>set("email", e.target.value)} />
          <input className="input" placeholder="Phone"
                 value={f.phone||""} onChange={e=>set("phone", e.target.value)} />
        </div>

        <div className="grid-2">
          <input className="input" type="date"
                 value={f.dob||""} onChange={e=>set("dob", e.target.value)} />
          <input className="input" placeholder="Address"
                 value={f.address||""} onChange={e=>set("address", e.target.value)} />
        </div>

        {err && <div className="alert" style={{marginTop:10}}>{err}</div>}

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={()=>onClose()} disabled={saving}>Cancel</button>
          <button className="btn btn--primary" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : (f.id ? "Save" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Upload ---------- */
function UploadBox({ onDone }: { onDone: ()=>void }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${API}/users/upload`, { method: "POST", body: fd });
    const json = await res.json();
    setResult(json);
    setBusy(false);
    onDone();
  }
  return (
    <div style={{display:"inline-flex", gap:10, alignItems:"center"}}>
      <label className="btn">
        {busy ? "Uploading..." : "Upload Excel"}
        <input type="file" accept=".xlsx,.csv" onChange={onFile} style={{ display:"none" }} />
      </label>
      {result && <small style={{color:"#9fb0c0"}}>
        {`inserted: ${result.inserted ?? 0}, updated: ${result.updated ?? 0}, skipped: ${result.skipped ?? 0}`}
      </small>}
    </div>
  );
}
