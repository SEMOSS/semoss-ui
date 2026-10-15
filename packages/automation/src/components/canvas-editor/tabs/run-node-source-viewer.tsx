import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { getAutomationRunSource } from "../../../api/automation-history";
import type { AutomationRunImplementationView } from "../../../domain/automation.types";
import { normalizeAutomationErrorMessage } from "../../../domain/automation-utils";
import {
	getAsyncViewerState,
	RUN_NODE_VIEW_LABELS,
} from "./run-node-view-state";

interface RunNodeSourceViewerProps {
	appId: string;
	runId: string;
	nodeId: string;
}

/** Displays the immutable source snapshot executed for one run node. */
export function RunNodeSourceViewer({
	appId,
	runId,
	nodeId,
}: RunNodeSourceViewerProps) {
	const [source, setSource] =
		useState<AutomationRunImplementationView | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			setSource(await getAutomationRunSource(appId, runId, nodeId));
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? normalizeAutomationErrorMessage(requestError.message)
					: "Unable to load the executed source.",
			);
		} finally {
			setIsLoading(false);
		}
	}, [appId, nodeId, runId]);

	useEffect(() => {
		void load();
	}, [load]);

	const viewerState = getAsyncViewerState(
		isLoading,
		error,
		source !== null,
		source?.viewKind === "PYTHON" && source.source.trim().length === 0,
	);

	if (viewerState === "loading") {
		return (
			<output className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
				<Loader2 className="size-4 animate-spin" aria-hidden />
				<span>Loading executed source…</span>
			</output>
		);
	}

	if (viewerState === "error") {
		return (
			<Alert variant="destructive">
				<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
					<span>{error}</span>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => void load()}
						aria-label={RUN_NODE_VIEW_LABELS.retrySource}
					>
						<RefreshCw className="size-3.5" aria-hidden />
						Retry
					</Button>
				</AlertDescription>
			</Alert>
		);
	}

	if (viewerState === "empty") {
		return (
			<output className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-xs">
				No implementation snapshot was retained for this node.
			</output>
		);
	}

	return (
		<section
			className="max-h-[32rem] overflow-auto rounded-md border bg-muted/30 p-3 focus-visible:outline-2 focus-visible:outline-ring"
			aria-label={RUN_NODE_VIEW_LABELS.executedSource}
			// biome-ignore lint/a11y/noNoninteractiveTabindex: the bounded source snapshot must support keyboard scrolling.
			tabIndex={0}
		>
			<pre className="whitespace-pre-wrap break-words font-mono text-xs">
				<code>
					{source?.viewKind === "PYTHON"
						? `${
								source.sourceIdentity ===
								"developer.python.compatibility"
									? `# developer.python compatibility execution for historical ${source.historicalNodeType ?? "node"} ${source.sourceNodeId}\n`
									: ""
							}${source.source}`
						: JSON.stringify(
								{
									nodeType: source?.nodeType,
									config: source?.config,
									implementationId: source?.implementationId,
									definitionHash: source?.definitionHash,
								},
								null,
								2,
							)}
				</code>
			</pre>
		</section>
	);
}
