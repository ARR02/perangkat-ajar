import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";

export async function auth() {
  return getServerSession(authOptions);
}