import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login — Bookie",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-fun text-display-sm text-text">Bookie</h1>
          <p className="text-caption mt-1 text-text-muted">Admin</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
