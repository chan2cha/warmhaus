import { useMemo, useState,useEffect } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip, Collapse,
    Divider,
    IconButton, Skeleton,
    Stack,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
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
    return p ? `${p}` : "";
}

function NoticeCard({ notice }: { notice: Notice }) {
    const tel = useMemo(() => phoneToTel(notice.phone), [notice.phone]);
    const [open, setOpen] = useState(false);
    const deadlineChips = useMemo(() => {
        const xs = (notice.openInfo ?? []).filter(Boolean);

        // "마감" 먼저 오게만 정렬(원치 않으면 이 sort 블록 삭제)
        return xs.sort((a, b) => {
            const aIsClose = /\[\d{4}-\d{2}\].*마감/.test(a);
            const bIsClose = /\[\d{4}-\d{2}\].*마감/.test(b);
            if (aIsClose === bIsClose) return 0;
            return aIsClose ? -1 : 1;
        });
    }, [notice.openInfo]);


    const extras = notice.extra || [];


    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>

                        <Typography variant="subtitle1" fontWeight={800} >
                            {notice.title}
                        </Typography>


                    {tel && (<Button
                        size="small"
                        variant="contained"
                        startIcon={<PhoneInTalkIcon />}
                        href={`${notice.phone}`}
                        sx={{
                            borderRadius: 999,
                            px: 1.5,
                            minWidth: 0,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {tel}
                    </Button>
                        )}
                </Stack>

                <Box
                    sx={{
                        mt: 1,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                        flexWrap:"wrap"
                    }}
                >

                    {/* 좌측: 마감/부분허용월 세로로 쌓기 */}
                    <Stack spacing={1} sx={{ flex: "1 1 220px", minWidth: 0 }}>
                        {deadlineChips.map((t, idx) => (
                            <Chip
                                key={`${t}-${idx}`}
                                label={t}
                                size="small"
                                color={/마감/.test(t) ? "warning" : "info"}
                                sx={{
                                    height:"auto",
                                    width: "fit-content",
                                    maxWidth: "100%",
                                    "& .MuiChip-label": { display:"block",whiteSpace: "normal",overflow: "visible", textOverflow: "clip",overflowWrap:"anywhere", lineHeight: 1.2,
                                        py: 0.25, },
                                }}
                            />
                        ))}
                    </Stack>

                    {/* 우측: 시공가능지역 chip */}
                    {notice.regionText && (
                        <Chip
                            label={notice.regionText}
                            size="small"
                            variant="outlined"
                            sx={{
                                height:"auto",
                                width: "fit-content",
                                maxWidth: "100%",
                                "& .MuiChip-label": { display:"block",whiteSpace: "normal",overflow: "visible", textOverflow: "clip",overflowWrap:"anywhere" },
                            }}
                        />
                    )}

                </Box>
                {/* ✅ 추가 안내: 기본 표시(펼침) BUT 카드 높이 폭주 방지 위해 3줄 클램프 + 더보기 */}
                {extras.length ? (
                    <>
                        <Divider sx={{ my: 1.5 }} />

                        {/* 더보기: 가운데 정렬 아코디언 아이콘 */}
                        <Box sx={{ display: "flex", justifyContent: "center" }}>
                            <IconButton
                                size="small"
                                onClick={() => setOpen((v) => !v)}
                                aria-label={open ? "접기" : "펼치기"}
                            >
                                {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                        </Box>

                        <Collapse in={open} timeout="auto" unmountOnExit>
                            <Typography
                                variant="body2"
                                sx={{ mt: 1, whiteSpace: "pre-line", color: "text.secondary" }}
                            >
                                {extras}
                            </Typography>
                        </Collapse>
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