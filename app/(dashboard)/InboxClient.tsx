"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import { useTopBarActions } from "../components/contexts/topbar-actions";

import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    Chip,
    Divider,
    Stack,
    Tabs,
    Tab,
    Typography,
} from "@mui/material";

type Lead = any;

type HomeTab = "TODAY" | "TOMORROW" | "THIS_WEEK" | "NO_APPT";

/**
 * 예약 시간 필드 유연하게 대응:
 * - lead.appointment_at (string)
 * - lead.appointment?.start_at
 * - lead.booking?.start_at
 * 등 추후 API 스키마 정해지면 여기만 고치면 됨.
 */
function getAppointmentStart(l: Lead): Date | null {
    const raw =
        l?.appointment_at ||
        l?.appointment?.start_at ||
        l?.appointment?.start_at?.toString?.() ||
        l?.booking?.start_at;

    if (!raw) return null;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}

function phoneToTel(phone?: string) {
    const p = String(phone || "").replace(/[^0-9]/g, "");
    return p ? `tel:${p}` : "";
}

function startOfDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function endOfWeek(d: Date) {
    // 주간 범위: 오늘~일요일(로컬)
    const day = d.getDay(); // 0=일
    const diff = 7 - day;
    const e = new Date(d);
    e.setDate(d.getDate() + diff);
    e.setHours(23, 59, 59, 999);
    return e;
}

function formatKoreanDateTime(d: Date) {
    // 예: 3/6(목) 14:00
    const wd = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${mm}/${dd}(${wd}) ${hh}:${mi}`;
}

// 주간 요약용: 이번주 예약들을 날짜별로 그룹
function groupByDay(leads: Lead[]) {
    const map = new Map<string, { day: Date; items: Lead[] }>();
    for (const l of leads) {
        const ap = getAppointmentStart(l);
        if (!ap) continue;
        const key = `${ap.getFullYear()}-${ap.getMonth()}-${ap.getDate()}`;
        if (!map.has(key)) map.set(key, { day: startOfDay(ap), items: [] });
        map.get(key)!.items.push(l);
    }
    const arr = [...map.values()].sort((a, b) => a.day.getTime() - b.day.getTime());
    // 각 날짜 안에서도 시간순
    for (const g of arr) {
        g.items.sort((a, b) => (getAppointmentStart(a)?.getTime() || 0) - (getAppointmentStart(b)?.getTime() || 0));
    }
    return arr;
}

const HOME_TABS: { value: HomeTab; label: string }[] = [
    { value: "TODAY", label: "오늘" },
    { value: "TOMORROW", label: "내일" },
    { value: "THIS_WEEK", label: "이번주" },
    { value: "NO_APPT", label: "미예약" },
];

export default function InboxClient({
                                        initialLeads,
                                        initialError,
                                    }: {
    initialLeads: Lead[];
    initialError: string;
}) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [tab, setTab] = useState<HomeTab>("TODAY");
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
            <Stack direction="row" spacing={0.5}>
                <IconButton
                    aria-label="캘린더 자세히보기"
                    component={Link}
                    href="/admin/calendar"
                    edge="end"
                >
                    <CalendarMonthIcon />
                </IconButton>
                <IconButton aria-label="새로고침" onClick={refreshFromApi} disabled={loading} edge="end">
                    <RefreshIcon />
                </IconButton>
            </Stack>
        );
        return () => clearActions();
    }, [setActions, clearActions, refreshFromApi, loading]);

    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const weekEnd = endOfWeek(today);

    // 1) 예약 있는 리드 / 없는 리드 분리
    const withAppt = useMemo(() => leads.filter((l) => !!getAppointmentStart(l)), [leads]);
    const noAppt = useMemo(() => leads.filter((l) => !getAppointmentStart(l)), [leads]);

    // 2) 탭별 필터
    const filtered = useMemo(() => {
        if (tab === "NO_APPT") return [...noAppt];

        const xs = withAppt.filter((l) => {
            const ap = getAppointmentStart(l)!;
            if (tab === "TODAY") return isSameDay(ap, today);
            if (tab === "TOMORROW") return isSameDay(ap, tomorrow);
            // THIS_WEEK
            return ap.getTime() >= today.getTime() && ap.getTime() <= weekEnd.getTime();
        });

        // 예약 탭은 예약시간순 정렬
        xs.sort((a, b) => (getAppointmentStart(a)?.getTime() || 0) - (getAppointmentStart(b)?.getTime() || 0));
        return xs;
    }, [tab, withAppt, noAppt, today, tomorrow, weekEnd]);

    // 3) 주간 요약용 그룹(상단 컴팩트)
    const weekGroups = useMemo(() => {
        const xs = withAppt.filter((l) => {
            const ap = getAppointmentStart(l)!;
            return ap.getTime() >= today.getTime() && ap.getTime() <= weekEnd.getTime();
        });
        return groupByDay(xs);
    }, [withAppt, today, weekEnd]);

    return (
        <Stack spacing={2}>
            {/* 탭: 예약 중심 */}
            <Box
                sx={{
                    position: "sticky",
                    top: 64,
                    zIndex: 5,
                    bgcolor: "background.default",
                    pt: 0.5,
                    pb: 0.5,
                }}
            >
                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    variant="fullWidth"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                        px: 0.5,
                        minHeight: 34,
                        "& .MuiTab-root": {
                            minHeight: 34,
                            px: 0.5,
                            minWidth: 0,
                            fontSize: 12,
                            fontWeight: 800,
                            lineHeight: 1,
                        },
                        "& .MuiTabs-indicator": { height: 2 },
                    }}
                >
                    {HOME_TABS.map((t) => (
                        <Tab key={t.value} value={t.value} label={t.label} />
                    ))}
                </Tabs>
            </Box>

            {err ? <Alert severity="error">{err}</Alert> : null}

            {/* 주간 요약 캘린더(컴팩트) - THIS_WEEK 탭일 때만 노출 */}
            {tab === "THIS_WEEK" && (
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography fontWeight={900}>이번주 예약 요약</Typography>
                            <Button component={Link} href="/admin/calendar" size="small" endIcon={<CalendarMonthIcon />}>
                                자세히보기
                            </Button>
                        </Stack>

                        <Divider sx={{ my: 1 }} />

                        {weekGroups.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                이번주 예약이 없습니다.
                            </Typography>
                        ) : (
                            <Stack spacing={1}>
                                {weekGroups.map((g) => (
                                    <Box key={g.day.toISOString()}>
                                        <Typography sx={{ fontWeight: 800, mb: 0.5 }}>
                                            {formatKoreanDateTime(new Date(g.day.getTime() + 9 * 60 * 60 * 1000)).slice(0, 7)}
                                            {/* 위 라인은 간단히 날짜만 보여주려는 목적(원하면 더 깔끔하게 바꿔줄게) */}
                                        </Typography>
                                        <Stack direction="row" spacing={1} flexWrap="wrap">
                                            {g.items.slice(0, 8).map((l) => {
                                                const ap = getAppointmentStart(l)!;
                                                return (
                                                    <Chip
                                                        key={l.id}
                                                        size="small"
                                                        label={`${String(l.name || "").slice(0, 6)} ${String(ap.getHours()).padStart(2, "0")}:${String(
                                                            ap.getMinutes()
                                                        ).padStart(2, "0")}`}
                                                        component={Link as any}
                                                        clickable
                                                        href={`/leads/${l.id}`}
                                                        sx={{ mb: 0.5 }}
                                                    />
                                                );
                                            })}
                                            {g.items.length > 8 ? (
                                                <Chip size="small" label={`+${g.items.length - 8}개`} sx={{ mb: 0.5 }} />
                                            ) : null}
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* 리스트 */}
            <Stack spacing={2}>
                {filtered.map((l) => {
                    const ap = getAppointmentStart(l);
                    const tel = phoneToTel(l.phone);

                    return (
                        <Card key={l.id} variant="outlined" sx={{ borderRadius: 3 }}>
                            <CardActionArea component={Link} href={`/leads/${l.id}`}>
                                <CardContent>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography fontWeight={900}>{l.name || "(이름없음)"}</Typography>

                                        {ap ? (
                                            <Chip size="small" color="info" label={formatKoreanDateTime(ap)} />
                                        ) : (
                                            <Chip size="small" variant="outlined" label="미예약" />
                                        )}
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

                            {/* 액션: 전화 + (선택) 예약변경은 나중에 */}
                            <Box sx={{ px: 2, pb: 2 }}>
                                <Stack direction="row" spacing={1}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        component="a"
                                        href={tel}
                                        disabled={!tel}
                                        startIcon={<PhoneInTalkIcon />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        전화
                                    </Button>

                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        component={Link}
                                        href={`/leads/${l.id}`}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        상세
                                    </Button>
                                </Stack>

                                {/* 예약 변경/취소는 2차: FullCalendar 붙인 뒤 modal로 처리 추천 */}
                            </Box>
                        </Card>
                    );
                })}
            </Stack>
        </Stack>
    );
}