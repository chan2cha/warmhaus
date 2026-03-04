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
        "/cover.jpg"; // TODO: 너 이미지로 교체 추천

    const HOME_URL = "https://www.warmhaus.co.kr/"; // TODO
    const BLOG_URL = "https://blog.naver.com/onepointhome"; // TODO
    const INSTA_URL = "https://www.instagram.com/warmhaus_director/"; // TODO

    return (
        <Box sx={{ minHeight: "100dvh", bgcolor: "#fff" }}>
            {/* ✅ 상단 이미지 영역 */}
            <Box sx={{ position: "relative", height: { xs: "52dvh", sm: 520 }, overflow: "hidden" }}>
                <Image
                    src={HERO_IMAGE_URL}
                    alt="WarmHaus"
                    fill
                    priority
                    sizes="100vw"
                    style={{
                        objectFit: "cover",
                        // ✅ 모바일에서 포커스 조절(원하는 구도로 값만 바꾸면 됨)
                        objectPosition: "50% 65%",
                    }}
                />

                {/* 이미지 위 그라데이션(아래로 갈수록 흰색) */}
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(to bottom, rgba(255,255,255,0) 55%, rgba(255,255,255,0.9) 80%, rgba(255,255,255,1) 100%)",
                    }}
                />
            </Box>

            {/* ✅ 하단 컨텐츠 영역 */}
            <Box
                sx={{
                    px: 2,
                    pb: "calc(env(safe-area-inset-bottom) + 20px)",
                    mt: -10, // ✅ 이미지 위로 살짝 겹치게(원치 않으면 0)
                }}
            >
                <Box sx={{ maxWidth: 520, mx: "auto" }}>
                    <Card
                        elevation={0}
                        sx={{
                            borderRadius: 4,
                            bgcolor: "rgba(255,255,255,0.70)", // 연한 유리 느낌
                            border: "1px solid rgba(0,0,0,0.06)",
                            backdropFilter: "blur(7px)",
                            boxShadow: "0 18px 40px rgba(0,0,0,0.12)",
                            p: 2,
                        }}
                    >
                        <CardContent sx={{ p: 0 }}>
                            <Stack spacing={2} alignItems="center">
                                <Stack spacing={0.75} alignItems="center">
                                    <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{BRAND}</Typography>

                                    <Typography
                                        component="a"
                                        href={`tel:${PHONE_TEL}`}
                                        sx={{ fontSize: 13, color: "text.primary", textDecoration: "none" }}
                                    >
                                        T. {PHONE_DISPLAY}
                                    </Typography>

                                    <Typography sx={{ fontSize: 12, color: "text.secondary", textAlign: "center", lineHeight: 1.5 }}>
                                        {ADDRESS}
                                    </Typography>
                                </Stack>

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
                                                    src="/warmhaus.png"
                                                    alt="WarmHaus Logo"
                                                    width={34}
                                                    height={34}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            </Box>
                                        }
                                    />

                                    <LinkButton href={BLOG_URL} external label="네이버 블로그" icon={<ArticleRoundedIcon />} />
                                    <LinkButton href="/client/form" label="견적문의" icon={<EditNoteRoundedIcon />} />
                                </Stack>

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
        </Box>
    );
}