import { Link } from "react-router";
import { Alert, AlertDescription, Button, Skeleton } from "@semoss/ui/next";

/** Backend errors can arrive as raw JSON; show their message, and flag a lost Microsoft sign-in. */
function readError(error: string): { message: string; signIn: boolean } {
	try {
		const parsed: unknown = JSON.parse(error);
		if (parsed && typeof parsed === "object" && "message" in parsed) {
			const message = String(parsed.message);
			const signIn =
				"type" in parsed &&
				parsed.type === "MICROSOFT" &&
				/log ?in|sign ?in/i.test(message);
			return { message, signIn };
		}
	} catch {
		// plain text
	}
	return { message: error, signIn: false };
}

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
	const readable = error ? readError(error) : null;
	if (readable?.signIn)
		return (
			<div className="space-y-3 py-4 text-muted-foreground text-sm">
				<p>Sign in to Microsoft to see this.</p>
				<Button asChild variant="outline" size="sm">
					<Link to="/brain/sources">Manage connections</Link>
				</Button>
			</div>
		);
	if (readable)
		return (
			<Alert variant="destructive">
				<AlertDescription>{readable.message}</AlertDescription>
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
