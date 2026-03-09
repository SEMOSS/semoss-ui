import {
	AlignLeftIcon,
	CalendarIcon,
	CheckSquareIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	CircleDotIcon,
	DatabaseIcon,
	EyeIcon,
	EyeOffIcon,
	HashIcon,
	LoaderIcon,
	LockIcon,
	MailIcon,
	PencilIcon,
	PlusIcon,
	SearchIcon,
	ToggleRightIcon,
	TypeIcon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import {
	DB_TYPE_TO_WIDGET,
	WIDGET_TYPE_OPTIONS,
} from "../form-builder.constants";
import type {
	CrudOperation,
	FieldConfig,
	FieldWidgetType,
	FormBuilderState,
} from "../form-builder.types";

interface FormBuilderFieldsStepProps {
	state: FormBuilderState;
	onUpdate: (updates: Partial<FormBuilderState>) => void;
}

/** Map widget type → lucide icon */
const WIDGET_ICONS: Record<FieldWidgetType, ReactNode> = {
	text: <TypeIcon className="size-4" />,
	number: <HashIcon className="size-4" />,
	email: <MailIcon className="size-4" />,
	password: <LockIcon className="size-4" />,
	textarea: <AlignLeftIcon className="size-4" />,
	date: <CalendarIcon className="size-4" />,
	select: <ChevronDownIcon className="size-4" />,
	checkbox: <CheckSquareIcon className="size-4" />,
	radio: <CircleDotIcon className="size-4" />,
	toggle: <ToggleRightIcon className="size-4" />,
};

/** Whether a widget type supports placeholder text */
function supportsPlaceholder(wt: FieldWidgetType): boolean {
	return !["checkbox", "toggle", "radio"].includes(wt);
}

/** Whether a widget type needs an options list */
function needsOptionsList(wt: FieldWidgetType): boolean {
	return wt === "select" || wt === "radio";
}

/** Whether a widget type is a boolean toggle / checkbox */
function isBooleanWidget(wt: FieldWidgetType): boolean {
	return wt === "checkbox" || wt === "toggle";
}

// ---------------------------------------------------------------------------
// Inline options editor (select / radio)
// ---------------------------------------------------------------------------

function OptionsEditor({
	options,
	onChange,
	onFetchFromDb,
	isFetching,
}: {
	options: string[];
	onChange: (opts: string[]) => void;
	onFetchFromDb?: () => void;
	isFetching?: boolean;
}) {
	const [draft, setDraft] = useState("");

	const addOption = () => {
		const trimmed = draft.trim();
		if (!trimmed || options.includes(trimmed)) return;
		onChange([...options, trimmed]);
		setDraft("");
	};

	return (
		<div className="flex flex-col gap-1.5 rounded-md border border-border border-dashed bg-muted/30 p-2">
			<div className="flex items-center justify-between">
				<span className="font-medium text-muted-foreground text-xs">
					Options
				</span>
				{onFetchFromDb && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 gap-1 px-2 text-xs"
						disabled={isFetching}
						onClick={onFetchFromDb}
					>
						{isFetching ? (
							<LoaderIcon className="size-3 animate-spin" />
						) : (
							<DatabaseIcon className="size-3" />
						)}
						{isFetching ? "Fetching…" : "Fetch from DB"}
					</Button>
				)}
			</div>
			<div className="flex flex-wrap gap-1">
				{options.map((opt, i) => (
					<Badge key={opt} variant="secondary" className="gap-1 pr-1">
						{opt}
						<button
							type="button"
							className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
							onClick={() =>
								onChange(options.filter((_, j) => j !== i))
							}
						>
							<XIcon className="size-3" />
						</button>
					</Badge>
				))}
				{options.length === 0 && (
					<span className="text-muted-foreground text-xs italic">
						No options yet — add at least one.
					</span>
				)}
			</div>
			<div className="flex gap-1">
				<Input
					placeholder="Add option…"
					value={draft}
					className="h-7 text-xs"
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							addOption();
						}
					}}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					className="h-7 px-2"
					onClick={addOption}
				>
					<PlusIcon className="size-3.5" />
				</Button>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const FormBuilderFieldsStep = ({
	state,
	onUpdate,
}: FormBuilderFieldsStepProps) => {
	const { monolithStore } = useRootStore();
	const [activeTable, setActiveTable] = useState(
		state.tables[0]?.table || "",
	);
	const [activeOp, setActiveOp] = useState<CrudOperation>("create");
	const [fetchingColumn, setFetchingColumn] = useState<string | null>(null);
	/** Which field card is expanded (null = all collapsed) */
	const [expandedField, setExpandedField] = useState<string | null>(null);

	const currentTable = state.tables.find((t) => t.table === activeTable);
	const availableOps = currentTable?.operations || [];

	const effectiveOp = availableOps.includes(activeOp)
		? activeOp
		: availableOps[0] || "create";

	const fields = currentTable?.fields[effectiveOp] || [];

	// ---- helpers ----

	const updateField = useCallback(
		(fieldIdx: number, updates: Partial<FieldConfig>) => {
			const newTables = state.tables.map((table) => {
				if (table.table !== activeTable) return table;
				const newFields = { ...table.fields };
				newFields[effectiveOp] = newFields[effectiveOp].map((f, i) =>
					i === fieldIdx ? { ...f, ...updates } : f,
				);
				return { ...table, fields: newFields };
			});
			onUpdate({ tables: newTables });
		},
		[state.tables, activeTable, effectiveOp, onUpdate],
	);

	const fetchColumnValues = useCallback(
		async (columnName: string, fieldIdx: number) => {
			if (!state.databaseId || !activeTable) return;
			setFetchingColumn(columnName);
			try {
				const sql = `SELECT DISTINCT ${columnName} FROM ${activeTable} ORDER BY ${columnName} LIMIT 200`;
				const pixel = `SqlQuery(database=["${state.databaseId}"], query=["<encode>${sql}</encode>"]);`;
				const response = await monolithStore.runQuery(pixel);
				const output = response.pixelReturn?.[0]?.output as
					| Record<string, unknown>
					| undefined;

				let values: string[] = [];

				const data = output?.data as
					| { headers?: string[]; values?: unknown[][] }
					| undefined;
				if (data?.headers && data?.values) {
					values = data.values
						.map((row) => (row[0] != null ? String(row[0]) : ""))
						.filter((v) => v !== "");
				} else if (
					output &&
					"headers" in output &&
					"values" in output
				) {
					const rows = output.values as unknown[][];
					values = rows
						.map((row) => (row[0] != null ? String(row[0]) : ""))
						.filter((v) => v !== "");
				}

				if (values.length > 0) {
					updateField(fieldIdx, { options: values });
				}
			} catch (err) {
				console.error("Failed to fetch column values:", err);
			} finally {
				setFetchingColumn(null);
			}
		},
		[state.databaseId, activeTable, monolithStore, updateField],
	);

	const moveField = (fieldIdx: number, direction: "up" | "down") => {
		const swapIdx = direction === "up" ? fieldIdx - 1 : fieldIdx + 1;
		if (swapIdx < 0 || swapIdx >= fields.length) return;

		const newTables = state.tables.map((table) => {
			if (table.table !== activeTable) return table;
			const newFields = { ...table.fields };
			const arr = [...newFields[effectiveOp]];
			const tempOrder = arr[fieldIdx].order;
			arr[fieldIdx] = { ...arr[fieldIdx], order: arr[swapIdx].order };
			arr[swapIdx] = { ...arr[swapIdx], order: tempOrder };
			arr.sort((a, b) => a.order - b.order);
			newFields[effectiveOp] = arr;
			return { ...table, fields: newFields };
		});
		onUpdate({ tables: newTables });
	};

	// ---- render ----

	return (
		<Card>
			<CardHeader>
				<CardTitle>Configure Form Fields</CardTitle>
				<CardDescription>
					Click any field to expand its settings. Changes are
					per-table and per-operation.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{/* Table selector (multi-table only) */}
				{state.tables.length > 1 && (
					<div className="flex flex-col gap-2">
						<Label>Table</Label>
						<Select
							value={activeTable}
							onValueChange={(v) => setActiveTable(v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{state.tables.map((t) => (
									<SelectItem key={t.table} value={t.table}>
										{t.table}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Lookup field selector (update only) */}
				{currentTable?.operations.includes("update") && (
					<div className="flex flex-col gap-2 rounded-lg border border-border border-dashed bg-muted/30 p-3">
						<div className="flex items-center gap-2">
							<SearchIcon className="size-4 text-muted-foreground" />
							<Label className="font-medium text-sm">
								Record Lookup Field
							</Label>
						</div>
						<p className="text-muted-foreground text-xs">
							Users will search for records by this column when
							updating. Pick a column with unique, recognizable
							values (e.g. Name, Email, ID).
						</p>
						<Select
							value={
								currentTable.lookupField ||
								currentTable.columns[0]?.column ||
								""
							}
							onValueChange={(v) => {
								const newTables = state.tables.map((t) =>
									t.table === activeTable
										? { ...t, lookupField: v }
										: t,
								);
								onUpdate({ tables: newTables });
							}}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{currentTable.columns.map((col) => (
									<SelectItem
										key={col.column}
										value={col.column}
									>
										{col.column}
										<span className="ml-2 text-muted-foreground text-xs">
											({col.type})
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Operation tabs */}
				{availableOps.length > 0 && (
					<Tabs
						value={effectiveOp}
						onValueChange={(v) => {
							setActiveOp(v as CrudOperation);
							setExpandedField(null);
						}}
					>
						<TabsList>
							{availableOps.map((op) => (
								<TabsTrigger
									key={op}
									value={op}
									className="capitalize"
								>
									{op}
								</TabsTrigger>
							))}
						</TabsList>

						{availableOps.map((op) => (
							<TabsContent key={op} value={op}>
								<div className="flex flex-col gap-1 pt-2">
									{fields
										.sort((a, b) => a.order - b.order)
										.map((field, idx) => {
											const recommendedWidget =
												DB_TYPE_TO_WIDGET[
													(
														field.dbType || ""
													).toUpperCase()
												] || "text";
											const isRecommended =
												field.widgetType ===
												recommendedWidget;
											const isOpen =
												expandedField ===
												field.columnName;

											return (
												<FieldCard
													key={field.columnName}
													field={field}
													idx={idx}
													total={fields.length}
													isOpen={isOpen}
													isRecommended={
														isRecommended
													}
													fetchingColumn={
														fetchingColumn
													}
													onToggle={() =>
														setExpandedField(
															isOpen
																? null
																: field.columnName,
														)
													}
													onUpdate={(u) =>
														updateField(idx, u)
													}
													onMove={(d) =>
														moveField(idx, d)
													}
													onFetchOptions={() =>
														fetchColumnValues(
															field.columnName,
															idx,
														)
													}
												/>
											);
										})}
									{fields.length === 0 && (
										<p className="py-6 text-center text-muted-foreground text-sm">
											No fields configured for this
											operation.
										</p>
									)}
								</div>
							</TabsContent>
						))}
					</Tabs>
				)}
			</CardContent>
		</Card>
	);
};

// ---------------------------------------------------------------------------
// Individual field card (collapsible)
// ---------------------------------------------------------------------------

function FieldCard({
	field,
	idx,
	total,
	isOpen,
	isRecommended,
	fetchingColumn,
	onToggle,
	onUpdate,
	onMove,
	onFetchOptions,
}: {
	field: FieldConfig;
	idx: number;
	total: number;
	isOpen: boolean;
	isRecommended: boolean;
	fetchingColumn: string | null;
	onToggle: () => void;
	onUpdate: (updates: Partial<FieldConfig>) => void;
	onMove: (dir: "up" | "down") => void;
	onFetchOptions: () => void;
}) {
	return (
		<Collapsible open={isOpen} onOpenChange={() => onToggle()}>
			{/* ---- Header row (always visible) ---- */}
			<div
				className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
					isOpen
						? "rounded-b-none border-primary/30 border-b-0 bg-muted/40"
						: field.visible
							? "border-border hover:bg-muted/30"
							: "border-border/40 bg-muted/20 opacity-60 hover:opacity-80"
				}`}
			>
				{/* Reorder arrows */}
				<div className="flex flex-col">
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground disabled:opacity-25"
						onClick={(e) => {
							e.stopPropagation();
							onMove("up");
						}}
						disabled={idx === 0}
					>
						<ChevronUpIcon className="size-3" />
					</button>
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground disabled:opacity-25"
						onClick={(e) => {
							e.stopPropagation();
							onMove("down");
						}}
						disabled={idx === total - 1}
					>
						<ChevronDownIcon className="size-3" />
					</button>
				</div>

				{/* Click-to-expand area */}
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="flex min-w-0 flex-1 items-center gap-2 text-left"
					>
						<span className="text-muted-foreground">
							{WIDGET_ICONS[field.widgetType]}
						</span>
						<span className="truncate font-medium text-sm">
							{field.label}
						</span>
						<span className="hidden rounded bg-muted px-1 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
							{field.columnName}
						</span>
						{isRecommended && (
							<Badge
								variant="outline"
								className="hidden text-[10px] sm:inline-flex"
							>
								Auto
							</Badge>
						)}
						{!field.visible && (
							<Badge variant="secondary" className="text-[10px]">
								Hidden
							</Badge>
						)}
						{field.required && (
							<span className="text-destructive text-xs">*</span>
						)}
					</button>
				</CollapsibleTrigger>

				{/* Quick toggles */}
				{/* biome-ignore lint/a11y/noLabelWithoutControl: Checkbox is semantically associated */}
				<label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs">
					<Checkbox
						checked={field.required}
						onCheckedChange={(c) => onUpdate({ required: !!c })}
					/>
					<span className="hidden sm:inline">Required</span>
				</label>
				<button
					type="button"
					className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
					onClick={() => onUpdate({ visible: !field.visible })}
				>
					{field.visible ? (
						<EyeIcon className="size-3.5" />
					) : (
						<EyeOffIcon className="size-3.5" />
					)}
				</button>

				{/* Expand chevron */}
				<CollapsibleTrigger asChild>
					<button
						type="button"
						className="text-muted-foreground hover:text-foreground"
						title={isOpen ? "Collapse" : "Edit field settings"}
					>
						{isOpen ? (
							<ChevronUpIcon className="size-4" />
						) : (
							<PencilIcon className="size-3.5" />
						)}
					</button>
				</CollapsibleTrigger>
			</div>

			{/* ---- Expanded settings ---- */}
			<CollapsibleContent>
				<div className="flex flex-col gap-3 rounded-b-lg border border-primary/30 border-t-0 bg-muted/20 p-4">
					{/* -- Display row -- */}
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1">
							<Label className="text-xs">Label</Label>
							<Input
								placeholder="Display label"
								value={field.label}
								onChange={(e) =>
									onUpdate({ label: e.target.value })
								}
							/>
						</div>
						<div className="flex flex-col gap-1">
							<Label className="text-xs">Help Text</Label>
							<Input
								placeholder="Guidance shown below the field"
								value={field.helpText || ""}
								onChange={(e) =>
									onUpdate({ helpText: e.target.value })
								}
							/>
						</div>
					</div>

					<Separator />

					{/* -- Widget row + contextual settings -- */}
					<div className="flex flex-col gap-2">
						<Label className="text-xs">Widget Type</Label>
						<Select
							value={field.widgetType}
							onValueChange={(v) =>
								onUpdate({
									widgetType: v as FieldWidgetType,
									...(needsOptionsList(
										v as FieldWidgetType,
									) &&
									(!field.options ||
										field.options.length === 0)
										? {
												options: [
													"Option 1",
													"Option 2",
												],
											}
										: {}),
								})
							}
						>
							<SelectTrigger className="max-w-xs">
								<div className="flex items-center gap-2">
									{WIDGET_ICONS[field.widgetType]}
									<SelectValue />
								</div>
							</SelectTrigger>
							<SelectContent>
								{WIDGET_TYPE_OPTIONS.map((wt) => (
									<SelectItem key={wt.value} value={wt.value}>
										<div className="flex items-center gap-2">
											{WIDGET_ICONS[wt.value]}
											<div className="flex flex-col">
												<span>{wt.label}</span>
												<span className="text-muted-foreground text-xs">
													{wt.description}
												</span>
											</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* --- Context: text-like defaults --- */}
						{supportsPlaceholder(field.widgetType) && (
							<div className="grid grid-cols-2 gap-3">
								<div className="flex flex-col gap-1">
									<Label className="text-xs">
										Placeholder
									</Label>
									<Input
										placeholder="Placeholder text"
										value={field.placeholder}
										onChange={(e) =>
											onUpdate({
												placeholder: e.target.value,
											})
										}
									/>
								</div>
								{!needsOptionsList(field.widgetType) && (
									<div className="flex flex-col gap-1">
										<Label className="text-xs">
											Default Value
										</Label>
										<Input
											placeholder="Pre-filled value (optional)"
											value={field.defaultValue || ""}
											onChange={(e) =>
												onUpdate({
													defaultValue:
														e.target.value,
												})
											}
										/>
									</div>
								)}
							</div>
						)}

						{/* --- Context: options list (select / radio) --- */}
						{needsOptionsList(field.widgetType) && (
							<>
								<OptionsEditor
									options={field.options || []}
									onChange={(opts) =>
										onUpdate({ options: opts })
									}
									onFetchFromDb={onFetchOptions}
									isFetching={
										fetchingColumn === field.columnName
									}
								/>
								<div className="flex flex-col gap-1">
									<Label className="text-xs">
										Default Selection
									</Label>
									<Select
										value={field.defaultValue || "__none__"}
										onValueChange={(v) =>
											onUpdate({
												defaultValue:
													v === "__none__" ? "" : v,
											})
										}
									>
										<SelectTrigger className="max-w-xs">
											<SelectValue placeholder="No default" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="__none__">
												No default
											</SelectItem>
											{(field.options || []).map(
												(opt) => (
													<SelectItem
														key={opt}
														value={opt}
													>
														{opt}
													</SelectItem>
												),
											)}
										</SelectContent>
									</Select>
								</div>
							</>
						)}

						{/* --- Context: boolean values (checkbox / toggle) --- */}
						{isBooleanWidget(field.widgetType) && (
							<div className="grid grid-cols-3 gap-3 rounded-md border border-border border-dashed bg-muted/30 p-2">
								<div className="flex flex-col gap-1">
									<Label className="text-xs">
										Checked = value
									</Label>
									<Input
										placeholder="1"
										value={field.checkedValue ?? ""}
										onChange={(e) =>
											onUpdate({
												checkedValue: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label className="text-xs">
										Unchecked = value
									</Label>
									<Input
										placeholder="0"
										value={field.uncheckedValue ?? ""}
										onChange={(e) =>
											onUpdate({
												uncheckedValue: e.target.value,
											})
										}
									/>
								</div>
								<div className="flex flex-col gap-1">
									<Label className="text-xs">Default</Label>
									<Select
										value={
											field.defaultValue === "1" ||
											field.defaultValue === "true"
												? "checked"
												: "unchecked"
										}
										onValueChange={(v) =>
											onUpdate({
												defaultValue:
													v === "checked" ? "1" : "0",
											})
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="unchecked">
												Unchecked
											</SelectItem>
											<SelectItem value="checked">
												Checked
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						)}
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
