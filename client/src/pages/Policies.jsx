import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, CheckCircle2, Loader2, BookOpen } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import { SkeletonTable } from "../components/Skeletons";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function Policies() {
  const [policies, setPolicies] = useState(null);
  const [form, setForm] = useState({ payer: "", policyName: "", policyType: "Medical Necessity", version: "1.0" });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [indexingId, setIndexingId] = useState(null);
  const fileInput = useRef(null);
  const toast = useToast();

  async function load() {
    try {
      const res = await api.get("/policies");
      setPolicies(res.data.data);
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
    if (!file) return toast.error("Please select a policy PDF/TXT file.");
    setBusy(true);
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    try {
      await api.post("/policies/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setForm({ payer: "", policyName: "", policyType: "Medical Necessity", version: "1.0" });
      toast.success("Policy uploaded.");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleIndex(policyId) {
    setIndexingId(policyId);
    try {
      await api.post(`/policies/${policyId}/index`);
      toast.success("Policy indexed — ready for retrieval.");
      await load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setIndexingId(null);
    }
  }

  return (
    <DashboardLayout title="Policy Library">
      <div className="mb-5 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2.5">
        This educational prototype uses synthetic healthcare data. Do not upload real patient information.
      </div>

      <form onSubmit={handleUpload} className="card p-5 mb-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Payer</label>
          <input className="input" value={form.payer} onChange={(e) => setForm({ ...form, payer: e.target.value })} placeholder="ABC Health Insurance" required />
        </div>
        <div>
          <label className="label">Policy Name</label>
          <input className="input" value={form.policyName} onChange={(e) => setForm({ ...form, policyName: e.target.value })} placeholder="MRI Medical Necessity Policy" required />
        </div>
        <div>
          <label className="label">Policy Type</label>
          <input className="input" value={form.policyType} onChange={(e) => setForm({ ...form, policyType: e.target.value })} />
        </div>
        <div>
          <label className="label">Version</label>
          <input className="input" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Policy Document (PDF or TXT)</label>
          <input ref={fileInput} type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
        </div>
        <div className="sm:col-span-2">
          <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={busy} className="btn-primary">
            <Upload size={15} /> {busy ? "Uploading…" : "Upload Policy"}
          </motion.button>
        </div>
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-muted text-left text-xs text-ink-500 uppercase">
              <th className="px-4 py-3 font-medium">Policy Name</th>
              <th className="px-4 py-3 font-medium">Payer</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Version</th>
              <th className="px-4 py-3 font-medium">Uploaded</th>
              <th className="px-4 py-3 font-medium">Indexed Status</th>
            </tr>
          </thead>
          <tbody>
            {policies === null && <SkeletonTable rows={3} cols={6} />}
            {policies?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-14 text-center">
                <BookOpen size={26} className="mx-auto text-ink-400/50 mb-2" />
                <p className="text-ink-400 text-sm">No policies uploaded yet.</p>
              </td></tr>
            )}
            {policies?.map((p) => (
              <tr key={p.policyId} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium text-ink-900">{p.policyName}</td>
                <td className="px-4 py-3 text-ink-700">{p.payer}</td>
                <td className="px-4 py-3 text-ink-700">{p.policyType}</td>
                <td className="px-4 py-3 text-ink-700">{p.version}</td>
                <td className="px-4 py-3 text-ink-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.indexed ? (
                    <span className="inline-flex items-center gap-1 text-green-700 text-xs font-medium">
                      <CheckCircle2 size={14} /> Indexed ({p.chunkCount} chunks)
                    </span>
                  ) : (
                    <button
                      onClick={() => handleIndex(p.policyId)}
                      disabled={indexingId === p.policyId}
                      className="btn-secondary text-xs px-2.5 py-1"
                    >
                      {indexingId === p.policyId ? <Loader2 size={13} className="animate-spin" /> : null}
                      {indexingId === p.policyId ? "Indexing…" : "Index Now"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
