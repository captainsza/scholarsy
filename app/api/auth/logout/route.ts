import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // Delete the auth cookie
    cookies().set({
      name: 'auth-token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0),
    });

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Failed to log out" },
      { status: 500 }
    );
  }
}
