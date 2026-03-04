import { useMemo, useState,useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton, Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
type Notice = {
    title: string;
    subtitle?: string;
    phone?: string;       // "01026940750"
    regionText?: string;  // "시공 가능 지역: 서울 / 경기(일부)"
    openInfo?: string[];  // ["[2026-03] 마감"]
    extra?: string[];
};
function NoticeSkeleton() { return ( <Card variant="outlined" sx={{ borderRadius: 3 }}> <CardContent> <Stack spacing={1}> <Skeleton variant="text" width="55%" height={28} /> <Skeleton variant="text" width="35%" height={22} /> <Divider sx={{ my: 0.5 }} /> <Skeleton variant="rounded" height={72} /> </Stack> </CardContent> </Card> ); }
function phoneToTel(phone?: string) {
    const p = String(phone || "").replace(/[^0-9]/g, "");
    return p ? `tel:${p}` : "";
}
function formatPhone(phone?: string) {
    const p = String(phone || "").replace(/[^0-9]/g, "");
    return p.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
}
function pickDeadline(openInfo?: string[]) {
    const xs = openInfo || [];
    const found = xs.find((t) => /\[\d{4}-\d{2}\].*마감/.test(t));
    return found || xs[0] || "";
}

function NoticeCard({ notice }: { notice: Notice }) {
    const tel = useMemo(() => phoneToTel(notice.phone), [notice.phone]);
    const deadline = useMemo(() => pickDeadline(notice.openInfo), [notice.openInfo]);
    const [expanded, setExpanded] = useState(false);

    const extras = notice.extra || [];
    const showToggle = extras.length >= 3;

    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ pb: 1.5 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={900} sx={{ fontSize: 18, lineHeight: 1.2 }}>
                            {notice.title}
                        </Typography>
                        {notice.subtitle ? (
                            <Typography variant="caption" color="text.secondary">
                                {notice.subtitle}
                            </Typography>
                        ) : null}
                    </Box>

                    {tel ? (
                        <IconButton size="small" component="a" href={tel} aria-label="전화하기">
                            <CallIcon fontSize="small" />
                        </IconButton>
                    ) : null}
                </Stack>

                {/* ✅ 요약(한눈에) */}
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                    {deadline ? (
                        <Chip
                            size="small"
                            label={deadline}
                            color="error"
                            variant="filled"
                            sx={{ fontWeight: 900 }}
                        />
                    ) : null}

                    {notice.regionText ? (
                        <Chip size="small" label={notice.regionText} variant="outlined" sx={{ fontWeight: 800 }} />
                    ) : null}

                    {notice.phone ? (
                        <Chip size="small" label={formatPhone(notice.phone)} variant="outlined" sx={{ fontWeight: 800 }} />
                    ) : null}
                </Stack>

                {/* ✅ openInfo가 마감 외에도 여러줄 내려오면 공지 섹션으로 */}
                {notice.openInfo?.length && notice.openInfo.length > 1 ? (
                    <>
                        <Divider sx={{ my: 1.25 }} />
                        <Typography fontWeight={900} variant="body2" sx={{ mb: 0.5 }}>
                            공지
                        </Typography>
                        <Stack spacing={0.25}>
                            {notice.openInfo.map((t) => (
                                <Typography key={t} variant="body2">
                                    • {t}
                                </Typography>
                            ))}
                        </Stack>
                    </>
                ) : null}

                {/* ✅ 추가 안내: 기본 표시(펼침) BUT 카드 높이 폭주 방지 위해 3줄 클램프 + 더보기 */}
                {extras.length ? (
                    <>
                        <Divider sx={{ my: 1.25 }} />
                        <Typography fontWeight={900} variant="body2" sx={{ mb: 0.5 }}>
                            추가 안내
                        </Typography>

                        <Stack
                            spacing={0.25}
                            sx={
                                expanded
                                    ? {}
                                    : {
                                        display: "-webkit-box",
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }
                            }
                        >
                            {extras.map((t, i) => (
                                <Typography key={i} variant="body2" color="text.secondary">
                                    • {t}
                                </Typography>
                            ))}
                        </Stack>

                        {showToggle ? (
                            <Button
                                size="small"
                                variant="text"
                                onClick={() => setExpanded((v) => !v)}
                                sx={{ px: 0, minWidth: 0, mt: 0.5 }}
                            >
                                {expanded ? "접기" : "더보기"}
                            </Button>
                        ) : null}
                    </>
                ) : null}
            </CardContent>
        </Card>
    );
}
export function NoticeBlock() {
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState<Notice | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            try {
                const res = await fetch("/api/client/notice", { cache: "no-store" });
                const j = await res.json().catch(() => ({}));
                if (!alive) return;
                setNotice(j.notice || null);
            } catch {
                if (!alive) return;
                setNotice(null);
            } finally {
                if (!alive) return;
                setLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, []);

    if (loading) return <NoticeSkeleton />;
    if (!notice?.title) return null;

    return <NoticeCard notice={notice} />;
}