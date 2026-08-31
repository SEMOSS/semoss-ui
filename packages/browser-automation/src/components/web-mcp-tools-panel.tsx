import { CheckCircle2, CircleAlert, RefreshCw, Wrench } from "lucide-react";
import {
	Badge,
	Button,
	Muted,
	Separator,
	Small,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type {
	AutomationHistoryEntry,
	WebMcpDiscovery,
} from "../types/automation.types";

interface WebMcpToolsPanelProps {
	discovery: WebMcpDiscovery;
	history: AutomationHistoryEntry[];
	onRefresh: () => void;
}

/** Displays the active page's WebMCP catalog and calls made by this run. */
export function WebMcpToolsPanel({
	discovery,
	history,
	onRefresh,
}: WebMcpToolsPanelProps) {
	const toolCalls = history.filter((entry) => entry.type === "webmcp");

	return (
		<div className="flex flex-col gap-3">
			<Separator />
			<section
				className="flex flex-col gap-2"
				aria-label="Page WebMCP tools"
			>
				<div className="flex items-center justify-between gap-2">
					<div className="flex min-w-0 items-center gap-2">
						<Wrench className="size-4 shrink-0" aria-hidden />
						<Small className="font-medium">Page WebMCP tools</Small>
						<Badge variant="secondary">
							{discovery.tools.length}
						</Badge>
					</div>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								size="icon-sm"
								variant="ghost"
								onClick={onRefresh}
								disabled={discovery.isLoading}
								aria-label="Refresh WebMCP tools"
							>
								{discovery.isLoading ? (
									<Spinner />
								) : (
									<RefreshCw />
								)}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							Refresh tools exposed by this page
						</TooltipContent>
					</Tooltip>
				</div>

				{discovery.error ? (
					<Muted className="text-destructive">
						{discovery.error}
					</Muted>
				) : discovery.isLoading && discovery.tools.length === 0 ? (
					<div className="flex items-center gap-2">
						<Spinner />
						<Muted>Checking the active page…</Muted>
					</div>
				) : discovery.tools.length === 0 ? (
					<Muted>
						{discovery.message ||
							(discovery.supported
								? "This page exposes no WebMCP tools."
								: "WebMCP is unavailable; automation will use browser controls.")}
					</Muted>
				) : (
					<div className="max-h-36 space-y-2 overflow-y-auto rounded-md border border-border p-2">
						{discovery.tools.map((tool) => (
							<div
								key={`${tool.origin}:${tool.name}`}
								className="min-w-0"
							>
								<Small
									className="block truncate font-medium"
									title={tool.name}
								>
									{tool.title || tool.name}
								</Small>
								{tool.description ? (
									<Muted className="line-clamp-2">
										{tool.description}
									</Muted>
								) : null}
							</div>
						))}
					</div>
				)}
			</section>

			{toolCalls.length > 0 ? (
				<>
					<Separator />
					<section
						className="flex flex-col gap-2"
						aria-label="WebMCP tool call history"
					>
						<div className="flex items-center justify-between gap-2">
							<Small className="font-medium">
								Tool calls this run
							</Small>
							<Badge variant="secondary">
								{toolCalls.length}
							</Badge>
						</div>
						<div className="max-h-32 space-y-2 overflow-y-auto">
							{toolCalls.map((entry) => (
								<div
									key={`${entry.iteration}:${entry.toolName || entry.label}`}
									className="flex items-start gap-2 rounded-md border border-border p-2"
								>
									{entry.status === "success" ? (
										<CheckCircle2
											className="mt-0.5 size-4 shrink-0 text-success"
											aria-hidden
										/>
									) : (
										<CircleAlert
											className="mt-0.5 size-4 shrink-0 text-destructive"
											aria-hidden
										/>
									)}
									<div className="min-w-0">
										<Small className="block truncate font-medium">
											Step {entry.iteration}:{" "}
											{entry.toolName || entry.label}
										</Small>
										<Muted className="line-clamp-2">
											{entry.error ||
												entry.reason ||
												"Tool completed."}
										</Muted>
										{entry.toolResult ? (
											<pre className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap break-all rounded bg-surface-raised p-1 text-xs">
												{entry.toolResult}
											</pre>
										) : null}
									</div>
								</div>
							))}
						</div>
					</section>
				</>
			) : null}
		</div>
	);
}
