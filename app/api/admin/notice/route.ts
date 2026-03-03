import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isAdminEmail(email?: string | null) {
    const raw = process.env.ADMIN_EMAILS || "";
    const allow = raw.split(",").map((s) => s.trim()).filter(Boolean);
    return !!email && allow.includes(email);
}

export async function PATCH(req: Request) {
    // ✅ 아주 MVP: 헤더로 이메일을 보내고 allowlist로 검증
    // (다음 단계에서 Supabase Auth 세션 기반으로 바꾸면 됨)
    const email = req.headers.get("x-admin-email");

    if (!isAdminEmail(email)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    if (!body?.notice) {
        return NextResponse.json({ error: "notice is required" }, { status: 400 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
        .from("settings")
        .upsert({ key: "public_notice", value: body.notice }, { onConflict: "key" });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}