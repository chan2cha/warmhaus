import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

export async function POST(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const { data: candidate, error: candidateError } = await supabase
        .from("appointment_candidates")
        .select("id, lead_id, status")
        .eq("id", id)
        .single();

    if (candidateError || !candidate) {
        return NextResponse.json(
            { error: "후보를 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    if (candidate.status === "CONFIRMED") {
        return NextResponse.json(
            { error: "이미 확정된 후보입니다." },
            { status: 400 }
        );
    }

    if (candidate.status === "CANCELED") {
        return NextResponse.json(
            { error: "취소된 후보입니다." },
            { status: 400 }
        );
    }

    const { data: otherActive, error: activeErr } = await supabase
        .from("appointment_candidates")
        .select("id, status")
        .eq("lead_id", candidate.lead_id)
        .neq("id", id)
        .in("status", ["PENDING", "CUSTOMER_CONFIRMED", "CONFIRMED"])
        .limit(1);

    if (activeErr) {
        return NextResponse.json(
            { error: activeErr.message },
            { status: 500 }
        );
    }

    if (otherActive && otherActive.length > 0) {
        return NextResponse.json(
            { error: "이미 진행중인 후보가 있습니다. 먼저 해당 후보를 처리해 주세요." },
            { status: 400 }
        );
    }

    const { error: updateCandidateError } = await supabase
        .from("appointment_candidates")
        .update({
            status: "PENDING",
        })
        .eq("id", id);

    if (updateCandidateError) {
        return NextResponse.json(
            { error: updateCandidateError.message },
            { status: 500 }
        );
    }

    const { error: leadUpdateError } = await supabase
        .from("leads")
        .update({
            status: "APPOINTMENT_PENDING",
        })
        .eq("id", candidate.lead_id);

    if (leadUpdateError) {
        return NextResponse.json(
            { error: leadUpdateError.message },
            { status: 500 }
        );
    }

    const { data: candidates, error: candidatesError } = await supabase
        .from("appointment_candidates")
        .select("*")
        .eq("lead_id", candidate.lead_id)
        .order("priority", { ascending: true })
        .order("start_at", { ascending: true });

    if (candidatesError) {
        return NextResponse.json(
            { error: candidatesError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        ok: true,
        candidates,
    });
}