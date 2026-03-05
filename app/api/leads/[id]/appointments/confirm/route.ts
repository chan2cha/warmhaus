import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "lib/ssr";

type Body = {
    candidate_id: string;
    memo?: string | null;
};

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    const supabase =await createSupabaseServerClient();
    const leadId = params.id;

    try {
        // (선택) 로그인 체크 - 나중에 권한 붙일 거면 여기서부터 시작하면 됨
        // const { data: auth } = await supabase.auth.getUser();
        // if (!auth?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

        const body = (await req.json()) as Body;
        if (!body?.candidate_id) {
            return NextResponse.json(
                { error: "candidate_id required" },
                { status: 400 }
            );
        }

        // 1) candidate 조회(lead 검증)
        const { data: cand, error: candErr } = await supabase
            .from("appointment_candidates")
            .select("*")
            .eq("id", body.candidate_id)
            .maybeSingle();

        if (candErr) throw candErr;
        if (!cand || cand.lead_id !== leadId) {
            return NextResponse.json({ error: "invalid candidate" }, { status: 400 });
        }

        // 2) appointment 확보(없으면 생성: NEGOTIATING)
        const { data: existingAppt, error: apptErr } = await supabase
            .from("appointments")
            .select("*")
            .eq("lead_id", leadId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (apptErr) throw apptErr;

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

        // 3) CONFIRMED 업데이트
        const { data: updatedAppt, error: updErr } = await supabase
            .from("appointments")
            .update({
                consult_type: cand.consult_type,
                status: "CONFIRMED",
                start_at: cand.start_at,
                end_at: cand.end_at,
                memo: body.memo ?? null,
                confirmed_at: new Date().toISOString(),
            })
            .eq("id", appointmentId)
            .select("*")
            .single();

        if (updErr) throw updErr;

        // 4) candidates 다시 반환
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

        // 확정 슬롯 중복(유니크 인덱스 충돌)일 때
        if (
            String(msg).toLowerCase().includes("duplicate") ||
            String(msg).includes("uq_")
        ) {
            return NextResponse.json(
                { error: "이미 해당 시간에 확정된 예약이 있습니다. 다른 후보로 확정해 주세요." },
                { status: 409 }
            );
        }

        return NextResponse.json({ error: msg }, { status: 500 });
    }
}