import { CheckIcon, ChevronDown, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";

interface ProjectRow {
	project_id: string;
	project_name: string;
	project_display_name?: string;
}

const AVATAR_PALETTES = [
	{
		bg: "bg-blue-100 dark:bg-blue-900/40",
		text: "text-blue-700 dark:text-blue-300",
	},
	{
		bg: "bg-violet-100 dark:bg-violet-900/40",
		text: "text-violet-700 dark:text-violet-300",
	},
	{
		bg: "bg-emerald-100 dark:bg-emerald-900/40",
		text: "text-emerald-700 dark:text-emerald-300",
	},
	{
		bg: "bg-amber-100 dark:bg-amber-900/40",
		text: "text-amber-700 dark:text-amber-300",
	},
	{
		bg: "bg-rose-100 dark:bg-rose-900/40",
		text: "text-rose-700 dark:text-rose-300",
	},
	{
		bg: "bg-cyan-100 dark:bg-cyan-900/40",
		text: "text-cyan-700 dark:text-cyan-300",
	},
	{
		bg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
		text: "text-fuchsia-700 dark:text-fuchsia-300",
	},
	{
		bg: "bg-orange-100 dark:bg-orange-900/40",
		text: "text-orange-700 dark:text-orange-300",
	},
];

function hashName(s: string): number {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
	return Math.abs(h);
}

function ProjectInitials({ name }: { name: string }) {
	const letters = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((w) => w[0].toUpperCase())
		.join("");
	const palette = AVATAR_PALETTES[hashName(name) % AVATAR_PALETTES.length];
	return (
		<div
			className={`me-2 flex size-6 shrink-0 items-center justify-center rounded-sm font-semibold text-[10px] ${palette.bg} ${palette.text}`}
		>
			{letters || "?"}
		</div>
	);
}

interface AutomationProjectSelectProps {
	/** Display name shown on the closed trigger (pass `config.appName`) */
	name: string;
	/** Currently selected project ID (`config.appId`) */
	value: string;
	/** Called when the user picks a project or clears the selection */
	onChange: (projectId: string, projectName: string) => void;
	/** Restrict the access-filtered project list to these SEMOSS project types. */
	projectTypes?: string[];
	placeholder?: string;
	searchPlaceholder?: string;
	emptyText?: string;
	clearable?: boolean;
	disabled?: boolean;
}

export function AutomationProjectSelect({
	name,
	value,
	onChange,
	projectTypes,
	placeholder = "None (default context)",
	searchPlaceholder = "Search apps…",
	emptyText = "Not found",
	clearable = true,
	disabled,
}: AutomationProjectSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const { data: resolvedProject } = usePixel<ProjectRow | null>(
		value && !name
			? `GetProjectMetadata(project=${JSON.stringify([value])}, metaKeys=${JSON.stringify(["project_display_name", "project_name"])});`
			: "",
		{ data: null },
	);
	const resolvedName = resolvedProject
		? resolvedProject.project_display_name || resolvedProject.project_name
		: "";

	const getProjects = useIteratorPixel<ProjectRow[], ProjectRow>(
		(limit, offset) =>
			open
				? `MyProjects(${
						debouncedSearch
							? `filterWord=${JSON.stringify(debouncedSearch)}, `
							: ""
					}${
						projectTypes
							? `projectType=${JSON.stringify(projectTypes)}, `
							: ""
					}limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length === 0 ? -1 : Infinity),
		(response) => response,
		{ limit: 15 },
		[open, debouncedSearch, JSON.stringify(projectTypes)],
	);

	const nextRef = useRef(getProjects.next);
	useEffect(() => {
		nextRef.current = getProjects.next;
	}, [getProjects.next]);
	const handleNext = useCallback(() => {
		nextRef.current();
	}, []);

	const { setScroll } = useInfiniteScroll({
		disabled: getProjects.isLoading || !getProjects.hasMore || !open,
		onNext: handleNext,
	});
	const listRef = useCallback(
		(node: HTMLDivElement | null) => {
			setScroll(node);
		},
		[setScroll],
	);

	const handleClear = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange("", "");
	};

	return (
		<Popover open={open && !disabled} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span className="flex-1 truncate text-left">
						{value ? (
							name || resolvedName || value
						) : (
							<span className="text-muted-foreground">
								{placeholder}
							</span>
						)}
					</span>
					{value && clearable ? (
						<button
							type="button"
							onClick={handleClear}
							className="ml-1 shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
							aria-label="Clear selection"
						>
							<X className="size-3" />
						</button>
					) : (
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder={searchPlaceholder}
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList ref={listRef}>
						<CommandEmpty>
							{getProjects.isLoading &&
							getProjects.data.length === 0 ? (
								<div className="flex items-center justify-center py-4">
									<Spinner />
								</div>
							) : (
								emptyText
							)}
						</CommandEmpty>
						<CommandGroup>
							{getProjects.data.map((project) => {
								const displayName =
									project.project_display_name ||
									project.project_name;
								return (
									<CommandItem
										key={project.project_id}
										value={project.project_id}
										onSelect={() => {
											onChange(
												project.project_id,
												displayName,
											);
											setOpen(false);
										}}
										className={
											value === project.project_id
												? "bg-primary/10 data-[selected=true]:bg-primary/15"
												: undefined
										}
									>
										<ProjectInitials name={displayName} />
										<div className="flex flex-1 flex-col truncate">
											<span className="truncate">
												{displayName}
											</span>
										</div>
										{value === project.project_id && (
											<CheckIcon
												strokeWidth={3}
												className="ms-2 size-4 shrink-0 text-primary"
											/>
										)}
									</CommandItem>
								);
							})}
							{getProjects.isLoading &&
								getProjects.data.length > 0 && (
									<div className="flex items-center justify-center py-2">
										<Spinner className="size-4" />
									</div>
								)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
