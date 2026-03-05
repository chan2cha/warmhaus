import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const supabase = await createSupabaseServerClient();
    const {id:leadId} = await context.params;

    try {
        // (선택) 로그인 체크 - 나중에 권한 붙일 거면 여기서부터 시작하면 됨
        // const { data: auth } = await supabase.auth.getUser();
        // if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

        const { data: appt, error: apptErr } = await supabase
            .from("appointments")
            .select("*")
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (apptErr) throw apptErr;

        const { data: candidates, error: candErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("lead_id", leadId)
            .order("priority", { ascending: true })
            .order("start_at", { ascending: true });
        if (candErr) throw candErr;

        return NextResponse.json({
            appointment: appt ?? null,
            candidates: candidates ?? [],
        });
    } catch (e: any) {
        return NextResponse.json(
            { error: e?.message || "failed" },
            { status: 500 }
        );
    }
}