import { useEffect, useState } from "react";
import { FILE_PANEL_COMPONENTS } from "@semoss/panels";
import { useInsight } from "@semoss/sdk/react";
import { Alert, AlertDescription, Small, Spinner } from "@semoss/ui/next";
import type { WorkbenchPanelConfigAny } from "@semoss/workbench";
import { openRoutineDocuments } from "./custom-routine-api";
import { RoutineDocumentsDock } from "./routine-documents-dock";

interface RoutineDocumentsProps {
	/** One of the owner's saved routines. */
	routineId: string;
	/** Panel blueprints; tests swap the file panels for stubs. */
	components?: Record<string, WorkbenchPanelConfigAny>;
}

/** The owner's reference documents for a routine: a folder in their user assets, copied into every run. */
export function RoutineDocuments({
	routineId,
	components = FILE_PANEL_COMPONENTS,
}: RoutineDocumentsProps) {
	const { actions } = useInsight();
	const [path, setPath] = useState<string | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		setPath(null);
		setError("");
		openRoutineDocuments(actions, routineId)
			.then((opened) => {
				if (!cancelled) setPath(opened.path);
			})
			.catch((cause: unknown) => {
				if (!cancelled) {
					setError(
						cause instanceof Error
							? cause.message
							: "That did not work.",
					);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [actions, routineId]);

	return (
		<section
			aria-label="Reference documents"
			className="flex min-h-0 min-w-0 flex-1 flex-col gap-3"
		>
			<Small className="font-normal text-muted-foreground">
				Files your routine can read on every run. Upload, open and edit
				them here; only you see them.
			</Small>
			{error ? (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			) : path === null ? (
				<div className="flex min-h-128 flex-1 items-center gap-3 rounded-lg border p-6">
					<Spinner />
					<output className="text-sm">Opening documents...</output>
				</div>
			) : (
				<RoutineDocumentsDock
					key={path}
					path={path}
					components={components}
				/>
			)}
		</section>
	);
}
