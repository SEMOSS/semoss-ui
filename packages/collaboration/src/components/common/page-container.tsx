import type { HTMLAttributes } from "react";
import { cn } from "@semoss/ui/next";

/** Props for the standard constrained page content region. */
interface PageContainerProps extends HTMLAttributes<HTMLElement> {}

/** Keeps top-level workspace pages on the same width and responsive padding. */
export function PageContainer({ className, ...props }: PageContainerProps) {
	return (
		<main
			className={cn(
				"mx-auto w-full max-w-7xl p-4 md:p-6 lg:p-8",
				className,
			)}
			{...props}
		/>
	);
}
