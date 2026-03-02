import LeadDetailClient from "./LeadDetailClient";
import {Ctx} from "@/app/type/type";

export default async function LeadDetailPage(ctx:Ctx) {
    const { id } = await ctx.params; // ✅ 여기서 Promise 풀기
    return <LeadDetailClient id={id} />;
}