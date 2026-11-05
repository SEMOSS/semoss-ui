import { Navigate } from "react-router";
import { InsightProvider, useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, AlertTitle, Skeleton } from "@semoss/ui/next";
import { EnterpriseUsage } from "@/features/enterprise-usage/enterprise-usage";
import { useSession } from "@/hooks/use-session";

/** Uses the authenticated role, independent of the persisted admin-mode preference. */
export function EnterpriseUsagePage() {
	const isAdmin = useSession((state) => state.user.admin);
	return isAdmin ? (
		<InsightProvider options={{ disableRoom: true }}>
			<EnterpriseUsageSession />
		</InsightProvider>
	) : (
		<Navigate to="/settings" replace />
	);
}

/** Waits for one shared insight before querying logs or requesting scoped downloads. */
function EnterpriseUsageSession() {
	const { isReady, isInitialized, isAuthorized, insightId, error } =
		useInsight();
	if (error || (isInitialized && !isAuthorized))
		return (
			<Alert variant="destructive">
				<AlertTitle>Usage Session Unavailable</AlertTitle>
				<AlertDescription>
					{error?.message ||
						"Unable To Initialize An Authorized Session."}{" "}
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
