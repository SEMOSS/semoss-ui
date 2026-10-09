import { Compass } from "lucide-react";
import type { ReactNode } from "react";
import { H3, P } from "@semoss/ui/next";

export function EmptyView({
	title,
	children,
	action,
}: {
	title: string;
	children?: ReactNode;
	action?: ReactNode;
}) {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-3 px-5 py-12 text-center">
			<Compass aria-hidden="true" className="size-7 text-primary" />
			<H3 className="font-semibold text-base">{title}</H3>
			{children && (
				<P className="max-w-xs text-muted-foreground text-sm">
					{children}
				</P>
			)}
			{action}
		</div>
	);
}
