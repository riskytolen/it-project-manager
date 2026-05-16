import * as React from "react";
import { cn } from "@/lib/utils";
import { applyAutoFormat, type AutoFormatMode } from "@/lib/utils/text-format";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Auto-correct casing on blur.
   * - "title": capitalize each significant word (good for titles, names)
   * - "sentence": capitalize first letter of each sentence (good for body text)
   */
  autoFormat?: AutoFormatMode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", autoFormat, onBlur, ...props },
    ref,
  ) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (autoFormat && type === "text") {
        const next = applyAutoFormat(e.target.value, autoFormat);
        if (next !== e.target.value) {
          // Use the native setter so React picks the change up
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value",
          )?.set;
          setter?.call(e.target, next);
          e.target.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      onBlur?.(e);
    };

    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className,
        )}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoFormat?: AutoFormatMode;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoFormat, onBlur, ...props }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (autoFormat) {
        const next = applyAutoFormat(e.target.value, autoFormat);
        if (next !== e.target.value) {
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value",
          )?.set;
          setter?.call(e.target, next);
          e.target.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
      onBlur?.(e);
    };

    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "resize-y",
          className,
        )}
        onBlur={handleBlur}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-xs font-medium text-muted-foreground uppercase tracking-wide",
      className,
    )}
    {...props}
  />
));
Label.displayName = "Label";
