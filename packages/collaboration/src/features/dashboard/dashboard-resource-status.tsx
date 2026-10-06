import { Link } from "react-router";
import { Alert, AlertDescription, Button, Skeleton } from "@semoss/ui/next";

/** Widget-local errors preserve the other sections and their last successful snapshots. */
export function DashboardResourceStatus({
	error,
	loading,
	disconnected,
	onRetry,
}: {
	error?: string;
	loading?: boolean;
	disconnected?: string;
	onRetry?: () => void;
}) {
	if (disconnected)
		return (
			<div className="space-y-3 py-4 text-muted-foreground text-sm">
				<p>{disconnected}</p>
				<Button asChild variant="outline" size="sm">
					<Link to="/brain/sources">Manage connections</Link>
				</Button>
			</div>
		);
	if (error)
		return (
			<Alert variant="destructive">
				<AlertDescription>{error}</AlertDescription>
				{onRetry && (
					<Button size="sm" variant="outline" onClick={onRetry}>
						Retry
					</Button>
				)}
			</Alert>
		);
	if (loading)
		return (
			<output className="block space-y-3 py-3">
				<span className="sr-only">Loading this section</span>
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-16 w-full" />
			</output>
		);
	return null;
}
