import type { ReactNode } from "react";
import { Small } from "@semoss/ui/next";

/** Aligned, wrapping envelope metadata shared by readers and composers. */
export function EmailAddressRow({
	label,
	children,
}: {
	label: string;
	children: ReactNode;
}) {
	return (
		<div className="flex min-w-0 items-start gap-2 py-1">
			<Small className="w-14 shrink-0 pt-1 text-base text-muted-foreground">
				{label}
			</Small>
			<div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-base">
				{children}
			</div>
		</div>
	);
}
