"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    Box,
    CssBaseline,
    Divider,
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import InboxIcon from "@mui/icons-material/Inbox";
import SettingsIcon from "@mui/icons-material/Settings";

import TopBar from "./TopBar";
import { TopBarActionsProvider } from "../contexts/topbar-actions";

const DRAWER_FULL = 280;
const DRAWER_MINI = 72;

type NavItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
};

export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const theme = useTheme();

    const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));
    const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

    const drawerWidth = isLgUp ? DRAWER_FULL : DRAWER_MINI;
    const isMini = isSmUp && !isLgUp;

    const [mobileOpen, setMobileOpen] = useState(false);

    const navItems: NavItem[] = useMemo(
        () => [
            { label: "Inbox", href: "/", icon: <InboxIcon /> },
            { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
        ],
        []
    );

    const drawerContent = (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box
                sx={{
                    px: isMini ? 1 : 2,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    justifyContent: isMini ? "center" : "flex-start",
                }}
            >
                <Image src="/logo.png" alt="logo" width={32} height={32} />
                {!isMini && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={800} lineHeight={1.1}>
                            warmhaus
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            상담관리솔루션
                        </Typography>
                    </Box>
                )}
            </Box>

            <Divider />

            <List sx={{ px: isMini ? 0.5 : 1, pt: 1 }}>
                {navItems.map((item) => {
                    const selected = pathname === item.href;
                    return (
                        <ListItemButton
                            key={item.href}
                            component={Link}
                            href={item.href}
                            selected={selected}
                            onClick={() => setMobileOpen(false)}
                            sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                justifyContent: isMini ? "center" : "flex-start",
                                "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText" },
                                "&.Mui-selected .MuiListItemIcon-root": { color: "primary.contrastText" },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: isMini ? 0 : 40, justifyContent: "center" }}>
                                {item.icon}
                            </ListItemIcon>
                            {!isMini && <ListItemText primary={item.label} />}
                        </ListItemButton>
                    );
                })}
            </List>

            <Box sx={{ flex: 1 }} />
            <Divider />
            {!isMini && (
                <Box sx={{ p: 2, fontSize: 12, color: "text.secondary" }}>
                    v0.1 • internal MVP
                </Box>
            )}
        </Box>
    );

    const title = pathname === "/" ? "Home" : "Detail";

    return (
        <TopBarActionsProvider>
            <Box sx={{ display: "flex" }}>
                <CssBaseline />

                <TopBar
                    title={title}
                    drawerWidth={drawerWidth}
                    onOpenMobile={() => setMobileOpen((v) => !v)}
                />

                {/* Sidebar */}
                <Box component="nav" sx={{ width: { xs: 0, sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        sx={{
                            display: { xs: "block", sm: "none" },
                            "& .MuiDrawer-paper": { width: DRAWER_FULL },
                        }}
                    >
                        <Box sx={{ width: DRAWER_FULL }}>{drawerContent}</Box>
                    </Drawer>

                    <Drawer
                        variant="permanent"
                        open
                        sx={{
                            display: { xs: "none", sm: "block" },
                            "& .MuiDrawer-paper": {
                                width: drawerWidth,
                                boxSizing: "border-box",
                                overflowX: "hidden",
                            },
                        }}
                    >
                        {drawerContent}
                    </Drawer>
                </Box>

                {/* Main */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        width: { xs: "100%", sm: `calc(100% - ${drawerWidth}px)` },
                        p: { xs: 1, sm: 2 },
                        bgcolor: "background.default",
                        minHeight: "100vh",
                    }}
                >
                    <Toolbar />
                    {children}
                </Box>
            </Box>
        </TopBarActionsProvider>
    );
}