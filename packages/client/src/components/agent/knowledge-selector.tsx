import { CheckIcon, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Button,
	Card,
	CardContent,
	cn,
	Input,
	Muted,
	ScrollArea,
	Spinner,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface KnowledgeItem {
	id: string;
	name: string;
	type: "VECTOR";
	description?: string;
}

interface KnowledgeSelectorProps {
	/** Selected knowledge items */
	value: KnowledgeItem[];

	/** Track if disabled */
	disabled?: boolean;

	/** Callback when selection changes */
	onChange: (values: KnowledgeItem[]) => void;

	/** Extra classes */
	className?: string;
}

interface VectorEngine {
	engine_id: string;
	engine_name: string;
	engine_type: "VECTOR";
	description?: string;
}

/**
 * Knowledge selector for agents - simplified version adapted from playground
 */
export const KnowledgeSelector = ({
	value,
	disabled,
	onChange,
	className,
}: KnowledgeSelectorProps) => {
	const { monolithStore } = useRootStore();
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeItem[]>(
		[],
	);

	// Track selected items by ID
	const selectedMap = value.reduce(
		(acc, curr) => {
			acc[curr.id] = curr;
			return acc;
		},
		{} as Record<string, KnowledgeItem>,
	);

	// Fetch knowledge sources
	useEffect(() => {
		const fetchKnowledge = async () => {
			setIsLoading(true);
			try {
				const { pixelReturn, errors } = await monolithStore.runQuery<
					VectorEngine[]
				>(
					`META | MyEngines(metaKeys=["tag", "description"], metaFilters=[{"tag":["MCP"]}], engineTypes=["VECTOR"], limit=[25], offset=[0]);`,
				);

				if (errors.length > 0) {
					console.error("Error fetching knowledge sources:", errors);
					return;
				}

				const engines = pixelReturn[0].output;
				const items: KnowledgeItem[] = engines.map((engine) => ({
					id: engine.engine_id,
					name: engine.engine_name,
					type: "VECTOR" as const,
					description: engine.description,
				}));

				setKnowledgeSources(items);
			} catch (error) {
				console.error("Error fetching knowledge sources:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchKnowledge();
	}, [monolithStore]);

	// Filter by search
	const filteredSources = knowledgeSources.filter((item) =>
		item.name.toLowerCase().includes(search.toLowerCase()),
	);

	const handleSelect = (item: KnowledgeItem) => {
		const updated = { ...selectedMap };

		if (Object.hasOwn(updated, item.id)) {
			delete updated[item.id];
		} else {
			updated[item.id] = item;
		}

		onChange(Object.values(updated));
	};

	const handleRemove = (id: string) => {
		onChange(value.filter((item) => item.id !== id));
	};

	return (
		<div
			className={cn(
				"flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
				className,
			)}
		>
			{/* Search Header */}
			<div className="flex w-full shrink-0 flex-row gap-2 border-border border-b bg-muted p-4">
				<div className="flex-1">
					<Input
						placeholder="Search knowledge sources..."
						value={search}
						disabled={disabled}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
				<Button
					variant="outline"
					onClick={() => {
						// TODO: Open create knowledge modal
						console.log("Create knowledge source");
					}}
					disabled={disabled}
				>
					<PlusIcon />
				</Button>
			</div>

			{/* Content Area */}
			<ScrollArea className="min-h-0 w-full flex-1">
				{isLoading && filteredSources.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!isLoading && filteredSources.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Muted>No knowledge sources found</Muted>
					</div>
				)}
				{filteredSources.length > 0 && (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredSources.map((item) => {
							const isSelected = !!selectedMap[item.id];
							return (
								<Card
									key={item.id}
									className={cn(
										"cursor-pointer p-0 transition-colors hover:bg-muted/30",
										isSelected && "border-primary",
									)}
									onClick={() => handleSelect(item)}
								>
									<CardContent className="flex flex-col gap-2 p-3">
										{/* Selection indicator */}
										<div className="flex items-center justify-end">
											<div
												className={cn(
													"flex size-4 items-center justify-center rounded border transition-colors",
													isSelected
														? "border-primary bg-primary text-primary-foreground"
														: "border-muted-foreground/40",
												)}
											>
												{isSelected ? (
													<CheckIcon
														className="size-3"
														strokeWidth={3}
													/>
												) : null}
											</div>
										</div>

										{/* Name */}
										<div className="wrap-break-word line-clamp-2 font-medium text-sm leading-tight">
											{item.name}
										</div>

										{/* Type */}
										<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
											<span>Vector Database</span>
										</div>

										{/* Description */}
										{item.description ? (
											<div className="wrap-break-words line-clamp-4 text-muted-foreground text-xs">
												{item.description}
											</div>
										) : (
											<div className="h-1" aria-hidden />
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</ScrollArea>

			{/* Selected Items Footer */}
			{value.length > 0 && (
				<div className="flex shrink-0 flex-wrap gap-2 border-border border-t bg-muted p-2">
					{value.map((item) => (
						<div
							key={item.id}
							className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-card-foreground text-xs"
							title={item.name}
						>
							<span className="max-w-40 truncate">
								{item.name}
							</span>
							<button
								type="button"
								aria-label={`Remove ${item.name}`}
								disabled={disabled}
								onClick={() => handleRemove(item.id)}
								className="-me-0.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
							>
								<XIcon className="size-4" />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
