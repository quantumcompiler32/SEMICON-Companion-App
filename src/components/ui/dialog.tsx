import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "./button";
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="sheet-overlay" />
        <DialogPrimitive.Content className="sheet">
          <div className="sheet-handle" />
          <div className="sheet-heading">
            <div>
              <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description>
                {description ?? "Save your details locally on this device."}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X size={22} />
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
