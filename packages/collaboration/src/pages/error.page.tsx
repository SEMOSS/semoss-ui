import { TriangleAlert } from "lucide-react";
import { H3, P } from "@semoss/ui/next";

/**
 * Renders a warning message for any FE errors encountered.
 */
export const ErrorPage = () => {
	return (
		<div
			role="alert"
			className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center"
		>
			<TriangleAlert
				aria-hidden="true"
				className="size-8 text-destructive"
			/>
			<H3>Collaboration could not start</H3>
			<P className="max-w-prose text-muted-foreground">
				An error has occurred. Please try again or contact support if
				the problem persists.
			</P>
		</div>
	);
};
