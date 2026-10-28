import { Cpu, MemoryStick, TriangleAlert } from "lucide-react";
import { type ReactElement, useId } from "react";
import { H3, Muted, P, Progress, Skeleton } from "@semoss/ui/next";
import type { ServingCapacity } from "@/api/model-serving";
import {
	SERVED_MODEL_STATE_LABELS,
	servingLabel,
} from "./model-serving-labels";

export interface ServingCapacitySummaryProps {
	/** The capacity; null while it loads or when it cannot be read */
	capacity: ServingCapacity | null;
	/** Why it cannot be read */
	error: string | null;
	isLoading: boolean;
}

/** A share of the unified memory, as a whole percentage. */
const percent = (fraction: number): string => `${Math.round(fraction * 100)}%`;

/**
 * What the served models share: the GPUs, and the share of the unified memory
 * they may use together (KSERVE_MEMORY_BUDGET).
 */
export function ServingCapacitySummary({
	capacity,
	error,
	isLoading,
}: ServingCapacitySummaryProps): ReactElement | null {
	const titleId = useId();
	if (isLoading) {
		return (
			<div className="grid gap-3 md:grid-cols-2">
				<Skeleton className="h-24 w-full rounded-lg" />
				<Skeleton className="h-24 w-full rounded-lg" />
			</div>
		);
	}
	if (!capacity) {
		return error ? (
			<P className="flex items-start gap-2 text-muted-foreground text-sm">
				<TriangleAlert
					className="mt-0.5 size-4 shrink-0 text-warning"
					aria-hidden
				/>
				<span>The GPU and memory use could not be read: {error}</span>
			</P>
		) : null;
	}

	const { gpus, memory } = capacity;
	const holders = gpus.holders.map((holder) =>
		holder.servedModel
			? `${holder.servedModel} (${
					holder.leaving
						? "stopping"
						: servingLabel(
								SERVED_MODEL_STATE_LABELS,
								holder.state,
							).toLowerCase()
				})`
			: `pod ${holder.pod ?? "unknown"}`,
	);
	const memoryValue =
		memory.budget > 0
			? Math.min(100, (memory.used / memory.budget) * 100)
			: 0;

	return (
		<section aria-labelledby={titleId} className="flex flex-col gap-2">
			<H3 id={titleId} className="sr-only">
				Capacity
			</H3>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="flex min-w-0 flex-col gap-2 rounded-lg border p-3">
					<div className="flex items-center gap-2">
						<Cpu
							className="size-4 text-muted-foreground"
							aria-hidden
						/>
						<span className="font-medium text-sm">GPUs</span>
					</div>
					<P className="text-sm">
						{gpus.offered === null
							? `${gpus.held} in use`
							: `${gpus.held} of ${gpus.offered} in use`}
					</P>
					<Muted className="text-xs">
						{holders.length > 0
							? `Held by ${holders.join(", ")}`
							: "No model holds a GPU."}
					</Muted>
				</div>
				<div className="flex min-w-0 flex-col gap-2 rounded-lg border p-3">
					<div className="flex items-center gap-2">
						<MemoryStick
							className="size-4 text-muted-foreground"
							aria-hidden
						/>
						<span className="font-medium text-sm">
							Unified memory
						</span>
					</div>
					<P className="text-sm">
						{percent(memory.used)} in use of the{" "}
						{percent(memory.budget)} models may use
					</P>
					<Progress
						value={memoryValue}
						aria-label="Memory the models use, of their budget"
						aria-valuetext={`${percent(memory.used)} of ${percent(memory.budget)}`}
						className="h-1.5"
					/>
					<Muted className="text-xs">
						{memory.models.length > 0
							? memory.models
									.map(
										(use) =>
											`${use.servedModel} ${percent(use.fraction)}${use.leaving ? " (stopping)" : ""}`,
									)
									.join(", ")
							: "No model uses any."}
					</Muted>
				</div>
			</div>
			{capacity.warnings.map((warning) => (
				<P
					key={warning}
					className="flex items-start gap-2 text-muted-foreground text-sm"
				>
					<TriangleAlert
						className="mt-0.5 size-4 shrink-0 text-warning"
						aria-hidden
					/>
					<span>{warning}</span>
				</P>
			))}
		</section>
	);
}
