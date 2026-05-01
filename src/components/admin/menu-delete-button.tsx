"use client";

import { Button } from "@/components/ui/button";

type MenuDeleteButtonProps = {
  label: string;
  confirmMessage: string;
};

export function MenuDeleteButton({ label, confirmMessage }: MenuDeleteButtonProps) {
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

