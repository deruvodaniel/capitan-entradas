import { auth, currentUser } from "@clerk/nextjs/server";

const ADMIN_EMAILS = (
  process.env.ADMIN_EMAILS ||
  "deruvodaniel@gmail.com,diegometroh@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await currentUser();
  if (!user) return null;
  const primaryId = user.primaryEmailAddressId;
  const primary =
    user.emailAddresses.find((e) => e.id === primaryId) ||
    user.emailAddresses[0];
  return primary?.emailAddress?.toLowerCase() || null;
}

export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const email = await getCurrentUserEmail();
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export async function requireAdmin(): Promise<{ email: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("UNAUTHORIZED");
  const email = await getCurrentUserEmail();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("FORBIDDEN");
  }
  return { email };
}

export { ADMIN_EMAILS };
