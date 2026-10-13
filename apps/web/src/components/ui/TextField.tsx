import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
    hint?: string;
};
export function TextField({ id, label, error, hint, className, ...props }: TextFieldProps) {
    const fieldId = id ?? props.name;
    return (<label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </span>
      <input id={fieldId} className={cn("w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-lagoon)] focus:ring-2", error && "border-red-400", className)} {...props}/>
      {hint && !error ? (<span className="block text-xs text-[color-mix(in_srgb,var(--color-ink)_55%,white)]">
          {hint}
        </span>) : null}
      {error ? (<span className="block text-xs text-red-700" role="alert">
          {error}
        </span>) : null}
    </label>);
}
