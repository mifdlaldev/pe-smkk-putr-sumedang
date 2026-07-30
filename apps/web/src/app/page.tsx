import { redirect } from "next/navigation";

/**
 * Auth-first app (mirror monolit field usage).
 * No public marketing landing — go straight to login.
 * After login, role routes to /dashboard/admin|surveyor.
 */
export default function HomePage() {
  redirect("/auth/login");
}
