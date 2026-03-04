"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, Divider, Skeleton, Stack, Typography } from "@mui/material";

type Notice = {
    title: string;
    subtitle?: string;
    phone?: string;
    regionText?: string;
    openInfo?: string[];
    extra?: string[];
};

function NoticeSkeleton() {
    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
                <Stack spacing={1}>
                    <Skeleton variant="text" width="55%" height={28} />
                    <Skeleton variant="text" width="35%" height={22} />
                    <Divider sx={{ my: 0.5 }} />
                    <Skeleton variant="rounded" height={72} />
                </Stack>
            </CardContent>
        </Card>
    );
}
function NoticeCard({ notice }: { notice: Notice }) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
                <Typography fontWeight={900} sx={{ fontSize: 18 }}>
                    {notice.title}
                </Typography>
                {notice.subtitle ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notice.subtitle}
                    </Typography>
                ) : null}

                <Divider sx={{ my: 1 }} />


                {notice.openInfo?.length ? (
                    <Stack spacing={0.25} sx={{ mb: 1 }}>
                        {notice.openInfo.map((t) => (
                            <Typography key={t} variant="body2">{t}</Typography>
                        ))}
                    </Stack>
                ) : null}

                {notice.phone ? <Typography variant="body2">{notice.phone}</Typography> : null}

                {notice.regionText ? (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        {notice.regionText}
                    </Typography>
                ) : null}

                {notice.extra?.length ? (
                    <Stack spacing={0.25} sx={{ mt: 1 }}>
                        {notice.extra.map((t) => (
                            <Typography key={t} variant="body2" color="text.secondary">
                                • {t}
                            </Typography>
                        ))}
                    </Stack>
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