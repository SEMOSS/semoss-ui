import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
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
	/**
	 * Renders the validated routine; update replaces it after a successful save, and runNow
	 * starts a run, then reads until the run shows, whether it started, was refused or failed.
	 */
	children: (
		routine: T,
		update: (routine: T) => void,
		runNow: (start: () => Promise<T>) => Promise<T>,
	) => ReactNode;
}

/** How often a routine with a run going is read again, while the page is visible. */
const RUNNING_REREAD_MS = 10_000;
/** How often, and for how long, a routine is read again after Run now until its run shows. */
const STARTING_REREAD_MS = 3_000;
const STARTING_WAIT_MS = 60_000;

/** Loads one routine; failed or unverifiable reads never become an editable default. */
export function RoutineLoader<
	T extends { lastRun?: { status: string; startedAt: string } | null },
>({ pixel, schema, children }: RoutineLoaderProps<T>) {
	const { actions } = useInsight();
	const result = usePixel<unknown>(pixel);
	const { update } = result;
	const latestRead = useRef(0);
	const [runAskedAt, setRunAskedAt] = useState<number | null>(null);
	// in place, since a refresh would reset the form; only the newest read lands
	const reread = useCallback(() => {
		const read = ++latestRead.current;
		callPixel(actions, pixel, schema)
			.then((next) => {
				if (read === latestRead.current) update(next);
			})
			.catch(() => {
				// keep what is shown; the next read tries again
			});
	}, [actions, pixel, schema, update]);
	// a deleted run can be the latest
	useEffect(() => {
		window.addEventListener(ROUTINE_RUN_DELETED, reread);
		return () => window.removeEventListener(ROUTINE_RUN_DELETED, reread);
	}, [reread]);
	// a save or a run start is newer than any read already asked, so those reads no longer land
	const replace = (next: T): void => {
		latestRead.current++;
		update(next);
	};
	// the server can answer before its run claims, or refuse because one this page has not read is going; read on either way
	const runNow = async (start: () => Promise<T>): Promise<T> => {
		const askedAt = Date.now();
		try {
			const next = await start();
			replace(next);
			return next;
		} finally {
			setRunAskedAt(askedAt);
		}
	};
	const parsed = schema.safeParse(result.data);
	const lastRun = parsed.success ? parsed.data.lastRun : null;
	const isRunning = lastRun?.status === "running";
	const isStarting =
		runAskedAt !== null &&
		!isRunning &&
		!(lastRun && Date.parse(lastRun.startedAt) > runAskedAt);
	// a run started here, by Run now or on schedule, ends without the page asking; read until it does
	useEffect(() => {
		if (!isRunning && !isStarting) return;
		const timer = window.setInterval(
			() => {
				if (document.visibilityState !== "hidden") reread();
			},
			isRunning ? RUNNING_REREAD_MS : STARTING_REREAD_MS,
		);
		return () => window.clearInterval(timer);
	}, [isRunning, isStarting, reread]);
	// a run that never shows stops being looked for
	useEffect(() => {
		if (runAskedAt === null) return;
		const timer = window.setTimeout(
			() => setRunAskedAt(null),
			STARTING_WAIT_MS,
		);
		return () => window.clearTimeout(timer);
	}, [runAskedAt]);
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
	return children(parsed.data, replace, runNow);
}
