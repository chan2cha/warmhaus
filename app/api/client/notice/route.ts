import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PublicNotice = {
    title?: string;
    subtitle?: string;
    phone?: string;
    regionText?: string;
    openInfo?: string[];
    extra?: string[];
};

type LeadRules = {
    closedMonths?: string[]; // ["2026-03"]
    partialOpen?: Record<string, { fromDay: number }>; // {"2026-04":{fromDay:22}}
};

function formatMonthNotice(rules?: LeadRules) {
    const closed = rules?.closedMonths || [];
    const partial = rules?.partialOpen || {};

    const lines: string[] = [];

    // 완전 마감 월
    for (const m of [...closed].sort()) {
        lines.push(`[${m}] 마감`);
    }

    // 부분 허용 월
    for (const [m, v] of Object.entries(partial).sort(([a], [b]) => a.localeCompare(b))) {
        if (v?.fromDay) lines.push(`[${m}] ${v.fromDay}일부터 가능`);
    }

    return lines;
}
function formatRegionText(allowedRegions?: string[]) {
    const xs = (allowedRegions || []).map((s) => s.trim()).filter(Boolean);
    if (!xs.length) return "";

    // "서울"은 별도, 나머지는 "경기 ..." 묶음
    const hasSeoul = xs.some((x) => x === "서울" || x.startsWith("서울"));
    const gyeonggi = xs.filter((x) => x.startsWith("경기"));
    const others = xs.filter((x) => !x.startsWith("경기") && !(x === "서울" || x.startsWith("서울")));

    const parts: string[] = [];
    if (hasSeoul) parts.push("서울");

    if (gyeonggi.length) {
        // "경기 성남" -> "성남" 식으로 보기 좋게
        const ggNames = gyeonggi
            .map((x) => x.replace(/^경기\s*/, "").trim())
            .filter(Boolean);
        parts.push(`경기(${ggNames.join(", ")})`);
    }

    if (others.length) parts.push(others.join(", "));

    return `시공 가능 지역: ${parts.join(" / ")}`;
}
export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [{ data: noticeRow }, { data: rulesRow }] = await Promise.all([
        supabase.from("settings").select("value, updated_at").eq("key", "public_notice").single(),
        supabase.from("settings").select("value, updated_at").eq("key", "lead_rules").single(),
    ]);

    const notice: PublicNotice = (noticeRow?.value as any) || {};
    const rules: LeadRules = (rulesRow?.value as any) || {};

    // ✅ 룰에서 “공지용 마감/가능 라인” 생성
    const scheduleLines = formatMonthNotice(rules);

    // ✅ 공지 openInfo 앞에 자동 삽입 (원하면 뒤로 보내도 됨)
    const mergedOpenInfo = [
        ...scheduleLines,
        ...(notice.openInfo || []),
    ].filter(Boolean);
    const regionTextAuto = formatRegionText((rulesRow?.value as any)?.allowedRegions);

    return NextResponse.json({
        notice: {
            ...notice,
            regionText: regionTextAuto || notice.regionText, // ✅ 룰 기반 자동, 없으면 기존값 fallback
            openInfo: mergedOpenInfo,
        },
    });
}