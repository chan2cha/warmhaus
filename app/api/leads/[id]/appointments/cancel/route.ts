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
            return NextResponse.json({ error: "appointment not found" }, { status: 404 });
        }

        if (appointment.status === "CANCELED") {
            return NextResponse.json({ appointment });
        }

        if (appointment.status === "DONE") {
            return NextResponse.json(
                { error: "완료된 예약은 취소할 수 없습니다." },
                { status: 400 }
            );
        }

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

        const { error: leadErr } = await supabase
            .from("leads")
            .update({
                status: "APPOINTMENT_CANCELLED",
            })
            .eq("id", leadId);

        if (leadErr) throw leadErr;

        return NextResponse.json({
            ok: true,
            appointment: updatedAppt,
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "failed" },
            { status: 500 }
        );
    }
}