import { redirect } from "next/navigation";
import Link from "next/link";
import { isAuthenticated, isPasswordConfigured } from "@/lib/auth";
import LoginForm from "@/components/settings/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/settings");
  if (!isPasswordConfigured()) {
    return (
      <div className="st-login">
        <div className="st-card">
          <h1>Password not set</h1>
          <p>
            Add <code>SETTINGS_PASSWORD</code> to your environment variables, then reload
            this page.
          </p>
          <div className="st-actions">
            <Link className="st-btn" href="/">
              Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <LoginForm />;
}
