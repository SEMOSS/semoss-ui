import { Badge, Checkbox, P, Spinner } from "@semoss/ui/next";

interface GuardrailSelectorPanelProps {
	direction: "input" | "output";
	guardrails: unknown[];
	selected: string[];
	onChange: (ids: string[]) => void;
	isLoading?: boolean;
}

export const GuardrailSelectorPanel = ({
	direction,
	guardrails,
	selected,
	onChange,
	isLoading = false,
}: GuardrailSelectorPanelProps) => {
	const isInput = direction === "input";

	const toggle = (id: string) => {
		onChange(
			selected.includes(id)
				? selected.filter((s) => s !== id)
				: [...selected, id],
		);
	};

	return (
		<div
			className={`flex flex-col gap-2 rounded-lg border p-3 ${
				isInput
					? "border-primary/20 bg-primary/5"
					: "border-chart-2/20 bg-chart-2/5"
			}`}
		>
			{/* Fixed-height header — prevents layout shift */}
			<div className="flex h-5 items-center justify-between">
				<span
					className={`font-semibold text-xs ${
						isInput ? "text-primary" : "text-chart-2"
					}`}
				>
					{isInput ? "Input" : "Output"} Guardrails
				</span>
				<Badge
					variant="outline"
					className={`rounded-full border-transparent px-1.5 py-0.5 text-[10px] transition-opacity duration-150 ${
						isInput
							? "bg-primary/10 text-primary"
							: "bg-chart-2/10 text-chart-2"
					} ${
						selected.length > 0
							? "opacity-100"
							: "pointer-events-none opacity-0"
					}`}
				>
					{selected.length} selected
				</Badge>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-4">
					<Spinner className="size-4" />
				</div>
			) : guardrails.length === 0 ? (
				<P className="py-2 text-center text-muted-foreground text-xs italic">
					No guardrails available.
				</P>
			) : (
				<div className="max-h-40 space-y-0.5 overflow-y-auto">
					{guardrails.map((g) => {
						const guardrail = g as Record<string, unknown>;
						const databaseId = String(
							guardrail.database_id ?? "",
						);
						const databaseName = String(
							guardrail.database_name ?? "",
						);
						const databaseType = String(
							guardrail.database_type ?? "",
						);
						const isSel = selected.includes(databaseId);
						return (
							<button
								key={databaseId}
								type="button"
								onClick={() => toggle(databaseId)}
								className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent/60 ${
									isSel ? "bg-accent" : ""
								}`}
							>
								<Checkbox
									checked={isSel}
									onCheckedChange={() => toggle(databaseId)}
									onClick={(e) => e.stopPropagation()}
									className="shrink-0"
								/>
								<div className="min-w-0 flex-1">
									<span
										className="block truncate font-medium text-foreground text-xs"
										title={databaseName}
									>
										{databaseName}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{databaseType}
									</span>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};
