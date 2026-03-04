import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {Rules} from "@/app/type/type";
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);
function isAdminEmail(email?: string | null) {
    const raw = process.env.ADMIN_EMAILS || "";
    const allow = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return !!email && allow.includes(email);
}

export async function PATCH(req: Request) {
    const email = req.headers.get("x-admin-email");
    if (!isAdminEmail(email)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.rules) {
        return NextResponse.json({ error: "rules is required" }, { status: 400 });
    }

    const rules = (body.rules || {}) as Rules;
    // ✅ 예산 간단 검증 (원하면 제거 가능)
    const minB = Number(rules.minBudgetManwon ?? 0);
    const prefB = Number(rules.preferredBudgetManwon ?? 0);
    if (Number.isFinite(minB) && Number.isFinite(prefB) && minB > prefB) {
        return NextResponse.json({ error: "최소 예산은 선호 예산보다 클 수 없습니다." }, { status: 400 });
    }


    const nextRules: Rules = {
        ...body.rules,
        minBudgetManwon: minB,
        preferredBudgetManwon: prefB,
    };

    const { error } = await supabase
        .from("settings")
        .upsert({ key: "lead_rules", value: nextRules }, { onConflict: "key" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}