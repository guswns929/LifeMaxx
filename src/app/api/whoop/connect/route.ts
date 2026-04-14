import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getAuthorizationUrl } from "@/lib/whoop";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const state = crypto.randomUUID();
    const cookieStore = await cookies();
    cookieStore.set("whoop_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 600,
      path: "/",
      sameSite: "lax",
    });

    const url = getAuthorizationUrl(state);
    return NextResponse.redirect(url);
  } catch (error) {
    console.error("GET /api/whoop/connect error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
