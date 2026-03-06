import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

const ACTIVE_STATUSES = ["CONFIRMED", "RESCHEDULE_REQUESTED", "NEGOTIATING"];

export async function GET(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createSupabaseServerClient();
    const { id: leadId } = await context.params;

    try {
        const { data: activeAppointments, error: activeErr } = await supabase
            .from("appointments")
            .select("*")
            .eq("lead_id", leadId)
            .in("status", ACTIVE_STATUSES)
            .order("created_at", { ascending: false })
            .limit(1);

        if (activeErr) throw activeErr;

        let appointment = activeAppointments?.[0] ?? null;

        if (!appointment) {
            const { data: latestAppointment, error: latestErr } = await supabase
                .from("appointments")
                .select("*")
                .eq("lead_id", leadId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            if (latestErr) throw latestErr;
            appointment = latestAppointment ?? null;
        }

        const { data: candidates, error: candErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("lead_id", leadId)
            .order("priority", { ascending: true })
            .order("start_at", { ascending: true });

        if (candErr) throw candErr;

        return NextResponse.json({
            appointment,
            candidates: candidates ?? [],
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "failed" },
            { status: 500 }
        );
    }
}