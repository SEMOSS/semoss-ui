import { ChevronDown } from "lucide-react";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	P,
} from "@semoss/ui/next";
import type { ModelRouting } from "@/types";

interface ModelRouterAttributionProps {
	/** Confirmed destination and diagnostic evidence for this individual response. */
	routing?: ModelRouting;
}

const SOURCES: Record<string, string> = {
	classifier: "Classifier selected this route",
	sticky: "Reused the conversation's pinned model — classifier skipped",
	keyword: "Matched a keyword",
	default: "Used the default model",
	keyword_fallback: "Classification failed — matched a fallback keyword",
	default_fallback: "Classification failed — used the default model",
	weighted: "Selected by weighted distribution",
};

/** Shows the serving model plus the actual classifier input/result and fallback evidence. */
export const ModelRouterAttribution = ({
	routing,
}: ModelRouterAttributionProps) => {
	if (
		!routing ||
		typeof routing.routed_engine_id !== "string" ||
		!routing.routed_engine_id.trim()
	)
		return null;
	const name =
		typeof routing.routed_engine_name === "string"
			? routing.routed_engine_name.trim()
			: "";
	const trace = routing.trace;
	const hasClassificationFailure =
		trace?.classifier_status === "error" ||
		trace?.classifier_status === "invalid_choice";
	const details = [
		{ label: "Classifier request", value: trace?.classifier_request },
		{ label: "Classifier result", value: trace?.classifier_response },
		{ label: "Destination attempts", value: trace?.attempts },
		{ label: "Nested routing", value: trace?.downstream },
	].filter((detail) => detail.value !== undefined);
	return (
		<div className="min-w-0 space-y-2">
			<P className="wrap-anywhere text-base text-muted-foreground">
				Answered by{" "}
				<span className="font-medium text-foreground">
					{name || routing.routed_engine_id}
				</span>
				{routing.routed_route_name
					? ` · ${routing.routed_route_name}`
					: ""}
			</P>
			{trace && (
				<Collapsible>
					<CollapsibleTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-auto min-h-8 max-w-full flex-wrap justify-start gap-2 whitespace-normal bg-transparent text-start text-foreground"
						>
							<ChevronDown
								aria-hidden="true"
								className="size-4 shrink-0"
							/>
							Routing details
							{hasClassificationFailure && (
								<Badge
									variant="outline"
									className="border-warning/50 text-warning"
								>
									Classification fallback
								</Badge>
							)}
							{trace.fallback_used && (
								<Badge
									variant="outline"
									className="border-warning/50 text-warning"
								>
									Destination failover
								</Badge>
							)}
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="min-w-0 space-y-4 rounded-md border border-border p-4">
						<P className="text-base">
							{SOURCES[trace.selection_source || ""] ||
								trace.selection_source ||
								"Routing completed"}
						</P>
						<dl className="grid min-w-0 gap-2 text-base sm:grid-cols-2">
							{[
								["Router engine", routing.router_engine_id],
								["Responding engine", routing.routed_engine_id],
								[
									"Selected route",
									trace.selected_route_name ||
										routing.routed_route_name,
								],
								[
									"Classifier",
									trace.classifier_engine_name ||
										trace.classifier_engine_id,
								],
								[
									"Classifier engine ID",
									trace.classifier_engine_id,
								],
								["Classifier model", trace.classifier_model],
								["Classifier status", trace.classifier_status],
								[
									"Classifier duration",
									typeof trace.classifier_duration_ms ===
									"number"
										? `${trace.classifier_duration_ms} ms`
										: undefined,
								],
								["Classifier error", trace.classifier_error],
								["Trace ID", trace.trace_id],
							]
								.filter(([, value]) => value !== undefined)
								.map(([label, value]) => (
									<div key={label} className="min-w-0">
										<dt className="text-muted-foreground">
											{label}
										</dt>
										<dd className="wrap-anywhere">
											{value}
										</dd>
									</div>
								))}
						</dl>
						{details.map((detail) => (
							<div
								key={detail.label}
								className="min-w-0 space-y-2"
							>
								<P className="font-medium text-base">
									{detail.label}
								</P>
								<section
									// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the classifier payload.
									tabIndex={0}
									aria-label={detail.label}
									className="max-h-80 min-w-0 overflow-auto rounded-md bg-muted p-3 focus-visible:outline-2 focus-visible:outline-ring"
								>
									<pre className="wrap-anywhere whitespace-pre-wrap text-sm">
										{JSON.stringify(detail.value, null, 2)}
									</pre>
								</section>
							</div>
						))}
						{trace.classifier_status === "skipped_sticky" && (
							<Muted className="text-base">
								Turn off conversation pinning in the router
								settings to classify each request.
							</Muted>
						)}
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
};
