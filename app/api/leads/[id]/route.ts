import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {Ctx} from "@/app/type/type";



export async function GET(_: Request, ctx: Ctx) {
    const { id } = await ctx.params;

    const { data, error } = await supabaseAdmin
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ lead: data });
}

export async function PATCH(req: Request, ctx: Ctx) {
    const { id } = await ctx.params;

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const patch: any = {};
    if (typeof body.status === "string") patch.status = body.status;
    if (body.next_action_at === null || typeof body.next_action_at === "string") {
        patch.next_action_at = body.next_action_at;
    }

    const { data, error } = await supabaseAdmin
        .from("leads")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ lead: data });
}