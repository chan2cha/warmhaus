"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type TopBarActionsContextValue = {
    actions: React.ReactNode;
    setActions: (node: React.ReactNode) => void;
    clearActions: () => void;
};

const TopBarActionsContext = createContext<TopBarActionsContextValue | null>(null);

export function TopBarActionsProvider({ children }: { children: React.ReactNode }) {
    const [actions, setActionsState] = useState<React.ReactNode>(null);

    const setActions = useCallback((node: React.ReactNode) => {
        setActionsState(node);
    }, []);

    const clearActions = useCallback(() => {
        setActionsState(null);
    }, []);

    const value = useMemo<TopBarActionsContextValue>(
        () => ({ actions, setActions, clearActions }),
        [actions, setActions, clearActions]
    );

    return <TopBarActionsContext.Provider value={value}>{children}</TopBarActionsContext.Provider>;
}

export function useTopBarActions() {
    const ctx = useContext(TopBarActionsContext);
    if (!ctx) throw new Error("useTopBarActions must be used within TopBarActionsProvider");
    return ctx;
}