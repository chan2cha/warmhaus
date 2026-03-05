export type Ctx = { params: Promise<{ id: string }> };
export type Rules = {
    preferredBudgetManwon?: number;
    minBudgetManwon?: number;
    allowedRegions: string[]; // 주소에 포함될 키워드들
    closedMonths: string[];   // ["2026-03","2026-04"]
    partialOpen?: string[]; // { ["2026-03-15] }

    closedMonthAction?: "REJECTED" | "HOLD";
};
export type Notice = {
    title: string;
    subtitle?: string;
    phone?: string;
    extra?: string[];
};

type PreferredSlot = { startLocal: string };

