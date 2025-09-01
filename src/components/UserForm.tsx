import { useState } from "react";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export default function UserForm({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
  });

  async function save() {
    await fetch("http://127.0.0.1:8000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onSaved();
    onClose();
  }

  return (
    <div className="modal">
      <div className="modal__content">
        <h3>Add User</h3>
        <input placeholder="First name" onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        <input placeholder="Last name" onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Phone" onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input type="date" onChange={(e) => setForm({ ...form, dob: e.target.value })} />
        <textarea placeholder="Address" onChange={(e) => setForm({ ...form, address: e.target.value })}></textarea>

        <div className="modal__actions">
          <button className="btn" onClick={save}>Save</button>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
