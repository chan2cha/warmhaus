import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 간단 검증(필요 최소)
function onlyDigits(s: string) {
    return (s || "").replace(/[^0-9]/g, "");
}

export async function POST(req: Request) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    // ✅ 스팸 최소 방지: honeypot 필드 (프론트에서 hidden으로 보내고, 채워져 있으면 봇으로 간주)
    if (body.hp) {
        return NextResponse.json({ ok: true }); // 조용히 성공 처리
    }

    const name = (body.name || "").trim();
    const phone = onlyDigits(body.phone || "");
    const address_full = (body.address_full || "").trim();
    const type = (body.type || "").trim();
    const area = (body.area || "").trim();
    const budget_raw = (body.budget_raw || "").trim();

    if (!name || phone.length < 9 || !address_full) {
        return NextResponse.json({ error: "required fields missing" }, { status: 400 });
    }

    const row = {
        name,
        phone,
        email: (body.email || "").trim() || null,
        type: type || null,
        address_full,
        area: area || null,
        year_built: (body.year_built || "").trim() || null,

        // ✅ 주소 필드(분리 저장하고 싶으면 컬럼 추가 후 저장)
         zip_code: body.zip_code || null,
         address_road: body.address_road || null,
         address_jibun: body.address_jibun || null,
         address_detail: body.address_detail || null,

        // ✅ 유입/예산범위
        channel: (body.channel || "direct_form").trim(),
        // budget_range: (body.budget_range || "").trim() || null,

        start_date: body.start_date || null,
        movein_date: body.movein_date || null,
        budget_raw: (body.budget_raw || "").trim() || null,
        status: "NEW",
        source: "public_form",
    };

    const { data, error } = await supabaseAdmin.from("leads").insert(row).select("id").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, lead_id: data.id });
}