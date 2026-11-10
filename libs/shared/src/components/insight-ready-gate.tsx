import type { ReactNode } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Spinner } from "@semoss/ui/next";

/** Props for {@link InsightReadyGate}. */
interface InsightReadyGateProps {
	/** The views that run pixels in the app's insight. */
	children: ReactNode;

	/** Shown when the insight could not be made. */
	errorFallback: ReactNode;

	/** Shown while the insight is being made. Defaults to a centered spinner. */
	loadingFallback?: ReactNode;
}

/**
 * Holds an app's signed in views until its insight is made, so none of them
 * runs a pixel with an empty insight id. Mount it inside the `InsightProvider`
 * that the app's sign in gate renders once the SDK's session is signed in.
 */
export const InsightReadyGate = ({
	children,
	errorFallback,
	loadingFallback,
}: InsightReadyGateProps) => {
	const { isInitialized, isReady, error } = useInsight();

	// ready once the insight has an id; sign in is the session's, not this gate's
	if (isReady) return <>{children}</>;

	// setup finished, or failed, without making the insight
	if (error || isInitialized) return <>{errorFallback}</>;

	return (
		loadingFallback ?? (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		)
	);
};
