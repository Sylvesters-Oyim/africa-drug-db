"use client";

import { useActionState } from "react";
import { inputClass, labelClass, primaryButtonClass } from "@/components/form";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  return (
    <form action={action} className="space-y-5">
      {/* Lets password managers associate the saved password with this site. */}
      <input type="text" name="username" value="admin" autoComplete="username" readOnly hidden />
      <div>
        <label htmlFor="password" className={labelClass}>
          Admin password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          autoFocus
          className={inputClass}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
        />
      </div>
      {state.error ? (
        <p id="login-error" role="alert" className="rounded-xl bg-orange-100 px-3.5 py-2.5 text-sm font-medium text-orange-800">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={`${primaryButtonClass} w-full disabled:opacity-60`}>
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
