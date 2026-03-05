import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function onlyDigits(s: string) {
    return (s || "").replace(/[^0-9]/g, "");
}

type Grade = "A" | "B" | "C";

function budgetRangeToManwon(range: string): number | null {
    if (!range) return null;
    if (range === "over_10000") return 11000; // 1억 이상 대표값(임의)
    const m = range.match(/^(\d+)_([0-9]+)$/);
    if (!m) return null;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
    return Math.round((a + b) / 2);
}

function calcGradeByBudget(budget_range: string, minBudget: number, preferredBudget: number): Grade {
    const budget = budgetRangeToManwon(budget_range);
    if (budget == null) return "B";
    if (budget >= preferredBudget) return "A"; // ✅ 경계 포함
    if (budget <= minBudget) return "C";       // ✅ 경계 포함
    return "B";
}

async function getRulesBudgets() {
    const { data, error } = await supabaseAdmin
        .from("settings")
        .select("value")
        .eq("key", "rules")
        .single();

    if (error) {
        // rules 못 가져오면 기본값으로 동작(grade는 B로 흘러가게)
        return { minBudget: 0, preferredBudget: 999999 };
    }

    const v = (data?.value || {}) as any;
    return {
        minBudget: Number(v.minBudgetManwon ?? 0),
        preferredBudget: Number(v.preferredBudgetManwon ?? 999999),
    };
}
// datetime-local => ISO
function localToIso(localDT: string) {
    const d = new Date(localDT);
    return isNaN(d.getTime()) ? "" : d.toISOString();
}
function addMinutesIso(startIso: string, minutes: number) {
    const s = new Date(startIso).getTime();
    return new Date(s + minutes * 60 * 1000).toISOString();
}
export async function POST(req: Request) {
    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    // honeypot
    if (body.hp) return NextResponse.json({ ok: true });

    const name = (body.name || "").trim();
    const phone = onlyDigits(body.phone || "");
    const address_full = (body.address_full || "").trim();

    const budget_range = (body.budget_range || "").trim(); // ✅ 프론트에서 보내는 값
    const budget_raw = (body.budget_raw || "").trim();

    if (!name || phone.length < 9 || !address_full) {
        return NextResponse.json({ error: "required fields missing" }, { status: 400 });
    }

    // ✅ rules에서 최소/선호 예산 가져와서 grade 계산
    const { minBudget, preferredBudget } = await getRulesBudgets();
    const grade: Grade = calcGradeByBudget(budget_range, minBudget, preferredBudget);
    const consultType =
        body.consult_confirm === "office" ? "office" : "phone";

    const preferred = Array.isArray(body.preferred_slots)
        ? body.preferred_slots.map((s:any) => (s || "").trim()).filter(Boolean)
        : [];

    if (preferred.length < 1) {
        return NextResponse.json(
            { error: "preferred_slots required" },
            { status: 400 }
        );
    }
    const row = {
        name,
        phone,
        type: (body.type || "").trim() || null,
        address_full,
        year_built: (body.year_built || "").trim() || null,

        zip_code: body.zip_code || null,
        address_road: body.address_road || null,
        address_jibun: body.address_jibun || null,
        address_detail: body.address_detail || null,
        area_pyeong : body.area_pyeong || null,

        channel: (body.channel || "direct_form").trim(),
        budget_range: budget_range || null, // ✅ 컬럼 있으면 저장
        budget_raw: budget_raw || null,

        start_date: body.start_date || null,
        move_in_date: body.move_in_date || null, // ✅ 키 불일치 보정

        grade, // ✅ 여기!
        status: "NEW",
        source: "public_form",
        spec:body.spec,
        consult_type: consultType,
    };

    const { data:lead, error:leadErr } = await supabaseAdmin
        .from("leads")
        .insert(row)
        .select("id")
        .single();

    if (leadErr) return NextResponse.json({ error: leadErr.message }, { status: 500 });

    // 2) appointments (NEGOTIATING) 생성
    const { data: appt, error: apptErr } = await supabaseAdmin
        .from("appointments")
        .insert({
            lead_id: lead.id,
            consult_type: consultType,
            status: "NEGOTIATING",
        })
        .select("id")
        .single();

    if (apptErr) return NextResponse.json({ error: apptErr.message }, { status: 500 });

    // 3) candidates bulk insert (phone=2개 권장/office=3개 권장, 서버에서 컷)
    const count = consultType === "office" ? 3 : 2;
    const durationMin = consultType === "office" ? 90 : 30;

    const slots = preferred.slice(0, count);

    const rows = slots.map((local:string, idx:number) => {
        const startIso = localToIso(local);
        if (!startIso) {
            throw new Error("invalid preferred_slots datetime");
        }
        const endIso = addMinutesIso(startIso, durationMin);

        return {
            lead_id: lead.id,
            appointment_id: appt.id,
            consult_type: consultType,
            source: "client",
            start_at: startIso,
            end_at: endIso,
            priority: idx + 1,
            note: null,
        };
    });

    const { error: candErr } = await supabaseAdmin
        .from("appointment_candidates")
        .insert(rows);

    if (candErr)  return NextResponse.json({ error: candErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, lead_id: lead.id });
}