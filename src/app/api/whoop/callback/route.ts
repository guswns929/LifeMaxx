import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens } from "@/lib/whoop";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("WHOOP callback: No session");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const userId = session.user.id;

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code) {
      console.error("WHOOP callback: Missing code");
      return NextResponse.redirect(new URL("/whoop?error=no_code", request.url));
    }

    // Validate state cookie (skip if cookie was lost — common in dev with redirects)
    const cookieStore = await cookies();
    const storedState = cookieStore.get("whoop_oauth_state")?.value;

    if (storedState && state && state !== storedState) {
      console.error("WHOOP callback: State mismatch", { state, storedState });
      return NextResponse.redirect(new URL("/whoop?error=state_mismatch", request.url));
    }

    // Clean up the state cookie
    cookieStore.delete("whoop_oauth_state");

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    await prisma.whoopConnection.upsert({
      where: { userId },
      create: {
        userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        whoopUserId: tokens.user_id?.toString() ?? null,
        scopes: tokens.scope || "",
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        whoopUserId: tokens.user_id?.toString() ?? null,
        scopes: tokens.scope || "",
      },
    });

    console.log("WHOOP connected successfully for user:", userId);
    return NextResponse.redirect(new URL("/whoop?connected=true", request.url));
  } catch (error) {
    console.error("WHOOP callback error:", error);
    return NextResponse.redirect(new URL("/whoop?error=auth_failed", request.url));
  }
}
