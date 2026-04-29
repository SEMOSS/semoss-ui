import { Activity, ChevronDown, ChevronRight, RefreshCcw } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Spinner,
} from "@semoss/ui/next";
import { TraceTree } from "./TraceTree";
import type { AgentTrace } from "./types";

interface AgentTracePanelProps {
	roomId: string;
	insightId: string;
}

/**
 * Collapsible "Agent Traces" section shown below chat in the room view.
 * Fetches traces for the current room whenever it mounts or is manually refreshed.
 */
export const AgentTracePanel: React.FC<AgentTracePanelProps> = ({
	roomId,
	insightId,
}) => {
	const [open, setOpen] = useState(false);
	const [traces, setTraces] = useState<AgentTrace[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchTraces = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await runPixel<[AgentTrace[]]>(
				`ListAgentTraces(limit=["10"], roomId=["${roomId}"]);`,
				insightId,
			);
			const output = res.pixelReturn[0]?.output;
			if (Array.isArray(output)) {
				setTraces(output);
			}
		} catch (e) {
			setError((e as Error).message ?? "Failed to load traces");
		} finally {
			setLoading(false);
		}
	}, [roomId, insightId]);

	// Fetch whenever the panel opens for the first time
	useEffect(() => {
		if (open && traces.length === 0 && !loading) {
			fetchTraces();
		}
	}, [open, traces.length, loading, fetchTraces]);

	return (
		<Collapsible open={open} onOpenChange={setOpen} className="w-full">
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex w-full items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 font-medium text-sm transition-colors hover:bg-muted"
				>
					<Activity className="size-4 text-muted-foreground" />
					<span className="flex-1 text-left">Agent Traces</span>
					{traces.length > 0 && (
						<Badge variant="secondary" className="text-xs">
							{traces.length}
						</Badge>
					)}
					{open ? (
						<ChevronDown className="size-4 text-muted-foreground" />
					) : (
						<ChevronRight className="size-4 text-muted-foreground" />
					)}
				</button>
			</CollapsibleTrigger>

			<CollapsibleContent>
				<div className="mt-1 space-y-3 rounded-md border border-border bg-card p-3">
					<div className="flex items-center justify-between">
						<p className="text-muted-foreground text-xs">
							Traces for this room session
						</p>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={fetchTraces}
							disabled={loading}
							title="Refresh traces"
						>
							{loading ? (
								<Spinner className="size-3.5" />
							) : (
								<RefreshCcw className="size-3.5" />
							)}
						</Button>
					</div>

					{error && <p className="text-red-600 text-xs">{error}</p>}

					{!loading && !error && traces.length === 0 && (
						<p className="text-muted-foreground text-xs">
							No traces yet. Run an agent to see traces here.
						</p>
					)}

					{traces.length > 0 && (
						<TraceTree traces={traces} insightId={insightId} />
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
};
