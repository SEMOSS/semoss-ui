import { TriangleAlert } from "lucide-react";
import { Button, H3, P, Spinner } from "@semoss/ui/next";

interface ErrorPageProps {
	/** Offers Retry, such as reading the session again. Left out on a route error. */
	onRetry?: () => void;
	/** Whether the retry is running; disables Retry. */
	isRetrying?: boolean;
}

/**
 * Renders a warning message for any FE errors encountered.
 */
export const ErrorPage = ({ onRetry, isRetrying = false }: ErrorPageProps) => {
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
			{onRetry ? (
				<Button
					type="button"
					variant="outline"
					disabled={isRetrying}
					onClick={onRetry}
				>
					{isRetrying ? <Spinner /> : null}
					Retry
				</Button>
			) : null}
		</div>
	);
};
