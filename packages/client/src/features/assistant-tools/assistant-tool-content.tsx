import { Env, usePixel } from "@semoss/sdk/react";
import { Alert, AlertDescription, Button, Spinner } from "@semoss/ui/next";
import { toolOwnerQuery } from "@/api/assistant-tools";
import { AssistantPendingActions } from "@/components/assistant/assistant-pending-actions";
import { displayToolName } from "@/components/assistant/assistant-tools";
import type { BuildRun, BuildTool } from "@/stores/assistant/assistant.runs";
import {
	getAssistantToolResource,
	getAssistantToolUi,
	getPresentedTool,
	isToolViewReady,
} from "./assistant-tool-ui";
import { useEmbeddedTool } from "./use-embedded-tool";

interface AssistantToolContentProps {
	/** Owning run, including child-run room identity. */
	run: BuildRun;
	/** Tool with live/durable metadata and message identity reconciled. */
	tool: BuildTool;
	/** Whether this view owns generic controls when its authored page is unavailable. */
	showApprovals?: boolean;
}

/** Authored tool page with accessible approvals. */
export const AssistantToolContent = ({
	run,
	tool: originalTool,
	showApprovals = true,
}: AssistantToolContentProps) => {
	const tool = getPresentedTool(run, originalTool);
	const ui = getAssistantToolUi(tool.metadata);
	const resource = getAssistantToolResource(run, tool);
	const pending = run.pendingActions.filter(
		(action) => action.toolCallId === tool.id,
	);
	const query =
		resource?.kind === "portal"
			? toolOwnerQuery(resource.owner, resource.engineType)
			: "";
	const info = usePixel<{ project_type?: string }>(query, { data: {} });
	const isReady = isToolViewReady(run, tool);
	const pageUrl =
		resource?.kind === "page"
			? resource.url
			: resource?.kind === "portal" && info.status === "SUCCESS"
				? info.data?.project_type === "BLOCKS"
					? `./#/s/${encodeURIComponent(resource.owner)}${resource.path}`
					: (resource.approvalUrl ??
						`${Env.MODULE}/public_home/${encodeURIComponent(resource.owner)}/portals${resource.path}`)
				: "";
	const {
		url,
		frameKey,
		frameRef,
		onLoad,
		error,
		isSubmitting,
		retry,
		hasFailed,
		hasLoaded,
	} = useEmbeddedTool(isReady ? pageUrl : "", run, tool);
	const isLoading =
		(!hasLoaded &&
			Boolean(query) &&
			(info.status === "INITIAL" || info.status === "LOADING")) ||
		(Boolean(url) && !hasLoaded && !hasFailed);
	const hasLoadError =
		hasFailed || (!hasLoaded && Boolean(query) && info.status === "ERROR");
	const shouldShowApprovals =
		showApprovals &&
		pending.length > 0 &&
		!isLoading &&
		!error &&
		(!url || hasFailed);
	return (
		<div className="flex h-full min-h-0 min-w-0 flex-col gap-3 overflow-auto p-3">
			{!url && !isReady && (
				<output className="text-muted-foreground text-sm">
					{ui?.loadingMessage || "Running tool…"}
				</output>
			)}
			{isLoading && (
				<output className="flex items-center gap-2 text-muted-foreground text-sm">
					<Spinner className="size-4" />
					Loading tool UI…
				</output>
			)}
			{url && !hasFailed && (
				<iframe
					key={frameKey}
					ref={frameRef}
					src={url}
					title={displayToolName(tool)}
					className="min-h-80 w-full flex-1 border-0 bg-background"
					onLoad={onLoad}
				/>
			)}
			{hasLoadError && (
				<Alert variant="destructive">
					<AlertDescription>
						The tool UI could not be loaded. You can review the
						arguments and use the standard approval controls.
					</AlertDescription>
				</Alert>
			)}
			{error && (
				<Alert variant="destructive">
					<AlertDescription>
						{error}
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={retry}
						>
							Retry result submission
						</Button>
					</AlertDescription>
				</Alert>
			)}
			{shouldShowApprovals && (
				<section
					aria-label="Standard tool approval"
					className="rounded-md"
				>
					<AssistantPendingActions
						run={{ ...run, pendingActions: pending }}
						includeToolUiActions
					/>
				</section>
			)}
		</div>
	);
};
