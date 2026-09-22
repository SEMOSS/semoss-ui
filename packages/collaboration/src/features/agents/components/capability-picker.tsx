import { BookOpen, Search, Sparkles, Wrench } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { MCPConfig } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Checkbox,
	cn,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	P,
	Spinner,
	useDebouncedValue,
} from "@semoss/ui/next";
import { useAgentResources } from "../api/use-agent-resources";

interface CapabilityPickerProps {
	kind: "KNOWLEDGE" | "TOOLBOX" | "SKILL";
	values: MCPConfig[];
	onChange: (values: MCPConfig[]) => void;
	disabled?: boolean;
	/** Skills use the existing catalog query, with display names already resolved. */
	skills?: {
		options: { name: string; value: string; detail: string }[];
		isLoading: boolean;
		error: Error | null;
		refresh?: () => void;
	};
}

const pickerLabels = {
	KNOWLEDGE: {
		title: "Add knowledge",
		search: "Search knowledge",
		description: "Give your agent sources to reference in its work.",
		empty: "No knowledge sources are available.",
		icon: BookOpen,
	},
	TOOLBOX: {
		title: "Add toolboxes",
		search: "Search toolboxes",
		description: "Choose tools your agent can use to get things done.",
		empty: "No toolboxes are available.",
		icon: Wrench,
	},
	SKILL: {
		title: "Add skills",
		search: "Search skills",
		description:
			"Choose reusable instructions for the work your agent does.",
		empty: "No skills are available.",
		icon: Sparkles,
	},
} as const;

/** Searchable, keyboard-accessible resource rows; changes stay in the agent draft. */
export function CapabilityPicker({
	kind,
	values,
	onChange,
	disabled,
	skills,
}: CapabilityPickerProps) {
	const [search, setSearch] = useState("");
	const pickerId = useId();
	const searchInput = useRef<HTMLInputElement>(null);
	const debouncedSearch = useDebouncedValue(search.trim());
	const query = useAgentResources(
		kind === "SKILL" ? null : kind,
		debouncedSearch,
	);
	const labels = pickerLabels[kind];
	const Icon = labels.icon;
	const isLoading = kind === "SKILL" ? skills?.isLoading : query.isLoading;
	const error = kind === "SKILL" ? skills?.error : query.error;
	const options =
		kind === "SKILL"
			? (skills?.options ?? [])
					.filter((option) =>
						`${option.name} ${option.detail}`
							.toLowerCase()
							.includes(search.trim().toLowerCase()),
					)
					.map((option) => ({
						id: option.value,
						name: option.name,
						type: "PROJECT" as const,
						description: option.detail,
					}))
			: query.resources;
	const hasMore = kind !== "SKILL" && query.hasMore;
	const refresh = kind === "SKILL" ? skills?.refresh : query.refresh;

	return (
		<DialogContent className="gap-0 p-0 sm:max-w-xl">
			<DialogHeader className="px-6 pt-6 pb-4 text-left">
				<DialogTitle>{labels.title}</DialogTitle>
				<DialogDescription>{labels.description}</DialogDescription>
			</DialogHeader>
			<div className="px-6 pb-4">
				<InputGroup>
					<InputGroupAddon>
						<Search aria-hidden="true" />
					</InputGroupAddon>
					<InputGroupInput
						ref={searchInput}
						aria-label={labels.search}
						placeholder={labels.search}
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						disabled={disabled}
					/>
				</InputGroup>
			</div>
			<div
				className="min-h-40 overflow-y-auto border-y px-3 py-2 sm:max-h-80"
				aria-busy={isLoading}
			>
				{error && (
					<Alert variant="destructive" className="mb-2">
						<AlertDescription>
							Could not load the catalog. Please try again.
						</AlertDescription>
						{refresh && (
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={refresh}
								disabled={disabled || isLoading}
							>
								Try again
							</Button>
						)}
					</Alert>
				)}
				{!isLoading && !error && options.length === 0 && (
					<div className="space-y-2 px-3 py-8 text-center">
						<P className="text-muted-foreground text-sm">
							{search
								? `No matches for “${search}”.`
								: labels.empty}
						</P>
						{search && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setSearch("");
									searchInput.current?.focus();
								}}
							>
								Clear search
							</Button>
						)}
					</div>
				)}
				{options.map((option) => {
					const isSelected = values.some(
						(value) => value.id === option.id,
					);
					return (
						<label
							key={option.id}
							htmlFor={`${pickerId}-${option.id}`}
							className={cn(
								"flex min-h-16 cursor-pointer items-center gap-3 rounded-md px-3 py-3 hover:bg-muted/60 has-focus-visible:ring-2 has-focus-visible:ring-ring",
								isSelected && "bg-primary/5",
								disabled && "cursor-default opacity-50",
							)}
						>
							<Checkbox
								id={`${pickerId}-${option.id}`}
								checked={isSelected}
								disabled={disabled}
								aria-label={[
									option.name,
									kind === "SKILL" ? option.description : "",
								]
									.filter(Boolean)
									.join(" ")}
								onCheckedChange={(checked) =>
									onChange(
										checked
											? [...values, option]
											: values.filter(
													(value) =>
														value.id !== option.id,
												),
									)
								}
							/>
							<Icon
								className="size-4 shrink-0 text-muted-foreground"
								aria-hidden="true"
							/>
							<span className="min-w-0 flex-1">
								<span className="wrap-anywhere block font-medium text-sm">
									{option.name}
								</span>
								{option.description && (
									<span className="wrap-anywhere mt-1 block text-muted-foreground text-xs">
										{option.description}
									</span>
								)}
							</span>
						</label>
					);
				})}
				{isLoading && (
					<output className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-sm">
						<Spinner aria-hidden="true" /> Loading…
					</output>
				)}
				{hasMore && !isLoading && !error && (
					<Button
						type="button"
						variant="ghost"
						className="mt-2 w-full"
						onClick={query.next}
						disabled={disabled}
					>
						Load more
					</Button>
				)}
			</div>
			<DialogFooter className="flex-row items-center justify-between gap-3 px-6 py-4 sm:justify-between">
				<output className="text-muted-foreground text-sm">
					{values.length} selected
				</output>
				<DialogClose asChild>
					<Button type="button">Done</Button>
				</DialogClose>
			</DialogFooter>
		</DialogContent>
	);
}
