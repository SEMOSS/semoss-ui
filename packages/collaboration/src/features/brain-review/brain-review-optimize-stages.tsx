import { ChevronRight } from "lucide-react";
import { z } from "@semoss/ui/next";

const itemSchema = z.object({
	label: z.string(),
	topic: z.string().optional(),
	confidence: z.number().optional(),
	result: z.string(),
});
const stageSchema = z.object({
	key: z.string(),
	model: z.string().optional(),
	status: z.enum(["running", "ok", "skipped", "failed"]),
	calls: z.number().int().nonnegative().optional(),
	note: z.string().optional(),
	summary: z.string().optional(),
	items: z.array(itemSchema).default([]),
});
const stagesSchema = z.array(stageSchema);
type Stage = z.infer<typeof stageSchema>;

const labels: Record<string, string> = {
	filing: "Filing check",
	newTopics: "New topics",
	merges: "Duplicate topics",
	topicsAndPeople: "Quiet topics and people",
};

function usage(stage: Stage): string {
	if (!stage.model) return "No model needed";
	const calls = stage.calls ?? 0;
	return stage.key === "filing"
		? `${stage.model} · ${calls} conversation${calls === 1 ? "" : "s"} scored`
		: `${stage.model} · ${calls} model call${calls === 1 ? "" : "s"}`;
}

function outcome(stage: Stage, jobFailed: boolean): string {
	if (stage.status === "ok") return "Done";
	if (stage.status === "skipped") return `Skipped: ${stage.note ?? ""}`;
	if (stage.status === "failed")
		return `Failed: ${stage.note ?? "model error"}`;
	return jobFailed ? "Failed here" : "Running…";
}

/** Shows which model each Optimize step used and whether it succeeded, so a zero count is explained. */
export function OptimizeStages({
	counts,
	jobFailed,
}: {
	counts: Record<string, unknown>;
	jobFailed: boolean;
}) {
	const parsed = stagesSchema.safeParse(counts.stages);
	if (!parsed.success || parsed.data.length === 0) return null;
	const anyFailed = parsed.data.some(
		(stage) =>
			stage.status === "failed" ||
			(jobFailed && stage.status === "running"),
	);
	return (
		<details
			className="group rounded-md border bg-card text-sm"
			open={anyFailed}
		>
			<summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md px-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
				<ChevronRight
					aria-hidden
					className="size-4 shrink-0 transition-transform group-open:rotate-90"
				/>
				<span className="font-medium">More details</span>
				<span className="text-muted-foreground text-xs">
					Models used and what each step decided
				</span>
			</summary>
			<ul
				className="space-y-3 border-t px-3 py-3"
				aria-label="Optimize steps"
			>
				{parsed.data.map((stage) => {
					const failed =
						stage.status === "failed" ||
						(jobFailed && stage.status === "running");
					return (
						<li key={stage.key} className="space-y-1 break-words">
							<div className="flex flex-wrap gap-x-2">
								<span className="font-medium">
									{labels[stage.key] ?? stage.key}
								</span>
								<span className="text-muted-foreground">
									{usage(stage)}
								</span>
								<span
									className={
										failed ? "text-destructive" : undefined
									}
								>
									{outcome(stage, jobFailed)}
								</span>
							</div>
							{stage.summary && (
								<p className="text-muted-foreground">
									{stage.summary}
								</p>
							)}
							{stage.items.length > 0 && (
								<ul
									className="max-h-64 space-y-1 overflow-auto border-l pl-3"
									aria-label={`${labels[stage.key] ?? stage.key} results`}
								>
									{stage.items.map((item, index) => (
										<li
											// biome-ignore lint/suspicious/noArrayIndexKey: labels can repeat
											key={index}
										>
											<span>{item.label}</span>
											{item.topic && (
												<span className="text-muted-foreground">
													{" → "}
													{item.topic}
													{item.confidence !==
														undefined &&
														` ${item.confidence}%`}
												</span>
											)}
											<span>{` · ${item.result}`}</span>
										</li>
									))}
								</ul>
							)}
						</li>
					);
				})}
			</ul>
		</details>
	);
}
