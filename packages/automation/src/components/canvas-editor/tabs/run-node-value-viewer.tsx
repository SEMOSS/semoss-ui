import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import { Alert, AlertDescription, Button } from "@semoss/ui/next";
import { getAutomationRunNodeValue } from "../../../api";
import { normalizeAutomationErrorMessage } from "../../../domain/automation-utils";

interface RunNodeValueViewerProps {
	appId: string;
	runId: string;
	nodeId: string;
	outputPreview: string;
	onOutputPopout: (output: string) => void;
}

/** Loads one selected retained JSON/scalar value while keeping run detail bounded. */
export function RunNodeValueViewer({
	appId,
	runId,
	nodeId,
	outputPreview,
	onOutputPopout,
}: RunNodeValueViewerProps) {
	const [output, setOutput] = useState(outputPreview);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const value = await getAutomationRunNodeValue(appId, runId, nodeId);
			setOutput(
				value.outputValue ?? value.outputPreview ?? outputPreview,
			);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? normalizeAutomationErrorMessage(requestError.message)
					: "Unable to load the retained node value.",
			);
			setOutput(outputPreview);
		} finally {
			setLoading(false);
		}
	}, [appId, nodeId, outputPreview, runId]);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading) {
		return (
			<output className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground text-xs">
				<Loader2 className="size-4 animate-spin" aria-hidden="true" />
				<span>Loading retained value…</span>
			</output>
		);
	}

	return (
		<div className="space-y-2">
			{error ? (
				<Alert className="flex items-center justify-between gap-2">
					<AlertDescription>
						{error} Showing the saved preview.
					</AlertDescription>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => void load()}
						aria-label="Retry loading retained node value"
					>
						<RefreshCw className="size-4" aria-hidden="true" />
					</Button>
				</Alert>
			) : null}
			<CellOutputBlock
				output={output}
				onOutputPopout={() => onOutputPopout(output)}
			/>
		</div>
	);
}
