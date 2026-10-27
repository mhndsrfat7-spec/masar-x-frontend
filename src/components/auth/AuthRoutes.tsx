"use client";

import { useRouterStore } from "@/store/routerStore";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

/** Renders the currently active auth route (login or register). */
export function AuthRoutes() {
  const route = useRouterStore((s) => s.route);
  const variant = route === "register" ? "register" : "login";

  return (
    <AuthLayout variant={variant}>
      {route === "register" ? <RegisterForm /> : <LoginForm />}
    </AuthLayout>
  );
}
