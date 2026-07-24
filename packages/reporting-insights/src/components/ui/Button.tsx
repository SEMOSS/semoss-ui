/**
 * Button — adapter over the shared @semoss/ui Button so the app uses the SEMOSS
 * design system while keeping this app's existing prop API (variant/size names)
 * so call sites don't change. `buttonClasses()` mirrors @semoss/ui's
 * `buttonVariants` for <Link>/<a> that need to look like buttons.
 */

import type { ButtonHTMLAttributes } from "react";
import { buttonVariants, cn, Button as UIButton } from "@semoss/ui/next";

export type ButtonVariant =
	| "primary"
	| "secondary"
	| "success"
	| "danger"
	| "outline"
	| "ghost";
export type ButtonSize = "xs" | "sm" | "md";

// Map this app's variant/size vocabulary onto @semoss/ui's.
const VARIANT_MAP: Record<
	ButtonVariant,
	"default" | "secondary" | "destructive" | "outline" | "ghost"
> = {
	primary: "default",
	secondary: "secondary",
	success: "default",
	danger: "destructive",
	outline: "outline",
	ghost: "ghost",
};
const SIZE_MAP: Record<ButtonSize, "default" | "sm"> = {
	xs: "sm",
	sm: "sm",
	md: "default",
};
// @semoss/ui has no "success" variant — layer emerald on top of the base button.
const SUCCESS_EXTRA = "bg-emerald-600 text-white hover:bg-emerald-700";

export function buttonClasses(
	variant: ButtonVariant = "primary",
	size: ButtonSize = "md",
	extra?: string,
): string {
	return cn(
		buttonVariants({ variant: VARIANT_MAP[variant], size: SIZE_MAP[size] }),
		variant === "success" && SUCCESS_EXTRA,
		extra,
	);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
}

export function Button({
	variant = "primary",
	size = "md",
	className,
	...props
}: ButtonProps) {
	return (
		<UIButton
			variant={VARIANT_MAP[variant]}
			size={SIZE_MAP[size]}
			className={cn(variant === "success" && SUCCESS_EXTRA, className)}
			{...props}
		/>
	);
}
