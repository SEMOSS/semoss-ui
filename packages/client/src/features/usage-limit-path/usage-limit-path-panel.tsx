import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { UsageLimitPathView } from "@semoss/shared";
import { Alert, AlertDescription, Button, cn, Spinner } from "@semoss/ui/next";
import {
	type UsageLimitPathRequest,
	useUsageLimitPath,
} from "./use-usage-limit-path";

export interface UsageLimitPathPanelProps {
	/** Whose path to show on which model, or null to show nothing */
	request: UsageLimitPathRequest | null;
	/** The path view's section headings' level, under the host's own title */
	headingLevel?: 3 | 4;
	/** Shown beside Refresh, such as the button to the usage limits guide */
	actions?: ReactNode;
	/** Classes for the panel */
	className?: string;
}

/**
 * How usage limits apply to one person on a model, read for the request: a
 * Refresh button with the host's actions beside it, the read's error or
 * progress, and the path view.
 */
export const UsageLimitPathPanel = ({
	request,
	headingLevel = 3,
	actions,
	className,
}: UsageLimitPathPanelProps) => {
	const { path, isLoading, error, refresh } = useUsageLimitPath(request);
	const isOwn = request !== null && request.person === undefined;

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isLoading || request === null}
					onClick={refresh}
				>
					<RefreshCw className="size-4" aria-hidden />
					Refresh
				</Button>
				{actions}
			</div>
			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : null}
			{isLoading && !path ? (
				<output className="flex items-center gap-2 text-muted-foreground text-sm">
					{/* the output announces the text, so the spinner is not a second status */}
					<Spinner className="size-4" aria-hidden />
					Reading how the limits apply...
				</output>
			) : null}
			{path ? (
				<UsageLimitPathView
					path={path}
					isOwn={isOwn}
					headingLevel={headingLevel}
				/>
			) : null}
		</div>
	);
};
