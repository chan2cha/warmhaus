import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
        .from("settings")
        .upsert({ key: "lead_rules", value: body.rules }, { onConflict: "key" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}