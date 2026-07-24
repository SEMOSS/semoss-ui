/** Small status / metadata pill — adapter over the shared @semoss/ui Badge,
 *  keeping this app's `tone` API (the palette is layered on via className). */

import type { ReactNode } from "react";
import { cn, Badge as UIBadge } from "@semoss/ui/next";

type Tone = "neutral" | "blue" | "emerald" | "amber" | "red";

const TONES: Record<Tone, string> = {
	neutral: "bg-stone-100 text-stone-600 border-transparent",
	blue: "bg-blue-50 text-blue-600 border-blue-200",
	emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
	amber: "bg-amber-50 text-amber-700 border-amber-200",
	red: "bg-red-50 text-red-700 border-red-200",
};

export function Badge({
	children,
	tone = "neutral",
	className,
}: {
	children: ReactNode;
	tone?: Tone;
	className?: string;
}) {
	return (
		<UIBadge
			variant="secondary"
			className={cn(
				"gap-1 rounded-full px-1.5 py-0.5 font-semibold text-[10px]",
				TONES[tone],
				className,
			)}
		>
			{children}
		</UIBadge>
	);
}
