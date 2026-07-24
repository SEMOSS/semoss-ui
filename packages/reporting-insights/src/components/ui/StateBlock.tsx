/**
 * Standardized loading / empty / error placeholders. Loading uses the shared
 * @semoss/ui Spinner and errors use the shared Alert; the empty state is a small
 * composition (no direct shared equivalent) built on the shared tokens.
 */

import { AlertCircle } from "lucide-react";
import type { ElementType, ReactNode } from "react";
import { Alert, AlertDescription, cn, Spinner } from "@semoss/ui/next";

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	className,
}: {
	icon?: ElementType;
	title: string;
	description?: ReactNode;
	action?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center px-6 py-14 text-center",
				className,
			)}
		>
			{Icon && (
				<div className="mb-3.5 grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-border">
					<Icon className="h-5 w-5" />
				</div>
			)}
			<p className="font-semibold text-foreground text-sm">{title}</p>
			{description && (
				<p className="mt-1 max-w-sm text-muted-foreground text-xs leading-relaxed">
					{description}
				</p>
			)}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}

export function LoadingState({
	message = "Loading…",
	className,
}: {
	message?: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground",
				className,
			)}
		>
			<Spinner className="h-6 w-6 text-indigo-500" />
			<p className="font-medium text-xs">{message}</p>
		</div>
	);
}

export function ErrorState({
	message,
	className,
}: {
	message: ReactNode;
	className?: string;
}) {
	return (
		<Alert variant="destructive" className={className}>
			<AlertCircle className="h-4 w-4" />
			<AlertDescription className="break-words">
				{message}
			</AlertDescription>
		</Alert>
	);
}
