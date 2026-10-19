import { Table2 } from "lucide-react";
import { useContext } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Muted,
	Spinner,
} from "@semoss/ui/next";
import { useAutomationInputPreview } from "../../../hooks/use-automation-input-preview";
import { AutomationVariableContext } from "../automation-variable-context";
import { RunNodeDataViewer } from "../tabs/run-node-data-viewer";

interface InputTableInspectorProps {
	appId: string;
	source: string;
	label?: string;
}

/** Opens the newest authorized retained output for an upstream table reference. */
export function InputTableInspector({
	appId,
	source,
	label = "input table",
}: InputTableInspectorProps) {
	const { entries } = useContext(AutomationVariableContext);
	const sourceName = source
		.trim()
		.match(/^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/)?.[1];
	const sourceEntry = entries.find(
		(entry) => entry.name === sourceName && entry.source === "node",
	);
	const input = useAutomationInputPreview(
		appId,
		sourceEntry?.sourceNodeId,
		source,
	);
	const canInspect = Boolean(appId && sourceEntry?.sourceNodeId);

	return (
		<div className="space-y-2">
			<Dialog>
				<DialogTrigger asChild>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!canInspect || input.loading}
						onClick={() => void input.load()}
					>
						{input.loading ? (
							<Spinner className="size-4" />
						) : (
							<Table2 className="size-4" aria-hidden="true" />
						)}
						Inspect table
					</Button>
				</DialogTrigger>
				<DialogContent className="max-h-dvh max-w-5xl overflow-hidden">
					<DialogHeader>
						<DialogTitle>
							Inspect {sourceEntry?.label ?? label}
						</DialogTitle>
						<DialogDescription>
							Shows the newest retained successful output.
							Inspecting does not execute the automation.
						</DialogDescription>
					</DialogHeader>
					<div className="min-h-0 overflow-y-auto">
						{input.loading ? (
							<output className="flex min-h-32 items-center justify-center gap-2 text-muted-foreground text-sm">
								<Spinner className="size-4" />
								<span>Loading retained table…</span>
							</output>
						) : input.error ? (
							<Alert variant="destructive">
								<AlertDescription className="flex flex-wrap items-center justify-between gap-2">
									<span>{input.error}</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => void input.load()}
									>
										Retry
									</Button>
								</AlertDescription>
							</Alert>
						) : input.empty ? (
							<output className="block rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
								No retained table output was found in the 20
								most recent runs.
							</output>
						) : input.preview ? (
							<div className="space-y-3">
								<Muted>
									Run started {input.preview.startedAt}
								</Muted>
								<RunNodeDataViewer
									appId={appId}
									insightId={input.preview.insightId}
									frame={input.preview.frame}
									savedResult={input.preview.savedResult}
									outputPreview={input.preview.outputPreview}
								/>
							</div>
						) : null}
					</div>
				</DialogContent>
			</Dialog>
			{!canInspect ? (
				<Muted>
					Choose an upstream table from a prior step to inspect it.
				</Muted>
			) : null}
		</div>
	);
}
