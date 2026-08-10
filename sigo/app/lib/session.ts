import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";
import type { Role } from "@/app/generated/prisma/enums";

export interface SessionData {
  personaId: number;
  /** The role the person is currently viewing the app as (home role, or a granted role-view). */
  activeRole: Role;
}

const sessionOptions: SessionOptions = {
  cookieName: "sigo_session",
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
