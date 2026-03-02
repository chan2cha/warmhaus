import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const secret = req.headers.get("x-webhook-secret");
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    let payload: any;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    // 최소 필드만 저장(나중에 grade/summary까지 확장 가능)
    const row = {
        name: payload.name ?? null,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        type: payload.type ?? null,
        address_full: payload.address_full ?? null,
        area: payload.area ?? null,
        year_built: payload.year_built ?? null,
        start_date: payload.start_date ?? null,
        movein_date: payload.movein_date ?? null,
        budget_raw: payload.budget_raw ?? null,
        channel: payload.channel ?? null,
        source: "google_form",
    };

    const { data, error } = await supabaseAdmin
        .from("leads")
        .insert(row)
        .select("id, created_at")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, lead_id: data.id, created_at: data.created_at });
}