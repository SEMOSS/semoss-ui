import type { ComponentProps } from "react";
import { cn, TabsTrigger } from "@semoss/ui/next";

/** A text tab with a persistent underline for the selected view. */
export const ConnectorTabsTrigger = ({
	className,
	...props
}: ComponentProps<typeof TabsTrigger>) => (
	<TabsTrigger
		className={cn(
			"h-9 flex-none rounded-none border-0 border-transparent border-b-2 px-2 text-xs shadow-none hover:bg-accent/50 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-primary",
			className,
		)}
		{...props}
	/>
);
