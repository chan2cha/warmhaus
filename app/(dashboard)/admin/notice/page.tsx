"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

type Notice = {
    title: string;
    subtitle?: string;
    phone?: string;
    regionText?: string;
    closedMonths?: string[]; // ["2026-03","2026-04"]
    openInfo?: string[];     // ["2026년 4월: ..."]
    extra?: string[];        // ["...","..."]
};

// helpers
function linesToArray(s: string) {
    return (s || "")
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean);
}
function arrayToLines(arr?: string[]) {
    return (arr || []).join("\n");
}
function normalizeMonth(s: string) {
    // Accept "2026-3" -> "2026-03"
    const m = (s || "").trim();
    const match = m.match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return "";
    const year = match[1];
    const mm = String(Number(match[2])).padStart(2, "0");
    if (Number(mm) < 1 || Number(mm) > 12) return "";
    return `${year}-${mm}`;
}
function sortMonths(ms: string[]) {
    return [...ms].sort((a, b) => a.localeCompare(b));
}

export default function AdminNoticePage() {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // form fields
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [phone, setPhone] = useState("");
    const [regionText, setRegionText] = useState("");
    const [closedMonths, setClosedMonths] = useState<string[]>([]);
    const [closedMonthInput, setClosedMonthInput] = useState(""); // YYYY-MM input
    const [openInfoText, setOpenInfoText] = useState(""); // multiline -> array
    const [extraText, setExtraText] = useState(""); // multiline -> array

    // ✅ MVP 관리자 이메일 (나중에 Supabase Auth 붙이면 자동화)
    const adminEmail = useMemo(() => "chan2cha91@gmail.com", []);

    async function load() {
        setMsg(null);
        setLoading(true);
        try {
            const res = await fetch("/api/public/notice", { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            const notice: Notice = json.notice || {};

            setTitle(notice.title || "");
            setSubtitle(notice.subtitle || "");
            setPhone(notice.phone || "");
            setRegionText(notice.regionText || "");
            setClosedMonths(sortMonths(notice.closedMonths || []));
            setOpenInfoText(arrayToLines(notice.openInfo));
            setExtraText(arrayToLines(notice.extra));
        } catch (e: any) {
            setMsg({ type: "error", text: e.message || "불러오기 실패" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    function addClosedMonth(raw: string) {
        const normalized = normalizeMonth(raw);
        if (!normalized) {
            setMsg({ type: "error", text: "마감 월은 YYYY-MM 형식으로 입력해주세요. 예) 2026-03" });
            return;
        }
        setClosedMonths((prev) => sortMonths(Array.from(new Set([...prev, normalized]))));
        setClosedMonthInput("");
    }

    function removeClosedMonth(m: string) {
        setClosedMonths((prev) => prev.filter((x) => x !== m));
    }

    async function save() {
        setMsg(null);
        setLoading(true);
        try {
            const notice: Notice = {
                title: title.trim(),
                subtitle: subtitle.trim() || undefined,
                phone: phone.trim() || undefined,
                regionText: regionText.trim() || undefined,
                closedMonths: closedMonths.length ? closedMonths : undefined,
                openInfo: linesToArray(openInfoText),
                extra: linesToArray(extraText),
            };

            if (!notice.title) {
                throw new Error("제목(title)은 필수입니다.");
            }

            const res = await fetch("/api/admin/notice", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-email": adminEmail, // ✅ MVP
                },
                body: JSON.stringify({ notice }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || "저장 실패");

            setMsg({ type: "success", text: "저장 완료! (퍼블릭 폼에 즉시 반영됩니다)" });
        } catch (e: any) {
            setMsg({ type: "error", text: e.message || "error" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
            <Stack spacing={2}>
                <Typography variant="h5" fontWeight={900}>
                    공지사항 편집
                </Typography>

                {msg ? <Alert severity={msg.type}>{msg.text}</Alert> : null}

                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack spacing={2}>
                            <TextField
                                label="제목 *"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                fullWidth
                                required
                            />

                            <TextField
                                label="부제목"
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                fullWidth
                            />

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                <TextField
                                    label="연락처"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="시공 가능 지역 안내 문구"
                                    value={regionText}
                                    onChange={(e) => setRegionText(e.target.value)}
                                    fullWidth
                                />
                            </Stack>

                            <Divider />

                            <Stack spacing={1}>
                                <Typography fontWeight={900}>마감 월 (YYYY-MM)</Typography>

                                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
                                    <TextField
                                        label="예) 2026-03"
                                        value={closedMonthInput}
                                        onChange={(e) => setClosedMonthInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                addClosedMonth(closedMonthInput);
                                            }
                                        }}
                                        fullWidth
                                    />
                                    <Button
                                        variant="outlined"
                                        onClick={() => addClosedMonth(closedMonthInput)}
                                        disabled={loading}
                                        sx={{ whiteSpace: "nowrap" }}
                                    >
                                        추가
                                    </Button>
                                </Stack>

                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                    {closedMonths.length ? (
                                        closedMonths.map((m) => (
                                            <Chip
                                                key={m}
                                                label={m}
                                                onDelete={() => removeClosedMonth(m)}
                                                variant="outlined"
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">
                                            등록된 마감 월이 없습니다.
                                        </Typography>
                                    )}
                                </Stack>

                                <Typography variant="caption" color="text.secondary">
                                    * 고객이 선택한 공사 시작일(YYYY-MM)이 마감 월에 포함되면 REJECT 처리하도록 연결할 수 있습니다.
                                </Typography>
                            </Stack>

                            <Divider />

                            <TextField
                                label="가능 월 안내 (줄바꿈으로 여러 줄 입력)"
                                value={openInfoText}
                                onChange={(e) => setOpenInfoText(e.target.value)}
                                fullWidth
                                multiline
                                minRows={4}
                                placeholder={`예)\n2026년 4월: 4주차부터 가능\n2026년 5월: 상담 진행중`}
                            />

                            <TextField
                                label="추가 안내 문구 (줄바꿈으로 여러 줄 입력)"
                                value={extraText}
                                onChange={(e) => setExtraText(e.target.value)}
                                fullWidth
                                multiline
                                minRows={4}
                                placeholder={`예)\n공사 일정은 가까운 순서대로 순차적으로 연락드립니다.\n견적 문의 작성 후, 유선 전화 및 메시지 알림 부탁드립니다.`}
                            />

                            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                                <Button variant="outlined" onClick={load} disabled={loading}>
                                    불러오기
                                </Button>
                                <Button variant="contained" onClick={save} disabled={loading}>
                                    저장
                                </Button>
                            </Stack>

                            <Typography variant="caption" color="text.secondary">
                                저장하면 퍼블릭 폼 공지에 즉시 반영됩니다.
                            </Typography>
                        </Stack>
                    </CardContent>
                </Card>
            </Stack>
        </Box>
    );
}