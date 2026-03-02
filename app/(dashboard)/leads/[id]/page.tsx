import LeadDetailClient from "./LeadDetailClient";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const { data, error } = await supabaseAdmin.from("leads").select("*").eq("id", id).single();

    return <LeadDetailClient id={id} initialLead={data || null} initialError={error?.message || ""} />;
}