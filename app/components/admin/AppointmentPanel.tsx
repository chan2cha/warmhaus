"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    TextField,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import SmsOutlinedIcon from "@mui/icons-material/SmsOutlined";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import EditCalendarOutlinedIcon from "@mui/icons-material/EditCalendarOutlined";
import EventBusyOutlinedIcon from "@mui/icons-material/EventBusyOutlined";
import CloseIcon from "@mui/icons-material/Close";
type Lead = {
    id: string;
    name?: string | null;
    phone?: string | null;
    consult_type?: "phone" | "office" | null;
};

type Appointment = {
    id: string;
    lead_id: string;
    consult_type: "phone" | "office";
    status: "NEGOTIATING" | "CONFIRMED" | "CANCELED" | "DONE" | "NO_SHOW" | "RESCHEDULE_REQUESTED";
    start_at: string | null;
    end_at: string | null;
    memo?: string | null;
    cancel_reason?: string | null;
    reschedule_reason?: string | null;
};

type CandidateStatus =
    | "PROPOSED"
    | "PENDING"
    | "CUSTOMER_CONFIRMED"
    | "CUSTOMER_DECLINED"
    | "CONFIRMED"
    | "CANCELLED";

type Candidate = {
    id: string;
    lead_id: string;
    consult_type: "phone" | "office";
    source: "client" | "admin";
    start_at: string;
    end_at: string;
    priority: number;
    note?: string | null;
    created_at: string;
    status?: CandidateStatus;
};

const OFFICE_ADDRESS = "경기도 남양주시 다산지금로 202 DIMC현대테라타워 B동 732호";
const OFFICE_PARKING = "DIMC현대테라타워 지하2층 ~4층 주차장을 이용해 주세요. 무료주차 입니다.";
const OFFICE_EXTRA = "🌞 주차장 진입로를 통해, B-3번 게이트 엘리베이터를 이용하여 7층으로 올라오시면 됩니다.";

function pad2(n: number) {
    return String(n).padStart(2, "0");
}
function weekdayKor(d: Date) {
    return ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
}
function formatKstLabel(isoOrDate: string | Date) {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    const wd = weekdayKor(d);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}(${wd}) ${pad2(
        d.getHours()
    )}:${pad2(d.getMinutes())}`;
}
function formatDateLine(isoOrDate: string | Date) {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    const wd = weekdayKor(d);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}(${wd})`;
}
function formatTimeLine(isoOrDate: string | Date) {
    const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatForMsgKst(iso: string) {
    const d = new Date(iso);
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const wd = weekdayKor(d);
    const hh = d.getHours();
    const ap = hh >= 12 ? "오후" : "오전";
    const hh12 = hh % 12 === 0 ? 12 : hh % 12;
    const min = d.getMinutes();
    return { mm, dd, wd, ap, hh12, min };
}
function consultTypeLabel(t?: "phone" | "office" | null) {
    return t === "office" ? "내방" : "전화";
}
function statusChipProps(st?: Appointment["status"]) {
    switch (st) {
        case "CONFIRMED":
            return { label: "확정", color: "success" as const };
        case "NEGOTIATING":
            return { label: "협의중", color: "warning" as const };
        case "RESCHEDULE_REQUESTED":
            return { label: "변경요청", color: "warning" as const };
        case "CANCELED":
            return { label: "취소", color: "default" as const };
        case "DONE":
            return { label: "완료", color: "info" as const };
        case "NO_SHOW":
            return { label: "노쇼", color: "error" as const };
        default:
            return { label: st || "협의중", color: "default" as const };
    }
}
function candidateChipProps(status?: CandidateStatus) {
    switch (status) {
        case "PENDING":
            return { label: "대기", color: "warning" as const };
        case "CUSTOMER_CONFIRMED":
            return { label: "고객확인", color: "info" as const };
        case "CUSTOMER_DECLINED":
            return { label: "불가", color: "error" as const };
        case "CONFIRMED":
            return { label: "확정", color: "success" as const };
        case "CANCELLED":
            return { label: "취소", color: "default" as const };
        default:
            return { label: "후보", color: "default" as const };
    }
}

function normalizePhoneForSms(phone?: string | null) {
    const raw = String(phone || "").trim();
    if (!raw) return "";
    return raw.replace(/\s/g, "").replace(/^\+82/, "0").replace(/[^0-9]/g, "");
}
function buildSmsHref(phone: string, body: string) {
    return `sms:${phone}?body=${encodeURIComponent(body)}`;
}
async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
}
function minutesBetween(startIso: string, endIso: string) {
    const s = new Date(startIso).getTime();
    const e = new Date(endIso).getTime();
    const m = Math.round((e - s) / 60000);
    return isFinite(m) && m > 0 ? m : 30;
}
function makeOfficeProposeTemplate(opts: { name?: string | null; startIso: string; durationMin: number }) {
    const { name, startIso, durationMin } = opts;
    const t = formatForMsgKst(startIso);
    const minuteStr = t.min ? `:${pad2(t.min)}` : "";
    return `안녕하세요.
웜하우스 인테리어 입니다.

${name ? `${name}님, ` : ""}${t.mm}월 ${t.dd}일(${t.wd}) ${t.ap} ${t.hh12}${minuteStr} 내방 상담 가능하실까요?
(상담은 약 ${durationMin}분~ 소요됩니다.)

가능/불가만 편하게 회신 부탁드립니다 :)`;
}
function makeOfficeConfirmTemplate(opts: { name?: string | null; startIso: string }) {
    const { name, startIso } = opts;
    const t = formatForMsgKst(startIso);
    const minuteStr = t.min ? `:${pad2(t.min)}` : "";
    return `안녕하세요.
웜하우스 인테리어 입니다.

${name ? `${name}님, ` : ""}${t.mm}월 ${t.dd}일(${t.wd}) ${t.ap} ${t.hh12}${minuteStr} [내방 상담]으로 예약 확정 되었습니다.
찾아오시는 길은 아래와 같습니다.

🍎 주소 : ${OFFICE_ADDRESS}

🍏 주차안내
${OFFICE_PARKING}

${OFFICE_EXTRA}

궁금하신 사항은 언제든지 편하게 문의 주세요.
감사합니다.`;
}
function makePhoneProposeTemplate(opts: { name?: string | null; startIso: string; durationMin: number }) {
    const { name, startIso, durationMin } = opts;
    const t = formatForMsgKst(startIso);
    const minuteStr = t.min ? `:${pad2(t.min)}` : "";
    return `안녕하세요.
웜하우스 인테리어 입니다.

${name ? `${name}님, ` : ""}${t.mm}월 ${t.dd}일(${t.wd}) ${t.ap} ${t.hh12}${minuteStr} 유선 상담 가능하실까요?
(상담은 약 ${durationMin}분 소요됩니다.)

가능/불가만 편하게 회신 부탁드립니다 :)`;
}
function makePhoneConfirmTemplate(opts: { name?: string | null; startIso: string; durationMin: number }) {
    const { name, startIso, durationMin } = opts;
    const t = formatForMsgKst(startIso);
    const minuteStr = t.min ? `:${pad2(t.min)}` : "";
    return `안녕하세요.
웜하우스 인테리어 입니다.

${name ? `${name}님, ` : ""}${t.mm}월 ${t.dd}일(${t.wd}) ${t.ap} ${t.hh12}${minuteStr} [유선 상담]으로 예약 확정 되었습니다.
(약 ${durationMin}분 소요)

해당 시간에 연락드리겠습니다. 감사합니다.`;
}

export default function AppointmentPanel({ lead }: { lead: Lead }) {
    const consultType: "phone" | "office" =
        (lead.consult_type as any) === "office" ? "office" : "phone";

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmTarget, setConfirmTarget] = useState<Candidate | null>(null);
    const [confirmMemo, setConfirmMemo] = useState("");

    const [msgOpen, setMsgOpen] = useState(false);
    const [msgBody, setMsgBody] = useState("");
    const [copied, setCopied] = useState(false);
    const [msgTarget, setMsgTarget] = useState<Candidate | null>(null);

    const [cancelOpen, setCancelOpen] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [actionReason, setActionReason] = useState("");

    const phoneForSms = useMemo(() => normalizePhoneForSms(lead.phone), [lead.phone]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const res = await fetch(`/api/leads/${lead.id}/appointments`, { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "불러오기 실패");

            setAppointment(json.appointment ?? null);
            setCandidates(Array.isArray(json.candidates) ? json.candidates : []);
        } catch (e: any) {
            setErr(e.message || "에러");
        } finally {
            setLoading(false);
        }
    }, [lead.id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const sortedCandidates = useMemo(() => {
        const xs = [...candidates];
        xs.sort((a, b) => {
            const p = (a.priority || 99) - (b.priority || 99);
            if (p !== 0) return p;
            return new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
        });
        return xs;
    }, [candidates]);
    const negotiatingCandidate = useMemo(() => {
        return sortedCandidates.find((c) => c.status === "CUSTOMER_CONFIRMED") ?? null;
    }, [sortedCandidates]);

    const hasConfirmedAppointment = appointment?.status === "CONFIRMED";

    const effectiveApptStatus: Appointment["status"] =
        appointment?.status === "CONFIRMED"
            ? "CONFIRMED"
            : negotiatingCandidate
                ? "NEGOTIATING"
                : (appointment?.status || "NEGOTIATING");

    const apptChip = statusChipProps(effectiveApptStatus);
    function openMessageDialog(candidate: Candidate, body: string) {
        setCopied(false);
        setMsgTarget(candidate);
        setMsgBody(body);
        setMsgOpen(true);
    }

    function proposeTemplate(c: Candidate) {
        const dur = minutesBetween(c.start_at, c.end_at);
        return consultType === "office"
            ? makeOfficeProposeTemplate({ name: lead.name, startIso: c.start_at, durationMin: dur })
            : makePhoneProposeTemplate({ name: lead.name, startIso: c.start_at, durationMin: dur });
    }

    function confirmTemplate(c: Candidate, memo?: string | null) {
        const dur = minutesBetween(c.start_at, c.end_at);
        const base =
            consultType === "office"
                ? makeOfficeConfirmTemplate({ name: lead.name, startIso: c.start_at })
                : makePhoneConfirmTemplate({ name: lead.name, startIso: c.start_at, durationMin: dur });
        return memo ? `${base}\n\n메모: ${memo}` : base;
    }

    function openConfirm(c: Candidate) {
        setConfirmTarget(c);
        setConfirmMemo("");
        setConfirmOpen(true);
    }

    async function markCandidatePending(candidateId: string) {
        setLoading(true);
        setErr("");
        try {
            const res = await fetch(`/api/appointment-candidates/${candidateId}/pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "대기 상태 저장 실패");

            if (Array.isArray(json.candidates)) {
                setCandidates(json.candidates);
            } else {
                await refresh();
            }

            setMsgOpen(false);
            setMsgTarget(null);
        } catch (e: any) {
            setErr(e.message || "대기 상태 저장 실패");
        } finally {
            setLoading(false);
        }
    }

    async function confirmCustomerReply(candidateId: string, replyType: "CONFIRMED" | "DECLINED") {
        setLoading(true);
        setErr("");
        try {
            const res = await fetch(`/api/appointment-candidates/${candidateId}/reply`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ replyType }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "고객 응답 반영 실패");

            if (Array.isArray(json.candidates)) {
                setCandidates(json.candidates);
            } else {
                await refresh();
            }
        } catch (e: any) {
            setErr(e.message || "고객 응답 반영 실패");
        } finally {
            setLoading(false);
        }
    }

    async function confirmSelected() {
        if (!confirmTarget) return;
        setLoading(true);
        setErr("");

        try {
            const res = await fetch(`/api/leads/${lead.id}/appointments/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidate_id: confirmTarget.id, memo: confirmMemo || null }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "확정 실패");

            setAppointment(json.appointment ?? null);
            if (Array.isArray(json.candidates)) setCandidates(json.candidates);

            setConfirmOpen(false);
            openMessageDialog(confirmTarget, confirmTemplate(confirmTarget, confirmMemo || null));
            setConfirmTarget(null);
        } catch (e: any) {
            setErr(e.message || "확정 에러");
        } finally {
            setLoading(false);
        }
    }

    async function requestReschedule() {
        if (!appointment?.id) return;
        setLoading(true);
        setErr("");
        try {
            const res = await fetch(`/api/leads/${lead.id}/appointments/reschedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointment_id: appointment.id,
                    reason: actionReason || null,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "변경 요청 실패");

            setRescheduleOpen(false);
            setActionReason("");
            await refresh();
        } catch (e: any) {
            setErr(e.message || "변경 요청 실패");
        } finally {
            setLoading(false);
        }
    }

    async function cancelConfirmedAppointment() {
        if (!appointment?.id) return;
        setLoading(true);
        setErr("");
        try {
            const res = await fetch(`/api/leads/${lead.id}/appointments/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointment_id: appointment.id,
                    reason: actionReason || null,
                }),
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "예약 취소 실패");

            setCancelOpen(false);
            setActionReason("");
            await refresh();
        } catch (e: any) {
            setErr(e.message || "예약 취소 실패");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Stack spacing={0.25}>
                        <Typography fontWeight={900}>예약/협의</Typography>
                        <Typography variant="body2" color="text.secondary">
                            상담 방식: {consultTypeLabel(consultType)} · 고객 답변 후 확정 진행
                        </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={apptChip.label} color={apptChip.color} />
                        <IconButton aria-label="새로고침" onClick={refresh} disabled={loading}>
                            {loading ? <CircularProgress size={18} /> : <RefreshIcon />}
                        </IconButton>
                    </Stack>
                </Stack>

                {err ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        {err}
                    </Alert>
                ) : null}

                {appointment?.status === "CONFIRMED" && appointment.start_at && appointment.end_at ? (
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                            <Stack spacing={0.25}>
                                <Typography variant="body2" fontWeight={700}>
                                    확정: {formatDateLine(appointment.start_at)}
                                </Typography>
                                <Typography variant="body2">
                                    {formatTimeLine(appointment.start_at)} ~ {formatTimeLine(appointment.end_at)}
                                </Typography>
                            </Stack>
                        </Alert>

                        {appointment.memo ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-line" }}>
                                메모: {appointment.memo}
                            </Typography>
                        ) : null}

                        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditCalendarOutlinedIcon />}
                                disabled={loading}
                                onClick={() => {
                                    setActionReason("");
                                    setRescheduleOpen(true);
                                }}
                            >
                                변경
                            </Button>

                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<EventBusyOutlinedIcon />}
                                disabled={loading}
                                onClick={() => {
                                    setActionReason("");
                                    setCancelOpen(true);
                                }}
                            >
                                취소
                            </Button>
                        </Stack>
                    </Box>
                ) : negotiatingCandidate ? (
                    <Box sx={{ mt: 1 }}>
                        <Alert severity="warning">
                            <Stack spacing={0.25}>
                                <Typography variant="body2" fontWeight={700}>
                                    협의중: {formatDateLine(negotiatingCandidate.start_at)}
                                </Typography>
                                <Typography variant="body2">
                                    {formatTimeLine(negotiatingCandidate.start_at)} ~ {formatTimeLine(negotiatingCandidate.end_at)}
                                </Typography>
                            </Stack>
                        </Alert>

                        {negotiatingCandidate.note ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-line" }}>
                                메모: {negotiatingCandidate.note}
                            </Typography>
                        ) : null}

                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            고객이 가능한 시간으로 확인한 상태입니다. 아래 후보에서 최종 확정을 진행해 주세요.
                        </Typography>
                    </Box>
                ) : appointment?.status === "CANCELED" ? (
                    <Alert severity="info" sx={{ mt: 1 }}>
                        예약이 취소되었습니다.
                        {appointment?.cancel_reason ? ` (${appointment.cancel_reason})` : ""}
                    </Alert>
                ) : appointment?.status === "RESCHEDULE_REQUESTED" ? (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        예약 변경 요청 상태입니다.
                        {appointment?.reschedule_reason ? ` (${appointment.reschedule_reason})` : ""}
                    </Alert>
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        고객이 입력한 희망 후보를 보고 문자 발송 후 답변을 받은 뒤 확정해 주세요.
                    </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight={900}>희망 후보</Typography>
                        <Chip size="small" variant="outlined" label={`${sortedCandidates.length}개`} />
                    </Stack>

                    {sortedCandidates.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            아직 희망 후보가 없습니다.
                        </Typography>
                    ) : (
                        <Stack spacing={1}>
                            {sortedCandidates.map((c) => {
                                const dur = minutesBetween(c.start_at, c.end_at);
                                const chip = candidateChipProps(c.status);

                                const smsDisabled =
                                    loading || c.status === "PENDING" || c.status === "CONFIRMED" || c.status === "CANCELLED";

                                const confirmDisabled =
                                    loading ||
                                    hasConfirmedAppointment ||
                                    c.status !== "CUSTOMER_CONFIRMED";

                                return (
                                    <Box
                                        key={c.id}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            p: 1.25,
                                            display: "flex",
                                            gap: 1,
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                                            <Chip
                                                size="small"
                                                label={chip.label}
                                                color={chip.color}
                                                sx={{ width: "fit-content" }}
                                            />

                                            <Typography fontWeight={800}>
                                                {formatDateLine(c.start_at)}
                                            </Typography>

                                            <Typography variant="body2" color="text.secondary">
                                                {formatTimeLine(c.start_at)} ~ {formatTimeLine(c.end_at)} ({dur}분)
                                            </Typography>

                                            {c.note ? (
                                                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                                                    {c.note}
                                                </Typography>
                                            ) : null}
                                        </Stack>

                                        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
                                            <Tooltip title="문자 템플릿">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        disabled={smsDisabled}
                                                        onClick={() => openMessageDialog(c, proposeTemplate(c))}
                                                    >
                                                        <SmsOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            {c.status === "PENDING" ? (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="success"
                                                        disabled={loading}
                                                        onClick={() => confirmCustomerReply(c.id, "CONFIRMED")}
                                                    >
                                                        가능 답변
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="error"
                                                        disabled={loading}
                                                        onClick={() => confirmCustomerReply(c.id, "DECLINED")}
                                                    >
                                                        불가 답변
                                                    </Button>
                                                </>
                                            ) : null}

                                            <Button
                                                size="small"
                                                variant={c.status === "CUSTOMER_CONFIRMED" ? "contained" : "outlined"}
                                                startIcon={c.status === "PENDING" ? <HourglassEmptyIcon /> : undefined}
                                                disabled={confirmDisabled}
                                                onClick={() => openConfirm(c)}
                                            >
                                                {c.status === "PENDING" ? "대기중" : "확정"}
                                            </Button>
                                        </Stack>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            </CardContent>

            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>예약 확정</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mt: 1, fontWeight: 900 }}>
                        {confirmTarget ? `${formatKstLabel(confirmTarget.start_at)} ~ ${formatKstLabel(confirmTarget.end_at)}` : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        고객 답변 확인 후 최종 확정합니다.
                    </Typography>

                    <TextField
                        label="확정 메모(선택)"
                        value={confirmMemo}
                        onChange={(e) => setConfirmMemo(e.target.value)}
                        size="small"
                        fullWidth
                        multiline
                        minRows={2}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
                        취소
                    </Button>
                    <Button
                        onClick={confirmSelected}
                        variant="contained"
                        disabled={loading || !confirmTarget || confirmTarget.status !== "CUSTOMER_CONFIRMED"}
                    >
                        확정하기
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={msgOpen}
                onClose={() => {
                    setMsgOpen(false);
                    setMsgTarget(null);
                }}
                fullWidth
                maxWidth="sm"
            >
                <DialogTitle sx={{ pr: 6 }}>
                    문자 템플릿
                    <IconButton
                        aria-label="닫기"
                        onClick={() => {
                            setMsgOpen(false);
                            setMsgTarget(null);
                        }}
                        disabled={loading}
                        sx={{
                            position: "absolute",
                            right: 8,
                            top: 8,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        문구를 확인한 뒤 실제 발송 처리 후 "대기 상태로 변경"을 눌러 주세요.
                    </Typography>

                    <TextField
                        value={msgBody}
                        onChange={(e) => setMsgBody(e.target.value)}
                        fullWidth
                        multiline
                        minRows={10}
                        sx={{ mt: 1 }}
                    />

                    {copied ? (
                        <Alert severity="success" sx={{ mt: 1 }}>
                            복사되었습니다.
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={async () => setCopied(await copyToClipboard(msgBody))}
                        variant="outlined"
                        disabled={loading}
                    >
                        복사
                    </Button>

                    <Button
                        component="a"
                        href={phoneForSms ? buildSmsHref(phoneForSms, msgBody) : undefined}
                        variant="outlined"
                        disabled={!phoneForSms || loading}
                    >
                        전송
                    </Button>

                    <Button
                        variant="contained"
                        disabled={!msgTarget || loading}
                        onClick={() => {
                            if (!msgTarget) return;
                            markCandidatePending(msgTarget.id);
                        }}
                    >
                        대기 상태로 변경
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>예약 변경 요청</DialogTitle>
                <DialogContent>
                    <TextField
                        label="변경 사유"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        sx={{ mt: 1 }}
                        placeholder="예) 고객 일정 변경, 다른 시간 요청"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRescheduleOpen(false)} disabled={loading}>
                        닫기
                    </Button>
                    <Button onClick={requestReschedule} variant="contained" disabled={loading || !actionReason.trim()}>
                        변경 요청
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>예약 취소</DialogTitle>
                <DialogContent>
                    <TextField
                        label="취소 사유"
                        value={actionReason}
                        onChange={(e) => setActionReason(e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        sx={{ mt: 1 }}
                        placeholder="예) 관리자 오확정, 고객 일정 취소"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCancelOpen(false)} disabled={loading}>
                        닫기
                    </Button>
                    <Button
                        onClick={cancelConfirmedAppointment}
                        color="error"
                        variant="contained"
                        disabled={loading || !actionReason.trim()}
                    >
                        예약 취소
                    </Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
}