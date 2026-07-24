/** Surface container — adapter over the shared @semoss/ui Card, neutralizing its
 *  default padding/gap so it behaves as a plain surface (call sites supply their
 *  own layout), while adopting the shared card tokens + our soft shadow. */

import type { HTMLAttributes } from "react";
import { cn, Card as UICard } from "@semoss/ui/next";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
	interactive?: boolean;
}

export function Card({ interactive, className, ...props }: CardProps) {
	return (
		<UICard
			className={cn(
				"block gap-0 py-0 shadow-soft",
				interactive &&
					"transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 hover:border-stone-300 hover:shadow-soft-lg",
				className,
			)}
			{...props}
		/>
	);
}
