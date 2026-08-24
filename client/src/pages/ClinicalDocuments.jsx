import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Stethoscope } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonTable } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ClinicalDocuments() {
  const [docs, setDocs] = useState(null);
  const [form, setForm] = useState({ claimId: "", patientId: "", title: "" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);
  const toast = useToast();

  async function load() {
    try {
      const res = await api.get("/clinical-documents");
      setDocs(res.data.data);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return toast.error("Please select a clinical document.");
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    try {
      await api.post("/clinical-documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setForm({ claimId: "", patientId: "", title: "" });
      toast.success("Clinical document uploaded.");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <DashboardLayout title="Clinical Documents">
      <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2.5">
        Use synthetic documents only. This educational prototype does not connect to real EHR systems.
      </div>

      <form onSubmit={handleUpload} className="card p-5 mb-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Related Claim ID (optional)</label>
          <input className="input" value={form.claimId} onChange={(e) => setForm({ ...form, claimId: e.target.value })} placeholder="CLM-2026-001" />
        </div>
        <div>
          <label className="label">Patient ID (optional)</label>
          <input className="input" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="PT-10045" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Document Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Patient Clinical Notes" required />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Clinical Document (PDF or TXT)</label>
          <input ref={fileInput} type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
        </div>
        <div className="sm:col-span-2">
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={busy} className="btn-primary">
            <Upload size={15} /> {busy ? "Uploading…" : "Upload Document"}
          </motion.button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted text-left text-xs text-ink-500 uppercase">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Claim ID</th>
              <th className="px-4 py-3 font-medium">Patient ID</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {docs === null && <SkeletonTable rows={3} cols={4} />}
            {docs?.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-14 text-center">
                <Stethoscope size={26} className="mx-auto text-ink-400/50 mb-2" />
                <p className="text-ink-400 text-sm">No clinical documents uploaded yet.</p>
              </td></tr>
            )}
            {docs?.map((d) => (
              <tr key={d._id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{d.title}</td>
                <td className="px-4 py-3 text-ink-700 mono">{d.claimId || "—"}</td>
                <td className="px-4 py-3 text-ink-700 mono">{d.patientId || "—"}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(d.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
