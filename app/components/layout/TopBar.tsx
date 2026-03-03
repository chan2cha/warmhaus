"use client";

import React from "react";
import {
    AppBar,
    Box,
    IconButton,
    Toolbar,
    Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTopBarActions } from "../contexts/topbar-actions";

export default function TopBar({
                                   title,
                                   drawerWidth,
                                   onOpenMobile,
                               }: {
    title: string;
    drawerWidth: number;
    onOpenMobile: () => void;
}) {
    const { actions } = useTopBarActions();

    return (
        <AppBar
            position="fixed"
            elevation={0}
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                bgcolor: "background.paper",
                color: "text.primary",
                borderBottom: "1px solid",
                borderColor: "divider",
            }}
        >
            <Toolbar sx={{ gap: 1 }}>
                <IconButton
                    color="inherit"
                    edge="start"
                    onClick={onOpenMobile}
                    sx={{ mr: 1, display: { sm: "none" } }}
                    aria-label="메뉴"
                >
                    <MenuIcon />
                </IconButton>

                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {title}
                </Typography>

                <Box sx={{ flex: 1 }} />

                {/* ✅ 페이지가 등록한 액션 */}
                {actions}
            </Toolbar>
        </AppBar>
    );
}