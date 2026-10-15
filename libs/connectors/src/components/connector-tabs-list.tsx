import type { ComponentProps } from "react";
import { cn, TabsList } from "@semoss/ui/next";

/** Compact, content-width navigation for connector panels. */
export const ConnectorTabsList = ({
	className,
	...props
}: ComponentProps<typeof TabsList>) => (
	<TabsList
		className={cn(
			"h-9 max-w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-0 text-xs",
			className,
		)}
		{...props}
	/>
);
