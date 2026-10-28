import { CircleAlert, TriangleAlert } from "lucide-react";
import type { ReactElement } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	H3,
	InlineCode,
	Muted,
	P,
	Skeleton,
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import type { ServedModelDetail } from "@/api/model-serving";
import {
	describeLastAction,
	formatServingDuration,
	SERVED_MODEL_FAILURE_LABELS,
	SERVED_MODEL_PHASE_LABELS,
	servingLabel,
} from "./model-serving-labels";
import { ServedModelFact } from "./served-model-fact";
import { ServedModelLogBlock } from "./served-model-log-block";
import { ServedModelProgress } from "./served-model-progress";
import { ServedModelStateBadge } from "./served-model-state-badge";
import { ServedModelTime } from "./served-model-time";

export interface ServedModelDetailsProps {
	/** The model's full status; null until it is read */
	detail: ServedModelDetail | null;
	/** Why it could not be read; the last status read stays */
	error: string | null;
	isLoading: boolean;
}

const SECTION_TITLE = "font-medium text-base";

/**
 * A served model's full status: where it is, why it failed, how to reach it,
 * how it is set up, its last start step by step, and the cluster's events.
 */
export function ServedModelDetails({
	detail,
	error,
	isLoading,
}: ServedModelDetailsProps): ReactElement {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				<output className="sr-only">
					Loading the model's status...
				</output>
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-32 w-full" />
			</div>
		);
	}
	if (!detail) {
		return (
			<Alert variant="destructive">
				<AlertTitle>The status could not be read</AlertTitle>
				<AlertDescription className="break-words">
					{error ?? "The server did not return it."}
				</AlertDescription>
			</Alert>
		);
	}

	const { failure, vllm } = detail;
	return (
		<div className="flex flex-col gap-6">
			{error ? (
				<Alert className="border-warning/40 bg-warning/10 text-warning">
					<TriangleAlert aria-hidden />
					<AlertTitle>Showing the last status read</AlertTitle>
					<AlertDescription className="break-words text-foreground">
						{error}
					</AlertDescription>
				</Alert>
			) : null}

			<section className="flex flex-col gap-2">
				<H3 className={SECTION_TITLE}>Status</H3>
				<div className="flex flex-wrap items-center gap-2">
					<ServedModelStateBadge state={detail.state} />
					{detail.phaseSince ? (
						<Muted className="text-xs">
							Since <ServedModelTime value={detail.phaseSince} />
						</Muted>
					) : null}
				</div>
				{detail.message ? (
					<P className="text-sm">{detail.message}</P>
				) : null}
				{detail.state === "STARTING" ? (
					<ServedModelProgress model={detail} />
				) : null}
			</section>

			{failure ? (
				<Alert variant="destructive">
					<CircleAlert aria-hidden />
					<AlertTitle>
						{servingLabel(
							SERVED_MODEL_FAILURE_LABELS,
							failure.cause,
						)}
						{failure.container ? ` in ${failure.container}` : ""}
					</AlertTitle>
					<AlertDescription className="flex flex-col gap-2 break-words">
						{failure.message ? (
							<span>{failure.message}</span>
						) : null}
						{failure.hint ? (
							<span className="text-foreground">
								{failure.hint}
							</span>
						) : null}
						{failure.logTail.length > 0 ? (
							<ServedModelLogBlock
								label="The end of its log"
								lines={failure.logTail}
								className="max-h-48"
							/>
						) : null}
					</AlertDescription>
				</Alert>
			) : null}

			{detail.warnings.length > 0 ? (
				<Alert className="border-warning/40 bg-warning/10 text-warning">
					<TriangleAlert aria-hidden />
					<AlertTitle>
						{detail.warnings.length === 1
							? "1 warning"
							: `${detail.warnings.length} warnings`}
					</AlertTitle>
					<AlertDescription className="text-foreground">
						<ul className="list-disc pl-4">
							{detail.warnings.map((warning) => (
								<li key={warning} className="break-words">
									{warning}
								</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			) : null}

			<section className="flex flex-col gap-2">
				<H3 className={SECTION_TITLE}>Endpoint</H3>
				<dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
					<ServedModelFact term="SEMOSS calls">
						{detail.endpoint ? (
							<InlineCode className="break-all text-xs">
								{detail.endpoint}
							</InlineCode>
						) : null}
					</ServedModelFact>
					<ServedModelFact term="In the cluster">
						{detail.inClusterUrl ? (
							<InlineCode className="break-all text-xs">
								{detail.inClusterUrl}
							</InlineCode>
						) : null}
					</ServedModelFact>
					<ServedModelFact term="For the LAN">
						{detail.hostPort !== null
							? `Node port ${detail.hostPort}`
							: null}
					</ServedModelFact>
				</dl>
				{detail.endpointNote ? (
					<Muted className="text-xs">{detail.endpointNote}</Muted>
				) : null}
			</section>

			<section className="flex flex-col gap-2">
				<H3 className={SECTION_TITLE}>Setup</H3>
				<dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
					<ServedModelFact term="Catalog entry">
						{detail.catalogEntry}
					</ServedModelFact>
					<ServedModelFact term="Defined by">
						{detail.managed
							? "SEMOSS"
							: "Outside SEMOSS, such as kubectl"}
					</ServedModelFact>
					<ServedModelFact term="Weights">
						{detail.storageUri ? (
							<InlineCode className="break-all text-xs">
								{detail.storageUri}
							</InlineCode>
						) : null}
					</ServedModelFact>
					<ServedModelFact term="Runtime">
						{detail.runtime}
					</ServedModelFact>
					<ServedModelFact term="Memory share">
						{detail.gpuMemoryUtilization !== null
							? `${Math.round(detail.gpuMemoryUtilization * 100)}% of the unified memory`
							: null}
					</ServedModelFact>
					<ServedModelFact term="Architecture">
						{vllm.architecture}
					</ServedModelFact>
					<ServedModelFact term="Context length">
						{vllm.maxModelLen !== null
							? `${vllm.maxModelLen} tokens`
							: null}
					</ServedModelFact>
					<ServedModelFact term="Weights in memory">
						{vllm.weightsGiB !== null
							? `${vllm.weightsGiB} GiB`
							: null}
					</ServedModelFact>
					<ServedModelFact term="KV cache">
						{vllm.kvCacheGiB !== null
							? `${vllm.kvCacheGiB} GiB`
							: null}
					</ServedModelFact>
					<ServedModelFact term="Pod">{detail.pod}</ServedModelFact>
					<ServedModelFact term="Restarts">
						{detail.pod ? String(detail.restarts) : null}
					</ServedModelFact>
					<ServedModelFact term="Last change">
						{detail.lastAction ? (
							<>
								{describeLastAction(detail.lastAction)}
								{detail.lastAction.at ? (
									<>
										{", "}
										<ServedModelTime
											value={detail.lastAction.at}
										/>
									</>
								) : null}
							</>
						) : null}
					</ServedModelFact>
				</dl>
			</section>

			{detail.phases.length > 0 ? (
				<section className="flex flex-col gap-2">
					<H3 className={SECTION_TITLE}>Last Start</H3>
					<Table>
						<TableCaption className="sr-only">
							Each step of the last start and how long it took
						</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead>Step</TableHead>
								<TableHead>Started</TableHead>
								<TableHead className="text-right">
									Took
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{detail.phases.map((span) => (
								<TableRow
									key={`${span.phase}-${span.startedAt}`}
								>
									<TableCell className="whitespace-normal">
										{servingLabel(
											SERVED_MODEL_PHASE_LABELS,
											span.phase,
										)}
									</TableCell>
									<TableCell>
										{span.startedAt ? (
											<ServedModelTime
												value={span.startedAt}
											/>
										) : null}
									</TableCell>
									<TableCell className="text-right">
										{span.seconds !== null
											? formatServingDuration(
													span.seconds,
												)
											: "Under way"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</section>
			) : null}

			{detail.events.length > 0 ? (
				<section className="flex flex-col gap-2">
					<H3 className={SECTION_TITLE}>Recent Events</H3>
					<ul className="flex flex-col gap-2">
						{detail.events.map((event, index) => (
							<li
								// events have no id; the same reason can repeat at another time
								key={`${event.time}-${event.reason}-${index}`}
								className="flex flex-col gap-0.5 rounded-md border p-2"
							>
								<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
									{event.type === "Warning" ? (
										<TriangleAlert
											className="size-3.5 text-warning"
											aria-hidden
										/>
									) : null}
									<span className="font-medium">
										{event.reason ?? "Event"}
									</span>
									{event.type === "Warning" ? (
										<span className="sr-only">
											(warning)
										</span>
									) : null}
									{event.object ? (
										<Muted className="break-all text-xs">
											{event.object}
										</Muted>
									) : null}
									{event.time ? (
										<Muted className="text-xs">
											<ServedModelTime
												value={event.time}
											/>
										</Muted>
									) : null}
									{event.count !== null && event.count > 1 ? (
										<Muted className="text-xs">
											{event.count} times
										</Muted>
									) : null}
								</div>
								{event.message ? (
									<P className="break-words text-muted-foreground text-xs">
										{event.message}
									</P>
								) : null}
							</li>
						))}
					</ul>
				</section>
			) : null}

			{detail.conditions.length > 0 ? (
				<section className="flex flex-col gap-2">
					<H3 className={SECTION_TITLE}>KServe Conditions</H3>
					<dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-3">
						{detail.conditions.map((condition) => (
							<ServedModelFact
								key={condition.type ?? condition.reason ?? ""}
								term={condition.type ?? "Condition"}
							>
								{[
									condition.status,
									condition.reason,
									condition.message,
								]
									.filter(Boolean)
									.join(" · ")}
							</ServedModelFact>
						))}
					</dl>
				</section>
			) : null}
		</div>
	);
}
