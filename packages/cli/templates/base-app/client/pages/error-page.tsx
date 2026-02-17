import { TriangleAlert } from "lucide-react";

/**
 * Renders a warning message for any FE errors encountered.
 *
 * @component
 */
export const ErrorPage = () => {
	return (
		<div className="flex h-full flex-col items-center justify-center">
			<TriangleAlert className="size-8" />
			<div>
				An error has occurred. Please try again or contact support if
				the problem persists.
			</div>
		</div>
	);
};
