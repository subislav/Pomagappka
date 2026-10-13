import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
};
export function Button({ className, variant = "primary", type = "button", ...props }: ButtonProps) {
    return (<button type={type} className={cn("inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60", variant === "primary" &&
            "bg-[var(--color-sea)] text-white hover:bg-[var(--color-lagoon)]", variant === "secondary" &&
            "border border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-mist)]", variant === "ghost" &&
            "text-[var(--color-sea)] hover:bg-[var(--color-mist)]", className)} {...props}/>);
}
