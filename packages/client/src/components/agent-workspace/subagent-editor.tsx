import {
	ChevronsUpDownIcon,
	CircleAlertIcon,
	PlusIcon,
	SquareArrowOutUpRightIcon,
	TrashIcon,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { App } from "@semoss/shared";
import {
	Button,
	Command,
	CommandEmpty,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Field,
	FieldLabel,
	Input,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	Textarea,
	useDebouncedValue,
} from "@semoss/ui/next";

export interface SubAgentEntry {
	alias: string;
	workspaceId: string;
	description?: string;
	workspaceName?: string;
	_key?: string;
}

export const nextSubAgentKey = () =>
	typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
		? crypto.randomUUID()
		: `sa_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

interface SubAgentEditorProps {
	values: SubAgentEntry[];
	disabled?: boolean;
	onChange: (values: SubAgentEntry[]) => void;
	currentWorkspaceId?: string;
	className?: string;
}

const ALIAS_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

const isValidAlias = (value: string) =>
	value.length === 0 || ALIAS_PATTERN.test(value);

const hasDuplicateAlias = (values: SubAgentEntry[], index: number) => {
	const alias = values[index]?.alias?.trim();
	if (!alias) return false;
	return values.some(
		(entry, i) => i !== index && entry.alias.trim() === alias,
	);
};

const appName = (app: App) => app.project_display_name || app.project_name;

export const SubAgentEditor: React.FC<SubAgentEditorProps> = ({
	values,
	disabled,
	onChange,
	currentWorkspaceId,
	className,
}) => {
	const updateEntry = (index: number, patch: Partial<SubAgentEntry>) => {
		const next = values.map((entry, i) =>
			i === index ? { ...entry, ...patch } : entry,
		);
		onChange(next);
	};

	const removeEntry = (index: number) => {
		onChange(values.filter((_, i) => i !== index));
	};

	const addEntry = () => {
		onChange([
			...values,
			{
				alias: "",
				workspaceId: "",
				description: "",
				_key: nextSubAgentKey(),
			},
		]);
	};

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm",
				className,
			)}
		>
			{values.length === 0 ? (
				<Muted className="text-muted-foreground text-sm">
					No subagents configured. Add one to expose it as a tool your
					agent can call to delegate work to another workspace.
				</Muted>
			) : (
				<div className="flex flex-col gap-4">
					{values.map((entry, index) => (
						<SubAgentRow
							key={entry._key}
							entry={entry}
							disabled={disabled}
							currentWorkspaceId={currentWorkspaceId}
							aliasInvalid={!isValidAlias(entry.alias)}
							aliasDuplicate={hasDuplicateAlias(values, index)}
							onChange={(patch) => updateEntry(index, patch)}
							onRemove={() => removeEntry(index)}
						/>
					))}
				</div>
			)}

			<div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled}
					onClick={addEntry}
				>
					<PlusIcon className="size-4" />
					Add subagent
				</Button>
			</div>
		</div>
	);
};

interface SubAgentRowProps {
	entry: SubAgentEntry;
	disabled?: boolean;
	currentWorkspaceId?: string;
	aliasInvalid: boolean;
	aliasDuplicate: boolean;
	onChange: (patch: Partial<SubAgentEntry>) => void;
	onRemove: () => void;
}

const SubAgentRow: React.FC<SubAgentRowProps> = ({
	entry,
	disabled,
	currentWorkspaceId,
	aliasInvalid,
	aliasDuplicate,
	onChange,
	onRemove,
}) => {
	const aliasId = useId();
	const workspacePickerId = useId();
	const descriptionId = useId();
	const showAliasError = aliasInvalid || aliasDuplicate;
	const aliasHelp = aliasInvalid
		? "Must start with a letter and contain only letters, numbers, or underscores."
		: aliasDuplicate
			? "Duplicate alias — each subagent must have a unique name."
			: null;

	const handlePickWorkspace = (app: App) => {
		const nextPatch: Partial<SubAgentEntry> = {
			workspaceId: app.project_id,
			workspaceName: appName(app),
		};
		if (!entry.description?.trim() && app.description?.trim()) {
			nextPatch.description = app.description.trim();
		}
		onChange(nextPatch);
	};

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3">
			<div className="flex items-start gap-3">
				<div className="grid flex-1 gap-3 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor={aliasId}>Alias</FieldLabel>
						<Input
							id={aliasId}
							value={entry.alias}
							disabled={disabled}
							placeholder="researcher"
							onChange={(e) =>
								onChange({ alias: e.target.value })
							}
							aria-invalid={showAliasError || undefined}
						/>
						{aliasHelp ? (
							<Muted className="text-destructive text-xs">
								{aliasHelp}
							</Muted>
						) : null}
					</Field>
					<Field>
						<FieldLabel htmlFor={workspacePickerId}>
							Target agent
						</FieldLabel>
						<SubAgentWorkspacePicker
							id={workspacePickerId}
							disabled={disabled}
							selectedId={entry.workspaceId}
							selectedName={entry.workspaceName}
							excludeIds={
								currentWorkspaceId ? [currentWorkspaceId] : []
							}
							onSelect={handlePickWorkspace}
						/>
					</Field>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					disabled={disabled}
					onClick={onRemove}
					aria-label="Remove subagent"
				>
					<TrashIcon className="size-4" />
				</Button>
			</div>
			<Field>
				<FieldLabel htmlFor={descriptionId}>
					Description (optional)
				</FieldLabel>
				<Textarea
					id={descriptionId}
					value={entry.description ?? ""}
					disabled={disabled}
					rows={2}
					placeholder="What this subagent is for. Shown to the LLM as the tool description."
					onChange={(e) => onChange({ description: e.target.value })}
				/>
			</Field>
		</div>
	);
};

interface SubAgentWorkspacePickerProps {
	id?: string;
	disabled?: boolean;
	selectedId: string;
	selectedName?: string;
	excludeIds: string[];
	onSelect: (app: App) => void;
}

const LIMIT = 25;

const SubAgentWorkspacePicker: React.FC<SubAgentWorkspacePickerProps> = ({
	id,
	disabled,
	selectedId,
	selectedName,
	excludeIds,
	onSelect,
}) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search, 300);
	const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);

	const getWorkspaces = useIteratorPixel<App[], App>(
		(limit, offset) =>
			`META | MyProjects(${
				debouncedSearch
					? `filterWord=${JSON.stringify(debouncedSearch)}, `
					: ""
			}type = "WORKSPACE", limit=[${limit}], offset=[${offset}])`,
		(response) => (response.length < LIMIT ? -1 : Infinity),
		(response) => response,
		{ limit: LIMIT },
		[debouncedSearch],
	);

	const visible = useMemo(
		() => getWorkspaces.data.filter((w) => !excludeSet.has(w.project_id)),
		[getWorkspaces.data, excludeSet],
	);

	const triggerLabel = selectedName
		? selectedName
		: selectedId
			? `Unknown workspace · ${selectedId.slice(0, 8)}…`
			: "Select target agent…";

	return (
		<div className="flex items-center gap-1">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						id={id}
						type="button"
						variant="outline"
						role="combobox"
						disabled={disabled}
						className={cn(
							"h-9 min-w-0 flex-1 justify-between px-3 font-normal",
							!selectedId && "text-muted-foreground",
						)}
					>
						<span className="flex min-w-0 items-center gap-1.5">
							{selectedId && !selectedName ? (
								<CircleAlertIcon className="size-3.5 shrink-0 text-amber-500" />
							) : null}
							<span className="truncate">{triggerLabel}</span>
						</span>
						<ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					align="start"
					className="w-[--radix-popover-trigger-width] min-w-[280px] p-0"
				>
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="Search agents…"
							value={search}
							onValueChange={setSearch}
						/>
						<CommandList>
							{getWorkspaces.isLoading && visible.length === 0 ? (
								<div className="flex h-24 items-center justify-center">
									<Spinner className="size-4" />
								</div>
							) : null}
							{!getWorkspaces.isLoading &&
							visible.length === 0 ? (
								<CommandEmpty>No agents found.</CommandEmpty>
							) : null}
							{visible.map((app) => {
								const isSelected =
									app.project_id === selectedId;
								const label = appName(app);
								return (
									<CommandItem
										key={app.project_id}
										value={app.project_id}
										onSelect={() => {
											onSelect(app);
											setOpen(false);
										}}
										className={cn(
											"flex items-start gap-2 py-2",
											isSelected && "bg-accent/40",
										)}
									>
										<div className="flex min-w-0 flex-1 flex-col">
											<span className="truncate font-medium text-sm">
												{label}
											</span>
											<span className="truncate font-mono text-[10px] text-muted-foreground">
												{app.project_id}
											</span>
											{app.description ? (
												<span className="line-clamp-2 text-[11px] text-muted-foreground">
													{app.description}
												</span>
											) : null}
										</div>
									</CommandItem>
								);
							})}
							{!getWorkspaces.isLoading &&
							getWorkspaces.hasMore ? (
								<div className="flex justify-center p-2">
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => getWorkspaces.next()}
									>
										Load more
									</Button>
								</div>
							) : null}
							{getWorkspaces.isLoading && visible.length > 0 ? (
								<div className="flex justify-center p-2">
									<Spinner className="size-4" />
								</div>
							) : null}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{selectedId ? (
				<a
					href={`#/agent/${selectedId}`}
					target="_blank"
					rel="noreferrer"
					onClick={(e) => e.stopPropagation()}
					className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
					aria-label="Open target agent in new tab"
					title="Open target agent"
				>
					<SquareArrowOutUpRightIcon className="size-4" />
				</a>
			) : null}
		</div>
	);
};
