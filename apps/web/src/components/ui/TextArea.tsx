import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    error?: string;
};
export function TextArea({ id, label, error, className, ...props }: TextAreaProps) {
    const fieldId = id ?? props.name;
    return (<label className="block space-y-1.5" htmlFor={fieldId}>
      <span className="text-sm font-semibold text-[var(--color-ink)]">
        {label}
      </span>
      <textarea id={fieldId} className={cn("min-h-24 w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none ring-[var(--color-lagoon)] focus:ring-2", error && "border-red-400", className)} {...props}/>
      {error ? (<span className="block text-xs text-red-700" role="alert">
          {error}
        </span>) : null}
    </label>);
}
