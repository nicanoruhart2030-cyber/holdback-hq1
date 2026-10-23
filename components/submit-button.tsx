"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pending,
  className = "btn-primary",
  confirm,
  formAction,
  noValidate,
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
  confirm?: string;
  formAction?: (fd: FormData) => void | Promise<void>;
  noValidate?: boolean;
}) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={status.pending}
      formAction={formAction}
      formNoValidate={noValidate}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {status.pending ? (pending ?? "Working") : children}
    </button>
  );
}
