import { CheckIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	cn,
	Input,
	Muted,
	ScrollArea,
	Spinner,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface PromptItem {
	id: string;
	name: string;
	description?: string;
}

interface PromptSelectorProps {
	/** Selected prompt IDs */
	value: string[];

	/** Track if disabled */
	disabled?: boolean;

	/** Callback when selection changes */
	onChange: (values: string[]) => void;

	/** Extra classes */
	className?: string;
}

interface Prompt {
	prompt_id: string;
	prompt_name: string;
	description?: string;
}

/**
 * Prompt selector for agents - simplified version adapted from playground
 */
export const PromptSelector = ({
	value,
	disabled,
	onChange,
	className,
}: PromptSelectorProps) => {
	const { monolithStore } = useRootStore();
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [prompts, setPrompts] = useState<PromptItem[]>([]);

	// Track selected items by ID
	const selectedSet = new Set(value);

	// Fetch prompts
	useEffect(() => {
		const fetchPrompts = async () => {
			setIsLoading(true);
			try {
				const { pixelReturn, errors } = await monolithStore.runQuery<
					Prompt[]
				>(`META | ListPrompt(limit=[25], offset=[0]);`);

				if (errors.length > 0) {
					console.error("Error fetching prompts:", errors);
					return;
				}

				const promptData = pixelReturn[0].output;
				const items: PromptItem[] = promptData.map((prompt) => ({
					id: prompt.prompt_id,
					name: prompt.prompt_name,
					description: prompt.description,
				}));

				setPrompts(items);
			} catch (error) {
				console.error("Error fetching prompts:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPrompts();
	}, [monolithStore]);

	// Filter by search
	const filteredPrompts = prompts.filter((item) =>
		item.name.toLowerCase().includes(search.toLowerCase()),
	);

	const handleSelect = (item: PromptItem) => {
		const updated = new Set(value);

		if (updated.has(item.id)) {
			updated.delete(item.id);
		} else {
			updated.add(item.id);
		}

		onChange(Array.from(updated));
	};

	const handleRemove = (id: string) => {
		onChange(value.filter((promptId) => promptId !== id));
	};

	const getPromptName = (id: string) => {
		const prompt = prompts.find((p) => p.id === id);
		return prompt?.name || id;
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
						placeholder="Search prompts..."
						value={search}
						disabled={disabled}
						onChange={(e) => setSearch(e.target.value)}
					/>
				</div>
			</div>

			{/* Content Area */}
			<ScrollArea className="min-h-0 w-full flex-1">
				{isLoading && filteredPrompts.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Spinner />
					</div>
				)}
				{!isLoading && filteredPrompts.length === 0 && (
					<div className="flex h-64 w-full items-center justify-center">
						<Muted>No prompts found</Muted>
					</div>
				)}
				{filteredPrompts.length > 0 && (
					<div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredPrompts.map((item) => {
							const isSelected = selectedSet.has(item.id);
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
											<span>Prompt</span>
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
					{value.map((id) => (
						<div
							key={id}
							className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2 text-card-foreground text-xs"
							title={getPromptName(id)}
						>
							<span className="max-w-40 truncate">
								{getPromptName(id)}
							</span>
							<button
								type="button"
								aria-label={`Remove ${getPromptName(id)}`}
								disabled={disabled}
								onClick={() => handleRemove(id)}
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
