"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useEffect, useCallback } from "react";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTopBarActions } from "../components/contexts/topbar-actions"; // 경로 맞추기
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Stack,
    Tabs,
    Tab,
    Typography,
} from "@mui/material";

type Lead = any;

const FILTERS = [
    { value: "ALL", label: "전체" },
    { value: "NEW", label: "NEW" },
    { value: "NO_ANSWER", label: "부재" },
    { value: "CONSULT_DONE", label: "상담완료" },
    { value: "HOLD", label: "보류" },
    { value: "REJECTED", label: "부적합" },
];

function gradeChipColor(grade?: string) {
    if (grade === "A") return "success" as const;
    if (grade === "B") return "info" as const;
    if (grade === "C") return "warning" as const;
    if (grade === "REJECT" || grade === "REJECTED") return "error" as const;
    return "default" as const;
}

function statusChipProps(status?: string) {
    switch (status) {
        case "NEW":
            return { label: "NEW", color: "success" as const };
        case "NO_ANSWER":
            return { label: "부재", color: "warning" as const };
        case "CONSULT_DONE":
            return { label: "상담완료", color: "info" as const };
        case "HOLD":
            return { label: "보류", color: "secondary" as const };
        case "REJECTED":
            return { label: "부적합", color: "error" as const };
        default:
            return { label: status || "NEW", color: "default" as const };
    }
}

function gradeRank(g?: string) {
    if (g === "A") return 1;
    if (g === "B") return 2;
    if (g === "C") return 3;
    if (g === "REJECT" || g === "REJECTED") return 9;
    return 5;
}

function phoneToTel(phone?: string) {
    const p = String(phone || "").replace(/[^0-9]/g, "");
    return p ? `tel:${p}` : "";
}

export default function InboxClient({
                                        initialLeads,
                                        initialError,
                                    }: {
    initialLeads: Lead[];
    initialError: string;
}) {

    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [filter, setFilter] = useState<string>("ALL");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState(initialError);
    const { setActions, clearActions } = useTopBarActions();

    const refreshFromApi = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const res = await fetch("/api/leads", { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "failed");
            setLeads(json.leads || []);
        } catch (e: any) {
            setErr(e.message || "error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setActions(
            <IconButton aria-label="새로고침" onClick={refreshFromApi} disabled={loading} edge="end">
                <RefreshIcon />
            </IconButton>
        );
        return () => clearActions();
    }, [setActions, clearActions, refreshFromApi, loading]);

    const filtered = useMemo(() => {
        const xs = filter === "ALL" ? leads : leads.filter((l) => (l.status || "NEW") === filter);
        return [...xs].sort((a, b) => {
            const gr = gradeRank(a.grade) - gradeRank(b.grade);
            if (gr !== 0) return gr;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    }, [leads, filter]);

    async function setStatusIfChanged(id: string, nextStatus: string) {
        const current = (leads.find((l) => l.id === id)?.status || "NEW") as string;
        if (current === nextStatus) return;

        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: nextStatus } : l)));

        const res = await fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
        });

        if (!res.ok) {
            await refreshFromApi();
            const j = await res.json().catch(() => ({}));
            alert(j.error || "저장 실패");
        }
    }

    async function undoToNew(id: string) {
        const current = (leads.find((l) => l.id === id)?.status || "NEW") as string;
        if (current === "NEW") return;

        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: "NEW" } : l)));

        const res = await fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "NEW" }),
        });

        if (!res.ok) {
            await refreshFromApi();
            const j = await res.json().catch(() => ({}));
            alert(j.error || "되돌리기 실패");
        }
    }

    return (
        <Stack spacing={2}>

            <Box
                sx={{
                    position: "sticky",
                    top: 64, // AppBar 높이(기본 64). 모바일 dense면 56
                    zIndex: 5,
                    bgcolor: "background.default",
                    pt: 0.5,
                    pb: 0.5,
                }}
            >
                <Tabs
                    value={filter}
                    onChange={(_, v) => setFilter(v)}
                    variant="fullWidth"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        px: 0.5,
                        minHeight: 34,
                        "& .MuiTab-root": {
                            minHeight: 34,
                            px: 0.5,                     // ✅ 패딩 최소
                            minWidth: 0,                 // ✅ Tab 최소폭 제한 해제
                            fontSize: 12,                // ✅ 글자 작게
                            fontWeight: 800,
                            lineHeight: 1,
                        },
                        "& .MuiTabs-indicator": { height: 2 },
                    }}
                >
                    {FILTERS.map((f) => (
                        <Tab key={f.value} value={f.value} label={f.label} />
                    ))}
                </Tabs>
            </Box>

            {err ? <Alert severity="error">{err}</Alert> : null}

            <Stack spacing={2}>
                {filtered.map((l) => {
                    const st = l.status || "NEW";
                    const isNoAnswer = st === "NO_ANSWER";
                    const isDone = st === "CONSULT_DONE";
                    const isHold = st === "HOLD";
                    const isRejected = st === "REJECTED";
                    const showUndo = st !== "NEW";

                    const sp = statusChipProps(st);
                    const tel = phoneToTel(l.phone);

                    return (
                        <Card key={l.id} variant="outlined" sx={{ borderRadius: 3 }}>
                            <CardActionArea component={Link} href={`/leads/${l.id}`}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip size="small" label={l.grade || "-"} color={gradeChipColor(l.grade)} />
                                            <Typography fontWeight={900}>{l.name || "(이름없음)"}</Typography>
                                        </Stack>
                                        <Chip size="small" label={sp.label} color={sp.color} />
                                    </Stack>

                                    <Typography sx={{ mt: 0.5, fontWeight: 800 }}>
                                        {l.phone}
                                    </Typography>

                                    <Stack direction="row" spacing={1} sx={{ mt: 0.75 }} alignItems="center">
                                        <Chip size="small" variant="outlined" label={`예산 ${l.budget_raw || "-"}`} />
                                        <Typography variant="body2" color="text.secondary">
                                            {l.type} · {l.area}
                                        </Typography>
                                    </Stack>

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                            mt: 0.5,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: { xs: 2, sm: 1 },
                                            WebkitBoxOrient: "vertical",
                                        }}
                                    >
                                        {l.address_full}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>

                            <Box sx={{ px: 2, pb: 2 }}>
                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 1fr",
                                        gap: 1,
                                    }}
                                >


                                    <Button
                                        fullWidth
                                        variant={isDone ? "contained" : "outlined"}
                                        color="success"
                                        disabled={isDone}
                                        onClick={() => setStatusIfChanged(l.id, "CONSULT_DONE")}
                                    >
                                        {isDone ? "✓ 상담완료" : "상담완료"}
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant={isNoAnswer ? "contained" : "outlined"}
                                        color="warning"
                                        disabled={isNoAnswer}
                                        onClick={() => setStatusIfChanged(l.id, "NO_ANSWER")}
                                    >
                                        {isNoAnswer ? "✓ 부재" : "부재"}
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant={isHold ? "contained" : "outlined"}
                                        color="secondary"
                                        disabled={isHold}
                                        onClick={() => setStatusIfChanged(l.id, "HOLD")}
                                    >
                                        {isHold ? "✓ 보류" : "보류"}
                                    </Button>
                                    <Button
                                        fullWidth
                                        variant={isRejected ? "contained" : "outlined"}
                                        color="error"
                                        disabled={isRejected}

                                        onClick={() => setStatusIfChanged(l.id, "REJECTED")}
                                    >
                                        {isRejected ? "✓ 부적합" : "부적합"}
                                    </Button>
                                </Box>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    component="a"
                                    href={tel}
                                    disabled={!tel}
                                    sx={{ mt: 1 }}
                                >
                                    전화
                                </Button>
                                {showUndo && (
                                    <Button
                                        size="small"
                                        variant="text"
                                        sx={{ mt: 0.5 }}
                                        onClick={() => undoToNew(l.id)}
                                    >
                                       되돌리기
                                    </Button>
                                )}
                            </Box>
                        </Card>
                    );
                })}
            </Stack>
        </Stack>
    );
}