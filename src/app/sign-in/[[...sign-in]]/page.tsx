import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUserId } from "@/lib/auth";

export default async function SignInPage() {
  if (await getCurrentUserId()) redirect("/dashboard");
  return <AuthForm mode="sign-in" />;
}
