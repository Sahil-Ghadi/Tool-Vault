import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// GET /api/tools — fetch all tools ordered by newest first
export async function GET() {
  const { data, error } = await supabase
    .from("tools")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/tools — save a new tool
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, url, description, tags } = body;

  if (!name || !url) {
    return NextResponse.json(
      { error: "name and url are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tools")
    .insert([
      {
        name: name.trim(),
        url: url.trim(),
        description: description?.trim() || null,
        tags: tags ?? [],
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
