import { Badge, Checkbox, Input, P, Spinner } from "@semoss/ui/next";
import { useGuardrailSelectorControls } from "@/contexts";

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
	const {
		hasMoreGuardrails,
		isLoadingMoreGuardrails,
		onLoadMoreGuardrails,
		searchTerm,
		onSearchTermChange,
		isSearchingGuardrails,
		isSearchDebouncing,
	} = useGuardrailSelectorControls();

	const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
		const el = e.currentTarget;
		if (
			hasMoreGuardrails &&
			!isLoadingMoreGuardrails &&
			el.scrollHeight - el.scrollTop - el.clientHeight < 80
		) {
			onLoadMoreGuardrails();
		}
	};
	const isInput = direction === "input";

	const toggle = (id: string) => {
		onChange(
			selected.includes(id)
				? selected.filter((s) => s !== id)
				: [...selected, id],
		);
	};

	const showSearchBusy = isSearchingGuardrails || isSearchDebouncing;
	const emptyMessage = searchTerm.trim()
		? "No guardrails found for your search."
		: "No guardrails available.";

	return (
		<div
			className={`flex flex-col gap-2 rounded-lg border p-3 ${
				isInput
					? "border-primary/20 bg-primary/5"
					: "border-chart-2/20 bg-chart-2/5"
			}`}
		>
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

			<div className="relative">
				<Input
					value={searchTerm}
					onChange={(e) => onSearchTermChange(e.currentTarget.value)}
					placeholder="Search guardrails"
					className="h-7 pr-8 text-xs"
				/>
				{showSearchBusy && (
					<div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
						<Spinner className="size-3" />
					</div>
				)}
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-4">
					<Spinner className="size-4" />
				</div>
			) : guardrails.length === 0 ? (
				<P className="py-2 text-center text-muted-foreground text-xs italic">
					{emptyMessage}
				</P>
			) : (
				<div
					className="max-h-[180px] space-y-0.5 overflow-y-auto pr-1"
					onScroll={handleScroll}
				>
					{guardrails.map((g) => {
						const guardrail = g as Record<string, unknown>;
						const databaseId = String(guardrail.database_id ?? "");
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
					{isLoadingMoreGuardrails && (
						<div className="flex items-center justify-center py-2">
							<Spinner className="size-3" />
						</div>
					)}
				</div>
			)}
		</div>
	);
};
