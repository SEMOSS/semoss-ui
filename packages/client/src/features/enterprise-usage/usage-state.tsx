import type { ReactNode } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Skeleton,
} from "@semoss/ui/next";
import type { UsageResult } from "./usage.types";

interface UsageStateProps {
	/** Loading or error state for this independent source. */
	result: UsageResult;
	/** Human-readable name of the source or section. */
	label: string;
	/** Content displayed after successful validation. */
	children: ReactNode;
}

/** A failed source remains visible and retryable, without hiding other available data. */
export function UsageState({ result, label, children }: UsageStateProps) {
	if (result.error)
		return (
			<Alert variant="destructive">
				<AlertTitle>{label} Unavailable</AlertTitle>
				<AlertDescription className="space-y-1">
					<span className="break-words">{result.error}</span>
					<span>
						Verify That Logging Is Enabled And The Log Database Is
						Available.
					</span>
					<Button variant="outline" onClick={result.refresh}>
						Retry {label}
					</Button>
				</AlertDescription>
			</Alert>
		);
	if (result.isLoading)
		return (
			<div className="space-y-2">
				<output className="sr-only">Loading {label}</output>
				<Skeleton className="h-28 w-full" />
				<Skeleton className="h-12 w-full" />
			</div>
		);
	return children;
}
