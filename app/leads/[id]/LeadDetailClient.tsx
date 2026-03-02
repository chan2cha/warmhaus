"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = any;

const STATUS_OPTIONS = [
    { value: "NEW", label: "NEW (신규)" },
    { value: "NO_ANSWER", label: "NO_ANSWER (부재)" },
    { value: "CONSULT_DONE", label: "CONSULT_DONE (상담완료)" },
    { value: "HOLD", label: "HOLD (보류)" },
    { value: "REJECTED", label: "REJECTED (부적합)" },
];

function toDatetimeLocal(ts?: string | null) {
    if (!ts) return "";
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(v: string) {
    if (!v) return null;
    return new Date(v).toISOString();
}

export default function LeadDetailClient({ id }: { id: string }) {
    const [lead, setLead] = useState<Lead | null>(null);
    const [status, setStatus] = useState<string>("NEW");
    const [nextActionLocal, setNextActionLocal] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState("");

    useEffect(() => {
        (async () => {
            setErr("");
            const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
            const json = await res.json();
            if (!res.ok) {
                setErr(json.error || "failed to load");
                return;
            }
            setLead(json.lead);
            setStatus(json.lead.status || "NEW");
            setNextActionLocal(toDatetimeLocal(json.lead.next_action_at));
        })();
    }, [id]);

    const telHref = useMemo(() => {
        const p = (lead?.phone || "").toString().replace(/[^0-9]/g, "");
        return p ? `tel:${p}` : "";
    }, [lead?.phone]);

    async function save() {
        setSaving(true);
        setErr("");
        try {
            const res = await fetch(`/api/leads/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status,
                    next_action_at: fromDatetimeLocal(nextActionLocal),
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "save failed");
            setLead(json.lead);
        } catch (e: any) {
            setErr(e.message || "save error");
        } finally {
            setSaving(false);
        }
    }

    if (err && !lead) return <main style={{ padding: 16, color: "crimson" }}>{err}</main>;
    if (!lead) return <main style={{ padding: 16 }}>Loading...</main>;

    return (
        <main style={{ padding: 16, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {lead.name || "(이름없음)"}{" "}
                        <span style={{ fontSize: 12, opacity: 0.7 }}>{lead.grade ? `[${lead.grade}]` : ""}</span>
                    </div>
                    <div style={{ opacity: 0.8 }}>{lead.phone}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <a href={telHref} style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>
                        전화
                    </a>
                    <a href="/" style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, textDecoration: "none" }}>
                        Inbox
                    </a>
                </div>
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>요약</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{lead.summary || "-"}</div>
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>사유: {lead.reason || "-"}</div>
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 700 }}>기본정보</div>
                <div>타입: {lead.type || "-"}</div>
                <div>면적: {lead.area || "-"}</div>
                <div>준공: {lead.year_built || "-"}</div>
                <div>예산: {lead.budget_raw || "-"}</div>
                <div>시작/입주: {lead.start_date || "-"} / {lead.movein_date || "-"}</div>
                <div>유입: {lead.channel || "-"}</div>
                <div>주소: {lead.address_full || "-"}</div>
            </div>

            <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 700 }}>상태 관리</div>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>status</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10, borderRadius: 10 }}>
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                    <span>다음 액션 시간</span>
                    <input
                        type="datetime-local"
                        value={nextActionLocal}
                        onChange={(e) => setNextActionLocal(e.target.value)}
                        style={{ padding: 10, borderRadius: 10 }}
                    />
                </label>

                <button
                    onClick={save}
                    disabled={saving}
                    style={{
                        padding: 12,
                        borderRadius: 12,
                        border: "1px solid #ddd",
                        background: saving ? "#f5f5f5" : "white",
                        cursor: saving ? "not-allowed" : "pointer",
                        fontWeight: 700,
                    }}
                >
                    {saving ? "저장 중..." : "저장"}
                </button>

                {err ? <div style={{ color: "crimson" }}>{err}</div> : null}
            </div>
        </main>
    );
}