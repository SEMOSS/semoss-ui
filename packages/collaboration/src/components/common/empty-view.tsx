import { Compass } from "lucide-react";
import type { ReactNode } from "react";

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
			<Compass className="size-7 text-primary" />
			<h3 className="font-semibold text-sm">{title}</h3>
			{children && (
				<p className="max-w-xs text-muted-foreground text-sm">
					{children}
				</p>
			)}
			{action}
		</div>
	);
}
