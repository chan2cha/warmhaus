"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = any;

const STATUS_FILTERS = [
    { value: "ALL", label: "전체" },
    { value: "NEW", label: "NEW" },
    { value: "NO_ANSWER", label: "부재" },
    { value: "CONSULT_DONE", label: "상담완료" },
    { value: "HOLD", label: "보류" },
    { value: "REJECTED", label: "부적합" },
];

function gradeRank(g?: string) {
    if (g === "A") return 1;
    if (g === "B") return 2;
    if (g === "C") return 3;
    if (g === "REJECT" || g === "REJECTED") return 9;
    return 5;
}

export default function Home() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("NEW"); // 기본 NEW

    async function load() {
        setLoading(true);
        setErr("");
        try {
            const res = await fetch("/api/leads", { cache: "no-store" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "failed");
            setLeads(json.leads || []);
        } catch (e: any) {
            setErr(e.message || "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const filtered = useMemo(() => {
        const xs = filter === "ALL" ? leads : leads.filter((l) => (l.status || "NEW") === filter);
        // A 먼저, 최신순
        return xs.sort((a, b) => {
            const gr = gradeRank(a.grade) - gradeRank(b.grade);
            if (gr !== 0) return gr;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [leads, filter]);

    async function setStatus(id: string, status: string) {
        // 낙관적 업데이트
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));

        const res = await fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });

        if (!res.ok) {
            // 실패하면 다시 로드
            await load();
            const json = await res.json().catch(() => ({}));
            alert(json.error || "저장 실패");
        }
    }

    return (
        <main style={{ padding: 16, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <h1 style={{ margin: 0 }}>Inbox</h1>
                <button
                    onClick={load}
                    disabled={loading}
                    style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd" }}
                >
                    {loading ? "새로고침..." : "새로고침"}
                </button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        style={{
                            padding: "8px 10px",
                            borderRadius: 999,
                            border: "1px solid #ddd",
                            background: filter === f.value ? "#111" : "white",
                            color: filter === f.value ? "white" : "black",
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {err ? <pre style={{ color: "crimson" }}>{err}</pre> : null}

            <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0, margin: 0 }}>
                {filtered.map((l) => (
                    <li key={l.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                        <a href={`/leads/${l.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                                <div style={{ fontWeight: 700 }}>
                                    {l.grade ? `[${l.grade}] ` : ""}{l.name || "(이름없음)"}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.7 }}>{l.status || "NEW"}</div>
                            </div>
                            <div style={{ opacity: 0.85 }}>{l.phone}</div>
                            <div style={{ fontSize: 13, marginTop: 6 }}>
                                {l.type} / {l.area} / 예산 {l.budget_raw}
                            </div>
                            <div style={{ fontSize: 13, opacity: 0.8 }}>{l.address_full}</div>
                        </a>

                        {/* 원탭 버튼 */}
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                            <a
                                href={`tel:${String(l.phone || "").replace(/[^0-9]/g, "")}`}
                                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", textDecoration: "none" }}
                            >
                                전화
                            </a>
                            <button
                                onClick={() => setStatus(l.id, "NO_ANSWER")}
                                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                            >
                                부재
                            </button>
                            <button
                                onClick={() => setStatus(l.id, "CONSULT_DONE")}
                                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                            >
                                상담완료
                            </button>
                            <button
                                onClick={() => setStatus(l.id, "REJECTED")}
                                style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd" }}
                            >
                                부적합
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </main>
    );
}