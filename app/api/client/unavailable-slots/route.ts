import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isValidDate(date: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function buildDaySlots(date: string) {
    const times = [
        "15:00",
        "15:30",
        "16:00",
        "16:30",
        "17:00",
        "17:30",
        "18:00",
        "18:30",
        "19:00",
        "19:30",
        "20:00",
    ];

    return times.map((time) => `${date}T${time}`);
}

function localKstToDate(localDT: string) {
    return new Date(`${localDT}:00+09:00`);
}

function addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

function overlaps(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date
) {
    return startA < endB && endA > startB;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const date = (searchParams.get("date") || "").trim();
    const consultType = (searchParams.get("consultType") || "phone").trim();

    if (!isValidDate(date)) {
        return NextResponse.json({ error: "invalid date" }, { status: 400 });
    }

    const durationMin = consultType === "office" ? 90 : 30;

    const dayStartIso = new Date(`${date}T00:00:00+09:00`).toISOString();
    const dayEndIso = new Date(`${date}T23:59:59+09:00`).toISOString();

    const { data, error } = await supabaseAdmin
        .from("appointments")
        .select("id,start_at,end_at")
        .eq("status", "CONFIRMED")
        .lt("start_at", dayEndIso)
        .gt("end_at", dayStartIso);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const appointments = data || [];
    const daySlots = buildDaySlots(date);

    const blocked = daySlots.filter((slot) => {
        const slotStart = localKstToDate(slot);
        const slotEnd = addMinutes(slotStart, durationMin);

        return appointments.some((appt) => {
            const bookedStart = new Date(appt.start_at);
            const bookedEnd = new Date(appt.end_at);
            return overlaps(slotStart, slotEnd, bookedStart, bookedEnd);
        });
    });

    return NextResponse.json({
        items: blocked.map((slot) => ({
            start_at: localKstToDate(slot).toISOString(),
        })),
    });
}