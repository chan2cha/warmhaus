"use client";

import React, { useContext } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";


import { ThemeSettings } from "./utils/theme/Theme";

export default function AppShell({ children }: { children: React.ReactNode }) {
    const theme = ThemeSettings();

    return (
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <ThemeProvider theme={theme}>

                    <CssBaseline />
                    {children}

            </ThemeProvider>
        </AppRouterCacheProvider>
    );
}