"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

type ActionSubmitButtonProps = Omit<ButtonProps, "children"> & {
  idleLabel: string;
  pendingLabel: string;
  confirmMessage?: string;
};

export function ActionSubmitButton({
  idleLabel,
  pendingLabel,
  confirmMessage,
  disabled,
  onClick,
  form,
  ...props
}: ActionSubmitButtonProps) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      {...props}
      type={props.type ?? "submit"}
      form={form}
      disabled={disabled || pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        if (form) {
          const targetForm = document.getElementById(form);
          if (targetForm instanceof HTMLFormElement) {
            event.preventDefault();
            if (!targetForm.checkValidity()) {
              targetForm.reportValidity();
              return;
            }
            setPending(true);
            targetForm.requestSubmit();
            onClick?.(event);
            return;
          }
        }
        setPending(true);
        onClick?.(event);
      }}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {pending ? pendingLabel : idleLabel}
    </Button>
  );
}
