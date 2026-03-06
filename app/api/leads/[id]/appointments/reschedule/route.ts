import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createSupabaseServerClient();
    const { id: leadId } = await context.params;

    try {
        const body = await req.json().catch(() => ({}));
        const appointmentId = body?.appointment_id as string | undefined;
        const reason =
            typeof body?.reason === "string" && body.reason.trim()
                ? body.reason.trim()
                : null;

        if (!appointmentId) {
            return NextResponse.json(
                { error: "appointment_id required" },
                { status: 400 }
            );
        }

        const { data: appointment, error: apptErr } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .eq("lead_id", leadId)
            .maybeSingle();

        if (apptErr) throw apptErr;
        if (!appointment) {
            return NextResponse.json(
                { error: "appointment not found" },
                { status: 404 }
            );
        }

        if (appointment.status !== "CONFIRMED") {
            return NextResponse.json(
                { error: "확정된 예약만 변경 요청할 수 있습니다." },
                { status: 400 }
            );
        }

        const { data: updatedAppt, error: updErr } = await supabase
            .from("appointments")
            .update({
                status: "RESCHEDULE_REQUESTED",
                reschedule_reason: reason,
            })
            .eq("id", appointmentId)
            .select("*")
            .single();

        if (updErr) throw updErr;

        const { error: leadErr } = await supabase
            .from("leads")
            .update({
                status: "APPOINTMENT_RESCHEDULE",
            })
            .eq("id", leadId);

        if (leadErr) throw leadErr;

        // 방금 협의/확정 중이던 후보를 CUSTOMER_DECLINED 로 변경
        const { data: matchedCandidate, error: matchedErr } = await supabase
            .from("appointment_candidates")
            .select("id")
            .eq("lead_id", leadId)
            .eq("start_at", appointment.start_at)
            .eq("end_at", appointment.end_at)
            .maybeSingle();

        if (matchedErr) throw matchedErr;

        if (matchedCandidate?.id) {
            const { error: declineMatchedErr } = await supabase
                .from("appointment_candidates")
                .update({
                    status: "CUSTOMER_DECLINED",
                })
                .eq("id", matchedCandidate.id);

            if (declineMatchedErr) throw declineMatchedErr;
        }

        // 나머지 닫혀 있던 후보는 다시 PROPOSED 로 복구
        const { error: restoreOthersErr } = await supabase
            .from("appointment_candidates")
            .update({
                status: "PROPOSED",
            })
            .eq("lead_id", leadId)
            .neq("id", matchedCandidate?.id ?? "")
            .in("status", ["CANCELED"]);

        if (restoreOthersErr) throw restoreOthersErr;

        const { data: candidates, error: candErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("lead_id", leadId)
            .order("priority", { ascending: true })
            .order("start_at", { ascending: true });

        if (candErr) throw candErr;

        return NextResponse.json({
            ok: true,
            appointment: updatedAppt,
            candidates: candidates ?? [],
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "failed" },
            { status: 500 }
        );
    }
}