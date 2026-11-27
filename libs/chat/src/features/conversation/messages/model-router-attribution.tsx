import { ChevronDown } from "lucide-react";
import { Trans, useTranslation } from "@semoss/i18n";
import {
	Badge,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Muted,
	P,
} from "@semoss/ui/next";
import type { ModelRouting } from "../../../types";

/** Props for {@link ModelRouterAttribution}. */
interface ModelRouterAttributionProps {
	/** Confirmed destination and diagnostic evidence for this individual response. */
	routing?: ModelRouting;
}

/**
 * The trace's `selection_source` values that have a description, each under
 * `modelRouter.sources.<value>` in the chat namespace.
 */
const SOURCES = new Set([
	"classifier",
	"sticky",
	"keyword",
	"default",
	"keyword_fallback",
	"default_fallback",
	"weighted",
]);

/**
 * Names the model that answered a routed response, with collapsible routing
 * details: how the route was picked, the classifier's request and result, and
 * any fallback. Renders nothing for a response the router did not route.
 */
export const ModelRouterAttribution = ({
	routing,
}: ModelRouterAttributionProps) => {
	const { t } = useTranslation("chat");
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
	// JSON payloads, each shown in its own scrollable block
	const details = [
		{
			label: t("modelRouter.classifierRequest"),
			value: trace?.classifier_request,
		},
		{
			label: t("modelRouter.classifierResult"),
			value: trace?.classifier_response,
		},
		{
			label: t("modelRouter.destinationAttempts"),
			value: trace?.attempts,
		},
		{ label: t("modelRouter.nestedRouting"), value: trace?.downstream },
	].filter((detail) => detail.value !== undefined);
	return (
		<div className="min-w-0 space-y-2">
			<P className="wrap-anywhere text-base text-muted-foreground">
				<Trans
					t={t}
					i18nKey="modelRouter.answeredBy"
					values={{ name: name || routing.routed_engine_id }}
					components={{
						name: <span className="font-medium text-foreground" />,
					}}
				/>
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
							{t("modelRouter.routingDetails")}
							{hasClassificationFailure && (
								<Badge
									variant="outline"
									className="border-warning/50 text-warning"
								>
									{t("modelRouter.classificationFallback")}
								</Badge>
							)}
							{trace.fallback_used && (
								<Badge
									variant="outline"
									className="border-warning/50 text-warning"
								>
									{t("modelRouter.destinationFailover")}
								</Badge>
							)}
						</Button>
					</CollapsibleTrigger>
					<CollapsibleContent className="min-w-0 space-y-4 rounded-md border border-border p-4">
						<P className="text-base">
							{trace.selection_source &&
							SOURCES.has(trace.selection_source)
								? t(
										`modelRouter.sources.${trace.selection_source}`,
									)
								: trace.selection_source ||
									t("modelRouter.routingCompleted")}
						</P>
						<dl className="grid min-w-0 gap-2 text-base sm:grid-cols-2">
							{[
								[
									t("modelRouter.routerEngine"),
									routing.router_engine_id,
								],
								[
									t("modelRouter.respondingEngine"),
									routing.routed_engine_id,
								],
								[
									t("modelRouter.selectedRoute"),
									trace.selected_route_name ||
										routing.routed_route_name,
								],
								[
									t("modelRouter.classifier"),
									trace.classifier_engine_name ||
										trace.classifier_engine_id,
								],
								[
									t("modelRouter.classifierEngineId"),
									trace.classifier_engine_id,
								],
								[
									t("modelRouter.classifierModel"),
									trace.classifier_model,
								],
								[
									t("modelRouter.classifierStatus"),
									trace.classifier_status,
								],
								[
									t("modelRouter.classifierDuration"),
									typeof trace.classifier_duration_ms ===
									"number"
										? t("modelRouter.durationMs", {
												duration:
													trace.classifier_duration_ms,
											})
										: undefined,
								],
								[
									t("modelRouter.classifierError"),
									trace.classifier_error,
								],
								[t("modelRouter.traceId"), trace.trace_id],
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
								{t("modelRouter.stickyHint")}
							</Muted>
						)}
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	);
};
