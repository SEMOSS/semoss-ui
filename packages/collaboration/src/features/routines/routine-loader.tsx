import { type ReactNode, useEffect } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Skeleton,
} from "@semoss/ui/next";
import { callPixel, type OutputSchema } from "@/lib/pixel";
import { ROUTINE_RUN_DELETED } from "./api/delete-routine-run";

interface RoutineLoaderProps<T> {
	/** The Pixel that returns the owner's routine. */
	pixel: string;
	/** Validates the routine before anything editable renders. */
	schema: OutputSchema<T>;
	/** Renders the validated routine; update replaces it after a successful save. */
	children: (routine: T, update: (routine: T) => void) => ReactNode;
}

/** Loads one routine; failed or unverifiable reads never become an editable default. */
export function RoutineLoader<T>({
	pixel,
	schema,
	children,
}: RoutineLoaderProps<T>) {
	const { actions } = useInsight();
	const result = usePixel<unknown>(pixel);
	const { update } = result;
	// a deleted run can be the latest; re-read in place, since a refresh would reset the form
	useEffect(() => {
		const reread = () => {
			callPixel(actions, pixel, schema)
				.then(update)
				.catch(() => {
					// keep what is shown; the next visit reads it again
				});
		};
		window.addEventListener(ROUTINE_RUN_DELETED, reread);
		return () => window.removeEventListener(ROUTINE_RUN_DELETED, reread);
	}, [actions, pixel, schema, update]);
	const parsed = schema.safeParse(result.data);
	const isLoading =
		result.status === "INITIAL" || result.status === "LOADING";
	const error =
		result.status === "ERROR"
			? result.error?.message || "Your routine could not be loaded."
			: !isLoading && !parsed.success
				? "Your routine settings could not be verified. Please try again."
				: null;
	if (isLoading) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-24 w-full" />
				<Skeleton className="h-96 w-full" />
				<output className="sr-only">Loading routines…</output>
			</div>
		);
	}
	if (error || !parsed.success) {
		return (
			<Alert variant="destructive">
				<AlertTitle>Could not load routines</AlertTitle>
				<AlertDescription>
					{error}
					<Button variant="outline" onClick={result.refresh}>
						Try again
					</Button>
				</AlertDescription>
			</Alert>
		);
	}
	return children(parsed.data, result.update);
}
