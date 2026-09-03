import { CheckIcon, ChevronDown } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import type { Project } from "../../types";

interface ProjectSelectProps {
	/** CSS classes for styling customization. */
	className?: string;
	/** Whether the select is disabled. */
	disabled?: boolean;
	/** Display name of the selected project. */
	name: string;
	/** ID of the selected project. */
	value: string;
	/** Callback invoked when selection changes. */
	onChange: (value: Project) => void;
	/** Filter projects by type (e.g., WORKSPACE, CODE, NOTEBOOK). */
	projectTypes?: Project["project_type"][];
	/** Additional metadata filters for the project query. */
	metaFilters?: unknown[];
	/** Props forwarded to the PopoverContent component. */
	popoverContentProps?: React.ComponentProps<typeof PopoverContent>;
	/** Show the project ID under the project name instead of the description. */
	showProjectId?: boolean;
}

/**
 * Searchable, paginated project picker backed by MyProjects.
 *
 * @name ProjectSelect
 * @return A project selector with filtering and infinite scrolling.
 */
export const ProjectSelect = ({
	className,
	disabled,
	name,
	value,
	onChange,
	projectTypes,
	metaFilters,
	popoverContentProps = {},
	showProjectId,
}: ProjectSelectProps) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);

	const getProjects = useIteratorPixel<Project[], Project>(
		(limit, offset) =>
			open
				? `META | MyProjects(${
						debouncedSearch
							? `filterWord=${JSON.stringify(debouncedSearch)}, `
							: ""
					}${
						projectTypes
							? `projectType=${JSON.stringify(projectTypes)}, `
							: ""
					}${
						metaFilters
							? `metaFilters=${JSON.stringify(metaFilters)}, `
							: ""
					}limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length === 0 ? -1 : Infinity),
		(response) => response,
		{ limit: 15 },
		[
			open,
			debouncedSearch,
			JSON.stringify(projectTypes),
			JSON.stringify(metaFilters),
		],
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

	return (
		<Popover open={open && !disabled} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className={cn(
						"w-full min-w-0 justify-start overflow-hidden border-input bg-transparent px-3 py-2",
						className,
					)}
				>
					<div className="flex w-full min-w-0 items-center gap-2 overflow-hidden">
						<span className="min-w-0 truncate">
							{name || "Select"}
						</span>
						<ChevronDown className="inline-block! ms-auto size-4 shrink-0 opacity-70" />
					</div>
				</Button>
			</PopoverTrigger>
			<PopoverContent
				{...popoverContentProps}
				className={cn(
					"w-[var(--radix-popover-trigger-width)] min-w-64 max-w-[var(--radix-popover-trigger-width)] p-0",
					popoverContentProps.className,
				)}
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search"
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
								"Not Found"
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
											onChange(project);
											setOpen(false);
										}}
										className={cn(
											value === project.project_id &&
												"bg-primary/10 data-[selected=true]:bg-primary/15",
										)}
									>
										<div className="flex flex-1 flex-col truncate">
											<span className="truncate">
												{displayName}
											</span>
											{showProjectId ? (
												<span className="truncate text-muted-foreground text-xs">
													id: {project.project_id}
												</span>
											) : project.description ? (
												<span className="truncate text-muted-foreground text-xs">
													{project.description}
												</span>
											) : null}
										</div>
										{value === project.project_id ? (
											<CheckIcon
												className="ms-2 size-4 shrink-0 text-primary"
												strokeWidth={3}
											/>
										) : null}
									</CommandItem>
								);
							})}
							{getProjects.isLoading &&
							getProjects.data.length > 0 ? (
								<div className="flex items-center justify-center py-2">
									<Spinner className="size-4" />
								</div>
							) : null}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
};
