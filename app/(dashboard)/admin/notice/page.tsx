"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Notice = {
    title: string;
    subtitle?: string;
    phone?: string;
    extra?: string[];
};

type Rules = {
    allowedRegions?: string[];
    closedMonths?: string[];
    partialOpen?: Record<string, { fromDay: number }>;
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

function formatRegionPreview(allowedRegions?: string[]) {
    const xs = (allowedRegions || []).map((s) => s.trim()).filter(Boolean);
    if (!xs.length) return "(설정된 허용 지역이 없습니다)";

    const hasSeoul = xs.some((x) => x === "서울" || x.startsWith("서울"));
    const gg = xs.filter((x) => x.startsWith("경기"));
    const others = xs.filter(
        (x) => !x.startsWith("경기") && !(x === "서울" || x.startsWith("서울"))
    );

    const parts: string[] = [];
    if (hasSeoul) parts.push("서울");

    if (gg.length) {
        const ggNames = gg
            .map((x) => x.replace(/^경기\s*/, "").trim())
            .filter(Boolean);
        parts.push(`경기(${ggNames.join(", ")})`);
    }
    if (others.length) parts.push(others.join(", "));

    return `시공 가능 지역: ${parts.join(" / ")}`;
}

function formatSchedulePreview(rules?: Rules) {
    const closed = (rules?.closedMonths || []).slice().sort();
    const partialEntries = Object.entries(rules?.partialOpen || {}).sort(([a], [b]) =>
        a.localeCompare(b)
    );

    const lines: string[] = [];
    for (const m of closed) lines.push(`[${m}] 마감`);
    for (const [m, v] of partialEntries) {
        if (v?.fromDay) lines.push(`[${m}] ${v.fromDay}일부터 가능`);
    }
    return lines.length ? lines.join("\n") : "(설정된 마감/부분허용이 없습니다)";
}

export default function AdminNoticePage() {
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [rules, setRules] = useState<Rules | null>(null);

    // form fields
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [phone, setPhone] = useState("");
    const [extraText, setExtraText] = useState("");

    // dialogs
    const [previewOpen, setPreviewOpen] = useState(false);
    const [rulesPreviewOpen, setRulesPreviewOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);

    const adminEmail = useMemo(() => "chan2cha91@gmail.com", []);

    async function load() {
        setMsg(null);
        setLoading(true);
        try {
            const [noticeRes, rulesRes] = await Promise.all([
                fetch("/api/client/notice", { cache: "no-store" }),
                fetch("/api/client/rules", { cache: "no-store" }),
            ]);

            const noticeJson = await noticeRes.json().catch(() => ({}));
            const rulesJson = await rulesRes.json().catch(() => ({}));

            const notice = noticeJson.notice || {};
            setTitle(notice.title || "");
            setSubtitle(notice.subtitle || "");
            setPhone(notice.phone || "");
            setExtraText(arrayToLines(notice.extra));

            setRules(rulesJson.rules || null);
        } catch (e: any) {
            setMsg({ type: "error", text: e.message || "불러오기 실패" });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    const previewNotice: Notice = useMemo(
        () => ({
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            phone: phone.trim() || undefined,
            extra: linesToArray(extraText),
        }),
        [title, subtitle, phone, extraText]
    );

    async function save() {
        setMsg(null);
        setLoading(true);
        try {
            if (!previewNotice.title) throw new Error("제목(title)은 필수입니다.");

            const res = await fetch("/api/admin/notice", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "x-admin-email": adminEmail,
                },
                body: JSON.stringify({ notice: previewNotice }),
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
            {/* ✅ 미니멀 안내바 (모바일 친화) */}
            <Card variant="outlined" sx={{ borderRadius: 3, mb: 2 }}>
                <CardContent sx={{ py: 0.75, "&:last-child": { pb: 0.75 } }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 13, fontWeight: 800 }} noWrap>
                                안내
                            </Typography>
                            <IconButton size="small" onClick={() => setHelpOpen(true)} aria-label="help">
                                <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                        </Stack>

                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                            <Button size="small" variant="text" onClick={() => setRulesPreviewOpen(true)} disabled={loading}>
                                룰 미리보기
                            </Button>
                            <Button size="small" variant="outlined" href="/admin/rules">
                                Rules
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

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

                            <TextField
                                label="연락처"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                fullWidth
                            />

                            <Divider />

                            {/* ✅ 가능 월 안내 필드 제거됨 */}

                            <TextField
                                label="추가 안내 문구 (줄바꿈으로 여러 줄 입력)"
                                value={extraText}
                                onChange={(e) => setExtraText(e.target.value)}
                                fullWidth
                                multiline
                                minRows={5}
                                placeholder={`예)\n공사 일정은 가까운 순서대로 순차적으로 연락드립니다.\n견적 문의 작성 후, 유선 전화 및 메시지 알림 부탁드립니다.`}
                            />

                            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                                <Button variant="outlined" onClick={() => setPreviewOpen(true)} disabled={loading}>
                                    미리보기
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

            {/* ✅ 안내(도움말) Dialog */}
            <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>안내</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                        • 시공 가능 지역 / 마감 월(부분허용 포함)은 <b>Admin Rules</b>에서 관리됩니다.
                        <br />
                        • 이 페이지에서는 공지 문구(제목/부제/연락처/추가 안내)만 수정합니다.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setHelpOpen(false)}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* ✅ 룰 미리보기 Dialog */}
            <Dialog open={rulesPreviewOpen} onClose={() => setRulesPreviewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>룰 미리보기</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        <Typography fontWeight={900}>시공 가능 지역</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {formatRegionPreview(rules?.allowedRegions)}
                        </Typography>

                        <Divider />

                        <Typography fontWeight={900}>마감 / 부분허용</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {formatSchedulePreview(rules || undefined)}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRulesPreviewOpen(false)}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* ✅ 공지 미리보기 Dialog */}
            <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>공지사항 미리보기</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={1.5}>
                        <Typography variant="h6" fontWeight={900}>
                            {previewNotice.title || "(제목 없음)"}
                        </Typography>

                        {previewNotice.subtitle ? (
                            <Typography color="text.secondary">{previewNotice.subtitle}</Typography>
                        ) : null}

                        <Divider />

                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {formatRegionPreview(rules?.allowedRegions)}
                        </Typography>

                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {formatSchedulePreview(rules || undefined)}
                        </Typography>

                        {previewNotice.phone ? (
                            <Typography variant="body2">연락처: {previewNotice.phone}</Typography>
                        ) : null}

                        {previewNotice.extra?.length ? (
                            <>
                                <Divider />
                                <Typography fontWeight={900}>추가 안내</Typography>
                                <Stack spacing={0.5}>
                                    {previewNotice.extra.map((line, idx) => (
                                        <Typography key={idx} variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                                            • {line}
                                        </Typography>
                                    ))}
                                </Stack>
                            </>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewOpen(false)}>닫기</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}