"use client";

import { Button } from "@/components/ui/button";

type ItemDeleteButtonProps = {
  label: string;
  confirmMessage: string;
};

export function ItemDeleteButton({ label, confirmMessage }: ItemDeleteButtonProps) {
  return (
    <Button
      type="submit"
      size="sm"
      variant="destructive"
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </Button>
  );
}

