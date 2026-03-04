import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from("settings")
        .select("value, updated_at")
        .eq("key", "lead_rules")
        .single();

    if (error) {
        return NextResponse.json({ rules: null, error: error.message }, { status: 200 });
    }

    return NextResponse.json({ rules: data.value, updated_at: data.updated_at });
}