// app/api/debug-session/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  
  return NextResponse.json({
    hasSession: !!session,
    user: session?.user ? {
      email: session.user.email,
      name: session.user.name,
      hasAccessToken: !!session.user.accessToken,
      role: session.user.role,
      id: session.user.id
    } : null,
    tokenKeys: session ? Object.keys(session) : []
  });
}
