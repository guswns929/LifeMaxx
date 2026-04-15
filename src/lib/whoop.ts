import { prisma } from "./prisma";

const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";
const WHOOP_API_BASE = "https://api.prod.whoop.com/developer/v2";

export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.WHOOP_CLIENT_ID || "",
    redirect_uri: process.env.WHOOP_REDIRECT_URI || "",
    response_type: "code",
    scope: "read:recovery read:cycles read:sleep read:workout read:profile read:body_measurement offline",
    state,
  });
  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.WHOOP_CLIENT_ID || "",
      client_secret: process.env.WHOOP_CLIENT_SECRET || "",
      redirect_uri: process.env.WHOOP_REDIRECT_URI || "",
      code,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json();
}

export async function getValidToken(userId: string): Promise<string> {
  const conn = await prisma.whoopConnection.findUnique({ where: { userId } });
  if (!conn) throw new Error("WHOOP not connected");

  // Add 60s buffer to prevent using a token that's about to expire
  const expiresWithBuffer = new Date(conn.expiresAt.getTime() - 60_000);
  if (new Date() >= expiresWithBuffer) {
    console.log("WHOOP token expired or expiring soon, refreshing...");
    const res = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.WHOOP_CLIENT_ID || "",
        client_secret: process.env.WHOOP_CLIENT_SECRET || "",
        refresh_token: conn.refreshToken,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "unknown");
      console.error(`WHOOP token refresh failed (${res.status}):`, errText);
      throw new Error(`Token refresh failed: ${res.status} — ${errText}`);
    }
    const tokens = await res.json();
    await prisma.whoopConnection.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? conn.refreshToken,
        expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      },
    });
    return tokens.access_token;
  }
  return conn.accessToken;
}

async function whoopFetch(token: string, endpoint: string, params?: Record<string, string>) {
  const url = new URL(`${WHOOP_API_BASE}${endpoint}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  console.log(`WHOOP fetch: ${url.toString()}`);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`WHOOP API error ${res.status} for ${endpoint}:`, text);
    throw new Error(`WHOOP API error: ${res.status}`);
  }
  return res.json();
}

// v2 endpoints
export async function fetchRecoveryData(token: string, startDate: string, endDate: string) {
  return whoopFetch(token, "/recovery", { start: startDate, end: endDate });
}

export async function fetchCycleData(token: string, startDate: string, endDate: string) {
  return whoopFetch(token, "/cycle", { start: startDate, end: endDate });
}

export async function fetchSleepData(token: string, startDate: string, endDate: string) {
  return whoopFetch(token, "/activity/sleep", { start: startDate, end: endDate });
}

export async function fetchWorkoutData(token: string, startDate: string, endDate: string) {
  return whoopFetch(token, "/activity/workout", { start: startDate, end: endDate });
}

export async function fetchProfile(token: string) {
  return whoopFetch(token, "/user/profile/basic");
}

// Calculate expected rest time based on strain and recovery
export function calculateExpectedRest(strainScore: number, recoveryScore: number): {
  minHours: number;
  maxHours: number;
  recommendation: string;
} {
  // Higher strain + lower recovery = more rest needed
  const baseFactor = strainScore / 21; // normalize strain to 0-1
  const recoveryFactor = 1 - recoveryScore / 100; // lower recovery = more rest

  const baseRestHours = 24; // minimum rest day
  const additionalHours = baseFactor * recoveryFactor * 48;

  const minHours = Math.round(baseRestHours + additionalHours * 0.7);
  const maxHours = Math.round(baseRestHours + additionalHours * 1.3);

  let recommendation: string;
  if (recoveryScore >= 67) {
    recommendation = "Ready for high intensity training";
  } else if (recoveryScore >= 34) {
    recommendation = "Light to moderate training recommended";
  } else {
    recommendation = "Rest day recommended — focus on recovery";
  }

  return { minHours, maxHours, recommendation };
}
