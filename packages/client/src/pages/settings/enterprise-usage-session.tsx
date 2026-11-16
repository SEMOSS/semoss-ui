import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@semoss/ui/next";
import { EnterpriseUsage } from "@/features/enterprise-usage/enterprise-usage";

/**
 * Waits for one shared insight before querying logs or requesting scoped
 * downloads. Renders inside the page's `InsightProvider`.
 */
export function EnterpriseUsageSession() {
	const { isReady, isInitialized, insightId, error } = useInsight();
	// setup finished without the insight; the page is already signed in
	if (error || (isInitialized && !isReady))
		return (
			<Alert variant="destructive">
				<AlertTitle>Usage Session Unavailable</AlertTitle>
				<AlertDescription>
					{error?.message ||
						"Unable To Initialize The Usage Session."}{" "}
					Reload This Page To Try Again.
				</AlertDescription>
			</Alert>
		);
	if (!isReady || !insightId)
		return (
			<div className="space-y-2">
				<output>Loading Usage Session...</output>
				<Skeleton className="h-28 w-full" />
			</div>
		);
	return <EnterpriseUsage />;
}
