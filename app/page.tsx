"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (!error && data) setLeads(data);
    })();
  }, []);

  return (
      <main style={{ padding: 16 }}>
        <h1>Leads</h1>
        <pre>{JSON.stringify(leads, null, 2)}</pre>
      </main>
  );
}