"use client";

import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

type Lead = any;

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
function phoneToTel(phone?: string) {
    const p = String(phone || "").replace(/[^0-9]/g, "");
    return p ? `tel:${p}` : "";
}
function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Typography variant="body2" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ textAlign: "right" }}>
                {value}
            </Typography>
        </Stack>
    );
}

export default function LeadDetailClient({
                                             id,
                                             initialLead,
                                             initialError,
                                         }: {
    id: string;
    initialLead: Lead | null;
    initialError: string;
}) {
    const [lead, setLead] = useState<Lead | null>(initialLead);
    const [status, setStatus] = useState<string>(initialLead?.status || "NEW");
    const [nextActionLocal, setNextActionLocal] = useState<string>(toDatetimeLocal(initialLead?.next_action_at));
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState(initialError);

    const telHref = useMemo(() => phoneToTel(lead?.phone), [lead?.phone]);

    async function refreshOne() {
        // 상세 페이지에서만 쓰는 새로고침
        const res = await fetch(`/api/leads/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            setErr(json.error || "failed");
            return;
        }
        setLead(json.lead);
        setStatus(json.lead.status || "NEW");
        setNextActionLocal(toDatetimeLocal(json.lead.next_action_at));
    }

    async function setStatusIfChanged(nextStatus: string) {
        const current = status || "NEW";
        if (current === nextStatus) return;

        setStatus(nextStatus);
        setLead((prev:any) => (prev ? { ...prev, status: nextStatus } : prev));

        const res = await fetch(`/api/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: nextStatus }),
        });

        if (!res.ok) {
            await refreshOne();
            const j = await res.json().catch(() => ({}));
            alert(j.error || "상태 저장 실패");
        }
    }

    async function undoToNew() {
        if ((status || "NEW") === "NEW") return;
        await setStatusIfChanged("NEW");
    }

    async function saveSchedule() {
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
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "save failed");

            setLead(json.lead);
            setStatus(json.lead.status || status);
            setNextActionLocal(toDatetimeLocal(json.lead.next_action_at));
        } catch (e: any) {
            setErr(e.message || "save error");
        } finally {
            setSaving(false);
        }
    }

    if (!lead) {
        return <Alert severity="error">{err || "Lead not found"}</Alert>;
    }

    const sp = statusChipProps(status || "NEW");
    const st = status || "NEW";
    const isNoAnswer = st === "NO_ANSWER";
    const isDone = st === "CONSULT_DONE";
    const isHold = st === "HOLD";
    const isRejected = st === "REJECTED";
    const showUndo = st !== "NEW";

    return (
        <Stack spacing={2}>
            {/* Header */}
            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
            >
                <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip size="small" label={lead.grade || "-"} color={gradeChipColor(lead.grade)} />
                        <Typography variant="h6" fontWeight={900}>
                            {lead.name || "(이름없음)"}
                        </Typography>
                        <Chip size="small" label={sp.label} color={sp.color} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {lead.phone}
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Button variant="outlined" href="/" size="small" sx={{ flexGrow: { xs: 1, sm: 0 } }}>
                        Home
                    </Button>
                    <Button variant="contained" href={telHref} size="small" disabled={!telHref} sx={{ flexGrow: { xs: 1, sm: 0 } }}>
                        전화
                    </Button>
                </Stack>
            </Stack>

            {err ? <Alert severity="error">{err}</Alert> : null}

            {/* Responsive layout: 모바일=세로 / md+=2컬럼처럼 보이게 */}
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
                {/* Left column */}
                <Stack spacing={2} sx={{ flex: 7 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={900} sx={{ mb: 1 }}>
                                요약
                            </Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap" }}>{lead.summary || "-"}</Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Typography variant="body2" color="text.secondary">
                                사유: {lead.reason || "-"}
                            </Typography>
                        </CardContent>
                    </Card>

                    <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography fontWeight={900} sx={{ mb: 1 }}>
                                상태 처리
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                                <Button
                                    size="small"
                                    variant={isNoAnswer ? "contained" : "outlined"}
                                    color="warning"
                                    disabled={isNoAnswer}
                                    sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                    onClick={() => setStatusIfChanged("NO_ANSWER")}
                                >
                                    {isNoAnswer ? "✓ 부재" : "부재"}
                                </Button>

                                <Button
                                    size="small"
                                    variant={isDone ? "contained" : "outlined"}
                                    color="info"
                                    disabled={isDone}
                                    sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                    onClick={() => setStatusIfChanged("CONSULT_DONE")}
                                >
                                    {isDone ? "✓ 상담완료" : "상담완료"}
                                </Button>

                                <Button
                                    size="small"
                                    variant={isHold ? "contained" : "outlined"}
                                    color="secondary"
                                    disabled={isHold}
                                    sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                    onClick={() => setStatusIfChanged("HOLD")}
                                >
                                    {isHold ? "✓ 보류" : "보류"}
                                </Button>

                                <Button
                                    size="small"
                                    variant={isRejected ? "contained" : "outlined"}
                                    color="error"
                                    disabled={isRejected}
                                    sx={{ flexGrow: { xs: 1, sm: 0 } }}
                                    onClick={() => setStatusIfChanged("REJECTED")}
                                >
                                    {isRejected ? "✓ 부적합" : "부적합"}
                                </Button>

                                {showUndo && (
                                    <Button size="small" variant="text" sx={{ flexGrow: { xs: 1, sm: 0 } }} onClick={undoToNew}>
                                        UNDO → NEW
                                    </Button>
                                )}
                            </Stack>

                            <Stack spacing={2}>
                                <FormControl size="small">
                                    <InputLabel id="status-label">status</InputLabel>
                                    <Select labelId="status-label" label="status" value={status} onChange={(e) => setStatus(e.target.value)}>
                                        <MenuItem value="NEW">NEW</MenuItem>
                                        <MenuItem value="NO_ANSWER">NO_ANSWER (부재)</MenuItem>
                                        <MenuItem value="CONSULT_DONE">CONSULT_DONE (상담완료)</MenuItem>
                                        <MenuItem value="HOLD">HOLD (보류)</MenuItem>
                                        <MenuItem value="REJECTED">REJECTED (부적합)</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    size="small"
                                    label="다음 액션 시간"
                                    type="datetime-local"
                                    value={nextActionLocal}
                                    onChange={(e) => setNextActionLocal(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />

                                <Button variant="contained" onClick={saveSchedule} disabled={saving}>
                                    {saving ? "저장 중..." : "저장"}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Stack>

                {/* Right column */}
                <Box sx={{ flex: 5 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3, height: "100%" }}>
                        <CardContent>
                            <Typography fontWeight={900} sx={{ mb: 1 }}>
                                기본정보
                            </Typography>

                            <Stack spacing={1}>
                                <InfoRow label="타입" value={lead.type || "-"} />
                                <InfoRow label="면적" value={lead.area || "-"} />
                                <InfoRow label="준공" value={lead.year_built || "-"} />
                                <InfoRow label="예산" value={lead.budget_raw || "-"} />
                                <InfoRow label="시작/입주" value={`${lead.start_date || "-"} / ${lead.movein_date || "-"}`} />
                                <InfoRow label="유입" value={lead.channel || "-"} />

                                <Divider sx={{ my: 1 }} />

                                <Typography variant="body2" fontWeight={900}>
                                    주소
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: { xs: 3, md: 6 },
                                        WebkitBoxOrient: "vertical",
                                    }}
                                >
                                    {lead.address_full || "-"}
                                </Typography>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Stack>
        </Stack>
    );
}