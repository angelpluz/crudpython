import { useEffect, useMemo, useRef, useState } from "react";

type Props = { onClose: () => void; onSaved: () => void };

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;      // YYYY-MM-DD
  address: string;
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function UserForm({ onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [fatal, setFatal] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // focus ช่องแรก + ปิดด้วย ESC + ล็อก scroll พื้นหลัง
  useEffect(() => {
    firstInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) onClose(); };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const validate = (s: FormState): Errors => {
    const next: Errors = {};
    if (!s.first_name.trim()) next.first_name = "Required";
    if (!s.last_name.trim()) next.last_name = "Required";
    if (!s.email.trim()) next.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(s.email.trim())) next.email = "Invalid email format";
    if (s.dob && !/^\d{4}-\d{2}-\d{2}$/.test(s.dob)) next.dob = "Use YYYY-MM-DD";
    return next;
  };

  const isValid = useMemo(() => Object.keys(validate(form)).length === 0, [form]);

  function onChange<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((s) => ({ ...s, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    setFatal(null);
    if (Object.keys(v).length) return;

    try {
      setSaving(true);
      const res = await fetch("http://127.0.0.1:8000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail ?? `Save failed (${res.status})`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setFatal(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // คลิกนอกกล่องเพื่อปิด (ถ้าไม่กำลังเซฟ)
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onBackdropClick}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Add user</h3>

        <form onSubmit={onSubmit} noValidate>
          {/* 2 คอลัมน์: ชื่อ/นามสกุล */}
          <div className="grid-2">
            <div>
              <input
                ref={firstInputRef}
                placeholder="First name"
                value={form.first_name}
                onChange={(e) => onChange("first_name", e.target.value)}
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name && <small className="field-error">{errors.first_name}</small>}
            </div>
            <div>
              <input
                placeholder="Last name"
                value={form.last_name}
                onChange={(e) => onChange("last_name", e.target.value)}
                aria-invalid={!!errors.last_name}
              />
              {errors.last_name && <small className="field-error">{errors.last_name}</small>}
            </div>
          </div>

          {/* 2 คอลัมน์: Email / Phone */}
          <div className="grid-2 mt-10">
            <div>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <small className="field-error">{errors.email}</small>}
            </div>
            <div>
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => onChange("phone", e.target.value)}
              />
            </div>
          </div>

          {/* DOB / Address */}
          <div className="grid-2 mt-10">
            <div>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => onChange("dob", e.target.value)}
                aria-invalid={!!errors.dob}
              />
              {errors.dob && <small className="field-error">{errors.dob}</small>}
            </div>
            <div>
              <input
                placeholder="Address"
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
              />
            </div>
          </div>

          {fatal && <div className="alert mt-10">{fatal}</div>}

          <div className="modal-actions">
            <button className="btn btn--primary" type="submit" disabled={!isValid || saving}>
              {saving ? "Saving..." : "Create"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
