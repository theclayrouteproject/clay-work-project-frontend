import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { error: "Manual review is temporarily disabled while auto mode is active" },
    { status: 503 },
  );
}
