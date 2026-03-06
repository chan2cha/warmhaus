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

        if (appointment.status === "DONE") {
            return NextResponse.json(
                { error: "완료된 예약은 취소할 수 없습니다." },
                { status: 400 }
            );
        }

        let updatedAppointment = appointment;

        if (appointment.status !== "CANCELED") {
            const { data: updatedAppt, error: updErr } = await supabase
                .from("appointments")
                .update({
                    status: "CANCELED",
                    cancel_reason: reason,
                })
                .eq("id", appointmentId)
                .select("*")
                .single();

            if (updErr) throw updErr;
            updatedAppointment = updatedAppt;
        }

        const { error: leadErr } = await supabase
            .from("leads")
            .update({
                status: "APPOINTMENT_CANCELLED",
            })
            .eq("id", leadId);

        if (leadErr) throw leadErr;

        // 후보 전부 PROPOSED 로 복구
        const { error: restoreCandidatesErr } = await supabase
            .from("appointment_candidates")
            .update({
                status: "PROPOSED",
            })
            .eq("lead_id", leadId)
            .in("status", [
                "PENDING",
                "CUSTOMER_CONFIRMED",
                "CUSTOMER_DECLINED",
                "CONFIRMED",
                "CANCELED",
            ]);

        if (restoreCandidatesErr) throw restoreCandidatesErr;

        const { data: candidates, error: candErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("lead_id", leadId)
            .order("priority", { ascending: true })
            .order("start_at", { ascending: true });

        if (candErr) throw candErr;

        return NextResponse.json({
            ok: true,
            appointment: updatedAppointment,
            candidates: candidates ?? [],
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "failed" },
            { status: 500 }
        );
    }
}