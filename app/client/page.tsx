"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Box,
    Card,
    CardContent,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";

type LinkButtonProps = {
    href: string;
    icon: React.ReactNode;
    label: string;
    external?: boolean;
    leftAvatar?: React.ReactNode;
};

function LinkButton({ href, icon, label, external, leftAvatar }: LinkButtonProps) {
    const content = (
        <Box
            sx={{
                height: 64,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                px: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                transition: "transform 120ms ease, box-shadow 120ms ease",
                "&:hover": {
                    transform: "translateY(-1px)",
                    boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
                },
            }}
        >
            {/* 왼쪽 작은 썸네일(옵션) */}
            {leftAvatar ? <Box sx={{ width: 34, height: 34 }}>{leftAvatar}</Box> : null}

            {/* 가운데 텍스트 */}
            <Typography sx={{ fontWeight: 800, flex: 1, textAlign: "center" }}>
                {label}
            </Typography>

            {/* 오른쪽 아이콘 */}
            <Box sx={{ opacity: 0.85 }}>{icon}</Box>
        </Box>
    );

    if (external) {
        return (
            <Box
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: "none" }}
            >
                {content}
            </Box>
        );
    }

    return (
        <Box component={Link} href={href} sx={{ textDecoration: "none" }}>
            {content}
        </Box>
    );
}

export default function ClientCoverPage() {
    // TODO: 여기에 실제 주소만 넣으면 완성
    const BRAND = "웜하우스";
    const PHONE_DISPLAY = "010 7357 6717";
    const PHONE_TEL = "01073576717";
    const ADDRESS = "경기도 남양주시 다산동 6250 현대테라타워 디아이엠씨 B동 732호";

    const HERO_IMAGE_URL =
        "https://cdn.imweb.me/thumbnail/20250206/c3bd062ebc0b5.jpg"; // TODO: 너 이미지로 교체 추천

    const HOME_URL = "https://www.warmhaus.co.kr/"; // TODO
    const BLOG_URL = "https://blog.naver.com/onepointhome"; // TODO
    const INSTA_URL = "https://www.instagram.com/warmhaus_director/"; // TODO

    return (
        <Box
            sx={{
                minHeight: "100dvh",
                position: "relative",
                bgcolor: "#fff",
                overflow: "hidden",
            }}
        >
            {/* 상단 히어로 이미지 */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: `url(${HERO_IMAGE_URL})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "saturate(1.02)",
                }}
            />

            {/* 하단 그라데이션(스샷 느낌) */}
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0.94) 70%, rgba(255,255,255,1) 85%)",
                }}
            />

            {/* 컨텐츠 */}
            <Box
                sx={{
                    position: "relative",
                    zIndex: 1,
                    maxWidth: 520,
                    mx: "auto",
                    px: 2,

                    // ✅ 위 여백 줄이고
                    pt: { xs: 3, sm: 7 },

                    // ✅ 아래 여백 크게(모바일에서 더 내려감)
                    pb: { xs: 1, sm: 4 },

                    minHeight: "100dvh",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                }}
            >
                <Card
                    elevation={0}
                    sx={{
                        bgcolor: "transparent",
                        boxShadow: "none",
                    }}
                >
                    <CardContent sx={{ p: 0 }}>
                        <Stack spacing={2} alignItems="center">
                            {/* 이름/연락처/주소 */}
                            <Stack spacing={0.75} alignItems="center">
                                <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                                    {BRAND}
                                </Typography>

                                <Typography
                                    component="a"
                                    href={`tel:${PHONE_TEL}`}
                                    sx={{
                                        fontSize: 13,
                                        color: "text.primary",
                                        textDecoration: "none",
                                    }}
                                >
                                    T. {PHONE_DISPLAY}
                                </Typography>

                                <Typography
                                    sx={{
                                        fontSize: 12,
                                        color: "text.secondary",
                                        textAlign: "center",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {ADDRESS}
                                </Typography>
                            </Stack>

                            {/* 버튼 3개 */}
                            <Stack spacing={1.25} sx={{ width: "100%", mt: 1 }}>
                                <LinkButton
                                    href={HOME_URL}
                                    external
                                    label={`${BRAND} 홈페이지`}
                                    icon={<HomeRoundedIcon />}
                                    leftAvatar={
                                        <Box
                                            sx={{
                                                width: 34,
                                                height: 34,
                                                borderRadius: 1.2,
                                                overflow: "hidden",
                                                border: "1px solid",
                                                borderColor: "divider",
                                                bgcolor: "background.paper",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Image
                                                src="/warmhaus.png"   // ✅ public 기준 경로
                                                alt="WarmHaus"
                                                width={34}
                                                height={34}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                priority
                                            />
                                        </Box>
                                    }
                                />

                                <LinkButton
                                    href={BLOG_URL}
                                    external
                                    label="네이버 블로그"
                                    icon={<ArticleRoundedIcon />}
                                />

                                {/* 견적문의는 내부 라우트로 */}
                                <LinkButton
                                    href="/client/form"
                                    label="견적문의"
                                    icon={<EditNoteRoundedIcon />}
                                />
                            </Stack>

                            {/* 하단 인스타 아이콘 */}
                            <IconButton
                                component="a"
                                href={INSTA_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                    mt: 1,
                                    width: 56,
                                    height: 56,
                                    borderRadius: 999,
                                    bgcolor: "rgba(255,255,255,0.75)",
                                    border: "1px solid",
                                    borderColor: "divider",
                                    backdropFilter: "blur(8px)",
                                }}
                                aria-label="Instagram"
                            >
                                <InstagramIcon />
                            </IconButton>
                        </Stack>
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
}