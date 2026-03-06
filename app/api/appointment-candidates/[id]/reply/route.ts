import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

type ReplyType = "CONFIRMED" | "DECLINED";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const supabase = await createSupabaseServerClient();

    const body = await req.json().catch(() => ({}));
    const replyType = body?.replyType as ReplyType | undefined;
    const replyText = typeof body?.replyText === "string" ? body.replyText : null;

    if (replyType !== "CONFIRMED" && replyType !== "DECLINED") {
        return NextResponse.json(
            { error: "replyType은 CONFIRMED 또는 DECLINED 이어야 합니다." },
            { status: 400 }
        );
    }

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
            { error: "이미 최종 확정된 후보입니다." },
            { status: 400 }
        );
    }

    if (candidate.status === "CANCELLED") {
        return NextResponse.json(
            { error: "취소된 후보입니다." },
            { status: 400 }
        );
    }

    const nextStatus =
        replyType === "CONFIRMED"
            ? "CUSTOMER_CONFIRMED"
            : "CUSTOMER_DECLINED";

    const { error: updateCandidateError } = await supabase
        .from("appointment_candidates")
        .update({
            status: nextStatus,
            replied_at: new Date().toISOString(),
            reply_text: replyText,
        })
        .eq("id", id);

    if (updateCandidateError) {
        return NextResponse.json(
            { error: updateCandidateError.message },
            { status: 500 }
        );
    }

    if (replyType === "DECLINED") {
        await supabase
            .from("leads")
            .update({
                status: "APPOINTMENT_PENDING",
            })
            .eq("id", candidate.lead_id);
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