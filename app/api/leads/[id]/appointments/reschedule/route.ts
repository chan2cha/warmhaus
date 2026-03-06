import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: leadId } = await context.params;
    const supabase = await createSupabaseServerClient();

    const body = await req.json().catch(() => ({}));
    const appointmentId = body?.appointment_id as string | undefined;
    const reason =
        typeof body?.reason === "string" && body.reason.trim()
            ? body.reason.trim()
            : null;

    if (!appointmentId) {
        return NextResponse.json(
            { error: "appointment_id가 필요합니다." },
            { status: 400 }
        );
    }

    const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select("id, lead_id, status")
        .eq("id", appointmentId)
        .eq("lead_id", leadId)
        .single();

    if (appointmentError || !appointment) {
        return NextResponse.json(
            { error: "예약을 찾을 수 없습니다." },
            { status: 404 }
        );
    }

    if (appointment.status !== "CONFIRMED") {
        return NextResponse.json(
            { error: "확정된 예약만 변경 요청할 수 있습니다." },
            { status: 400 }
        );
    }

    const { error: updateAppointmentError } = await supabase
        .from("appointments")
        .update({
            status: "RESCHEDULE_REQUESTED",
            reschedule_reason: reason,
        })
        .eq("id", appointmentId);

    if (updateAppointmentError) {
        return NextResponse.json(
            { error: updateAppointmentError.message },
            { status: 500 }
        );
    }

    const { error: leadUpdateError } = await supabase
        .from("leads")
        .update({
            status: "APPOINTMENT_RESCHEDULE",
        })
        .eq("id", leadId);

    if (leadUpdateError) {
        return NextResponse.json(
            { error: leadUpdateError.message },
            { status: 500 }
        );
    }

    const { data: updatedAppointment, error: updatedAppointmentError } =
        await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .single();

    if (updatedAppointmentError) {
        return NextResponse.json(
            { error: updatedAppointmentError.message },
            { status: 500 }
        );
    }

    return NextResponse.json({
        ok: true,
        appointment: updatedAppointment,
    });
}