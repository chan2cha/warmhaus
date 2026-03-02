import InboxClient from "./InboxClient";
import { supabaseAdmin } from "../../lib/supabaseAdmin";

export const dynamic = "force-dynamic"; // 항상 최신

export default async function Page() {
    const { data, error } = await supabaseAdmin
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

    // error여도 UI는 띄우되, client에서 메시지 표시
    return <InboxClient initialLeads={data || []} initialError={error?.message || ""} />;
}