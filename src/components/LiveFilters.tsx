"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useTransition } from "react";

type Ctx = { pending: boolean; navigate: (href: string) => void };

const LiveFilterContext = createContext<Ctx>({ pending: false, navigate: () => {} });

/** Shares a single navigation transition between the filter form and results. */
export function LiveFilterProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router],
  );
  return <LiveFilterContext.Provider value={{ pending, navigate }}>{children}</LiveFilterContext.Provider>;
}

function toHref(action: string, form: HTMLFormElement) {
  const sp = new URLSearchParams();
  for (const [key, value] of new FormData(form).entries()) {
    const v = typeof value === "string" ? value.trim() : "";
    if (v) sp.set(key, v);
  }
  const qs = sp.toString();
  return qs ? `${action}?${qs}` : action;
}

/**
 * A GET form that updates the URL (and therefore the server-rendered results)
 * as the user types or changes a filter. Text inputs are debounced. Without JS
 * it still works as a normal form submission.
 */
export function LiveFilterForm({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { navigate } = useContext(LiveFilterContext);
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const apply = useCallback(() => {
    if (formRef.current) navigate(toHref(action, formRef.current));
  }, [action, navigate]);

  return (
    <form
      ref={formRef}
      method="get"
      action={action}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        apply();
      }}
      onChange={(e) => {
        const target = e.target as HTMLElement;
        if (timer.current) clearTimeout(timer.current);
        if (target instanceof HTMLInputElement && (target.type === "search" || target.type === "text")) {
          timer.current = setTimeout(apply, 320);
        } else {
          apply();
        }
      }}
    >
      {children}
    </form>
  );
}

/** Clears every field in the surrounding form and navigates to the unfiltered page. */
export function ResetButton({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { navigate } = useContext(LiveFilterContext);
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        const form = e.currentTarget.form;
        form?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select").forEach((el) => {
          el.value = "";
        });
        navigate(href);
      }}
    >
      {children}
    </button>
  );
}

/** Small "Updating…" indicator. */
export function PendingIndicator() {
  const { pending } = useContext(LiveFilterContext);
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-orange-800 transition-opacity ${
        pending ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-orange motion-safe:animate-ping" aria-hidden="true" />
      {pending ? "Updating…" : ""}
    </span>
  );
}

/** Dims results while a filter navigation is in flight. */
export function LiveResults({ children }: { children: React.ReactNode }) {
  const { pending } = useContext(LiveFilterContext);
  return (
    <div
      aria-busy={pending}
      className={`space-y-6 transition-opacity duration-200 ${pending ? "opacity-50" : "opacity-100"}`}
    >
      {children}
    </div>
  );
}
