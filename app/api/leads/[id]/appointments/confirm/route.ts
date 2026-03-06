import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

type Body = {
    candidate_id: string;
    memo?: string | null;
};

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createSupabaseServerClient();
    const { id: leadId } = await context.params;

    try {
        const body = (await req.json()) as Body;

        if (!body?.candidate_id) {
            return NextResponse.json({ error: "candidate_id required" }, { status: 400 });
        }

        const { data: cand, error: candErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("id", body.candidate_id)
            .maybeSingle();

        if (candErr) throw candErr;

        if (!cand || cand.lead_id !== leadId) {
            return NextResponse.json({ error: "invalid candidate" }, { status: 400 });
        }

        if (cand.status !== "CUSTOMER_CONFIRMED") {
            return NextResponse.json(
                { error: "고객이 가능하다고 답한 후보만 확정할 수 있습니다." },
                { status: 400 }
            );
        }

        const { data: existingAppt, error: apptErr } = await supabase
            .from("appointments")
            .select("*")
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (apptErr) throw apptErr;

        if (existingAppt?.status === "DONE") {
            return NextResponse.json(
                { error: "완료된 예약은 다시 확정할 수 없습니다." },
                { status: 400 }
            );
        }

        let appointmentId = existingAppt?.id as string | undefined;

        if (!appointmentId) {
            const { data: newAppt, error: newApptErr } = await supabase
                .from("appointments")
                .insert({
                    lead_id: leadId,
                    consult_type: cand.consult_type,
                    status: "NEGOTIATING",
                })
                .select("*")
                .single();

            if (newApptErr) throw newApptErr;
            appointmentId = newAppt.id;
        }

        const { data: updatedAppt, error: updErr } = await supabase
            .from("appointments")
            .update({
                consult_type: cand.consult_type,
                status: "CONFIRMED",
                start_at: cand.start_at,
                end_at: cand.end_at,
                memo: body.memo ?? null,
                confirmed_at: new Date().toISOString(),
                cancel_reason: null,
                reschedule_reason: null,
            })
            .eq("id", appointmentId)
            .select("*")
            .single();

        if (updErr) throw updErr;

        const { error: confirmCandidateErr } = await supabase
            .from("appointment_candidates")
            .update({
                status: "CONFIRMED",
            })
            .eq("id", cand.id);

        if (confirmCandidateErr) throw confirmCandidateErr;

        const { error: cancelOtherCandidatesErr } = await supabase
            .from("appointment_candidates")
            .update({
                status: "CANCELLED",
            })
            .eq("lead_id", leadId)
            .neq("id", cand.id)
            .in("status", ["PROPOSED", "PENDING", "CUSTOMER_CONFIRMED", "CUSTOMER_DECLINED"]);

        if (cancelOtherCandidatesErr) throw cancelOtherCandidatesErr;

        const { error: leadUpdErr } = await supabase
            .from("leads")
            .update({
                status: "APPOINTMENT_CONFIRMED",
            })
            .eq("id", leadId);

        if (leadUpdErr) throw leadUpdErr;

        const { data: candidates, error: candListErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("lead_id", leadId)
            .order("priority", { ascending: true })
            .order("start_at", { ascending: true });

        if (candListErr) throw candListErr;

        return NextResponse.json({
            appointment: updatedAppt,
            candidates: candidates ?? [],
        });
    } catch (e: any) {
        const msg = e?.message || "failed";

        if (String(msg).toLowerCase().includes("duplicate") || String(msg).includes("uq_")) {
            return NextResponse.json(
                { error: "이미 해당 시간에 확정된 예약이 있습니다. 다른 후보로 확정해 주세요." },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: msg }, { status: 500 });
    }
}