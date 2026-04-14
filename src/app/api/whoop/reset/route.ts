import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear all WHOOP data but keep the connection
    const deleted = await prisma.whoopDatum.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true, deleted: deleted.count });
  } catch (error) {
    console.error("WHOOP reset error:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
