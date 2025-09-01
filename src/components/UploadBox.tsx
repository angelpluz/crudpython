import { useState } from "react";

export default function UploadBox({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch("http://127.0.0.1:8000/users/upload", {
      method: "POST",
      body: fd,
    });
    setBusy(false);
    onDone();
  }

  return (
    <label className="btn">
      {busy ? "Uploading..." : "Upload Excel"}
      <input type="file" accept=".xlsx,.csv" onChange={onFile} style={{ display: "none" }} />
    </label>
  );
}
