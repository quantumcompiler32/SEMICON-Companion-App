import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...args: Parameters<typeof clsx>) => twMerge(clsx(...args));
const variants = cva("button", {
  variants: {
    variant: {
      default: "button-primary",
      secondary: "button-secondary",
      ghost: "button-ghost",
      outline: "button-outline",
      danger: "button-danger",
    },
    size: { default: "", icon: "button-icon", small: "button-small" },
  },
  defaultVariants: { variant: "default", size: "default" },
});
export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  asChild?: boolean;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(variants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
