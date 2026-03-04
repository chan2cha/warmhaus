export type Ctx = { params: Promise<{ id: string }> };
export type Rules = {
    preferredBudgetManwon: number;
    minBudgetManwon: number;
    allowedRegions: string[]; // 주소에 포함될 키워드들
    closedMonths: string[];   // ["2026-03","2026-04"]
    partialOpen?: Record<string, { fromDay: number }>; // { "2026-03": { fromDay: 15 } }

    closedMonthAction?: "REJECTED" | "HOLD";
};
