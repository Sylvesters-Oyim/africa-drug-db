"use client";

import { useFormStatus } from "react-dom";

function Button({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full border border-orange-800/30 bg-white/80 px-5 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:opacity-60"
    >
      {pending ? "Deleting…" : label}
    </button>
  );
}

/** Delete form with a browser confirmation; the server action re-checks admin auth. */
export function DeleteButton({
  action,
  id,
  label,
  confirmText,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  confirmText: string;
}) {
  return (
    <form
      className="delete-form"
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button label={label} />
    </form>
  );
}
