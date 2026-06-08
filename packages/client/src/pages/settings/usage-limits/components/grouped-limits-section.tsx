import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { useServerPagination } from "@/hooks";
import { TIME_PERIOD_LABELS, UI_TIME_PERIODS } from "../constants";
import type { TimePeriod } from "../types";

export interface GroupedLimitRow {
	id: string;
	period: TimePeriod;
	savedPeriod?: TimePeriod;
	combinedLimit: number | null;
	inputLimit: number | null;
	outputLimit: number | null;
	responseTimeLimit?: number | null;
	isActive: boolean;
}

export interface GroupedLimitEntity<TOption = unknown> {
	id: string;
	name: string;
	details: { label: string; value: string }[];
	rows: GroupedLimitRow[];
	option?: TOption;
}

interface AddableOption {
	id: string;
	name: string;
	[key: string]: unknown;
}

const ALL_PERIODS = Object.keys(TIME_PERIOD_LABELS) as TimePeriod[];
const PERIODS = UI_TIME_PERIODS;
const DIALOG_ROWS_PER_PAGE = 8;

const parseNullableNumber = (value: string) => {
	if (value.trim() === "") {
		return null;
	}
	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? null : parsed;
};

const sanitizeNumericInput = (value: string) => value.replace(/[^\d]/g, "");

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

const isRowDirty = (
	source: GroupedLimitRow,
	draft: GroupedLimitRow,
	supportsActive: boolean,
	fieldMode: "token" | "compute",
) =>
	source.savedPeriod == null ||
	draft.period !== source.period ||
	(fieldMode === "compute"
		? draft.responseTimeLimit !== source.responseTimeLimit
		: draft.combinedLimit !== source.combinedLimit ||
			draft.inputLimit !== source.inputLimit ||
			draft.outputLimit !== source.outputLimit) ||
	(supportsActive && draft.isActive !== source.isActive);

const GroupedLimitEditorRow = ({
	row,
	sourceRow,
	onChange,
	onSave,
	onDelete,
	disabled,
	availablePeriods = PERIODS,
	supportsActive = true,
	fieldMode = "token",
}: {
	row: GroupedLimitRow;
	sourceRow: GroupedLimitRow;
	onChange: (next: GroupedLimitRow) => void;
	onSave: () => void;
	onDelete: () => void;
	disabled?: boolean;
	availablePeriods?: TimePeriod[];
	supportsActive?: boolean;
	fieldMode?: "token" | "compute";
}) => {
	const dirty = isRowDirty(sourceRow, row, supportsActive, fieldMode);
	const [combinedValue, setCombinedValue] = useState(
		row.combinedLimit == null ? "" : String(row.combinedLimit),
	);
	const [inputValue, setInputValue] = useState(
		row.inputLimit == null ? "" : String(row.inputLimit),
	);
	const [outputValue, setOutputValue] = useState(
		row.outputLimit == null ? "" : String(row.outputLimit),
	);
	const [responseTimeValue, setResponseTimeValue] = useState(
		row.responseTimeLimit == null ? "" : String(row.responseTimeLimit),
	);
	const periodOptions = useMemo(() => {
		const nextPeriods = availablePeriods.includes(row.period)
			? availablePeriods
			: [...availablePeriods, row.period];
		return [...nextPeriods].sort(
			(a, b) => ALL_PERIODS.indexOf(a) - ALL_PERIODS.indexOf(b),
		);
	}, [availablePeriods, row.period]);

	useEffect(() => {
		setCombinedValue(
			row.combinedLimit == null ? "" : String(row.combinedLimit),
		);
	}, [row.combinedLimit]);

	useEffect(() => {
		setInputValue(row.inputLimit == null ? "" : String(row.inputLimit));
	}, [row.inputLimit]);

	useEffect(() => {
		setOutputValue(row.outputLimit == null ? "" : String(row.outputLimit));
	}, [row.outputLimit]);

	useEffect(() => {
		setResponseTimeValue(
			row.responseTimeLimit == null ? "" : String(row.responseTimeLimit),
		);
	}, [row.responseTimeLimit]);

	return (
		<div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
			{fieldMode === "compute" ? (
				<div className="flex items-center gap-2">
					<Label className="whitespace-nowrap text-xs">
						Response Time (ms):
					</Label>
					<Input
						type="text"
						inputMode="numeric"
						pattern="[0-9]*"
						value={responseTimeValue}
						onChange={(e) => {
							const nextValue = sanitizeNumericInput(
								e.target.value,
							);
							setResponseTimeValue(nextValue);
							onChange({
								...row,
								responseTimeLimit:
									parseNullableNumber(nextValue),
							});
						}}
						disabled={disabled}
						className="h-8 w-28"
					/>
				</div>
			) : (
				<>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Combined:
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={combinedValue}
							onChange={(e) => {
								const nextValue = sanitizeNumericInput(
									e.target.value,
								);
								setCombinedValue(nextValue);
								onChange({
									...row,
									combinedLimit:
										parseNullableNumber(nextValue),
								});
							}}
							disabled={disabled}
							className="h-8 w-24"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Input:
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={inputValue}
							onChange={(e) => {
								const nextValue = sanitizeNumericInput(
									e.target.value,
								);
								setInputValue(nextValue);
								onChange({
									...row,
									inputLimit: parseNullableNumber(nextValue),
								});
							}}
							disabled={disabled}
							className="h-8 w-24"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Label className="whitespace-nowrap text-xs">
							Output:
						</Label>
						<Input
							type="text"
							inputMode="numeric"
							pattern="[0-9]*"
							value={outputValue}
							onChange={(e) => {
								const nextValue = sanitizeNumericInput(
									e.target.value,
								);
								setOutputValue(nextValue);
								onChange({
									...row,
									outputLimit: parseNullableNumber(nextValue),
								});
							}}
							disabled={disabled}
							className="h-8 w-24"
						/>
					</div>
				</>
			)}
			<div className="flex items-center gap-2">
				<Label className="text-xs">Period:</Label>
				<Select
					value={row.period}
					onValueChange={(value: TimePeriod) =>
						onChange({ ...row, period: value })
					}
				>
					<SelectTrigger className="h-8 w-28">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{periodOptions.map((period) => (
							<SelectItem key={period} value={period}>
								{TIME_PERIOD_LABELS[period]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{supportsActive && (
				<div className="flex items-center gap-2">
					<Label className="text-xs">Active:</Label>
					<Switch
						checked={row.isActive}
						onCheckedChange={(checked) =>
							onChange({ ...row, isActive: checked })
						}
						disabled={disabled}
					/>
				</div>
			)}
			<div className="ml-auto flex items-center gap-1">
				{dirty && (
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						onClick={onSave}
						disabled={disabled}
						title="Save row"
					>
						<Save className="size-4" />
					</Button>
				)}
				<Button
					variant="ghost"
					size="icon"
					className="text-destructive"
					onClick={onDelete}
					disabled={disabled}
					title="Delete row"
				>
					<Trash2 className="size-4" />
				</Button>
			</div>
		</div>
	);
};

const PaginationControls = ({
	page,
	totalPages,
	rowsPerPage,
	setPage,
	setRowsPerPage,
	startRow,
	endRow,
	totalCount,
}: {
	page: number;
	totalPages: number;
	rowsPerPage: number;
	setPage: (next: number) => void;
	setRowsPerPage: (next: number) => void;
	startRow: number;
	endRow: number;
	totalCount: number;
}) => (
	<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2">
		<div className="text-muted-foreground text-xs">
			Showing {startRow}-{endRow} of {totalCount}
		</div>
		<div className="flex items-center gap-2">
			<Label className="text-xs">Rows:</Label>
			<Select
				value={String(rowsPerPage)}
				onValueChange={(value) => setRowsPerPage(Number(value))}
			>
				<SelectTrigger className="h-8 w-20">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{[5, 10, 20, 50].map((value) => (
						<SelectItem key={value} value={String(value)}>
							{value}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setPage(page - 1)}
				disabled={page <= 0}
			>
				Previous
			</Button>
			<div className="min-w-14 text-center text-xs">
				{page + 1} / {totalPages}
			</div>
			<Button
				variant="outline"
				size="sm"
				onClick={() => setPage(page + 1)}
				disabled={page >= totalPages - 1}
			>
				Next
			</Button>
		</div>
	</div>
);

export function GroupedLimitsSection<TOption extends AddableOption>({
	title,
	description,
	entityLabel,
	entities,
	entityOptions,
	emptyMessage,
	onSaveRows,
	onSaveSingleRow,
	onAddEntity,
	onRemoveEntityRow,
	multiPeriod,
	savingIds,
	renderEntityDetails,
	supportsActive = true,
	fieldMode = "token",
}: {
	title: string;
	description: string;
	entityLabel: string;
	entities: GroupedLimitEntity<TOption>[];
	entityOptions: TOption[];
	emptyMessage: string;
	onSaveRows?: (entityId: string, rows: GroupedLimitRow[]) => void;
	onSaveSingleRow?: (entityId: string, row: GroupedLimitRow) => void;
	onAddEntity: (entity: TOption) => void;
	onRemoveEntityRow: (entityId: string, rowId: string) => void;
	multiPeriod: boolean;
	savingIds: Set<string>;
	renderEntityDetails: (entity: TOption) => ReactNode;
	supportsActive?: boolean;
	fieldMode?: "token" | "compute";
}) {
	const [open, setOpen] = useState(true);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [selectedEntityId, setSelectedEntityId] = useState("");
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [draftRowsByEntityId, setDraftRowsByEntityId] = useState<
		Record<string, Record<string, GroupedLimitRow>>
	>({});
	const [dialogSearchTerm, setDialogSearchTerm] = useState("");
	const [dialogPage, setDialogPage] = useState(0);

	useEffect(() => {
		setDraftRowsByEntityId((prev) => {
			const entityIds = new Set(entities.map((entity) => entity.id));
			let changed = false;
			const next: Record<string, Record<string, GroupedLimitRow>> = {};

			Object.entries(prev).forEach(([entityId, rowDrafts]) => {
				if (!entityIds.has(entityId)) {
					changed = true;
					return;
				}
				const entity = entities.find((item) => item.id === entityId);
				if (!entity) {
					changed = true;
					return;
				}
				const rowIds = new Set(entity.rows.map((row) => row.id));
				const filteredDrafts = Object.fromEntries(
					Object.entries(rowDrafts).filter(([rowId]) =>
						rowIds.has(rowId),
					),
				);
				if (
					Object.keys(filteredDrafts).length !==
					Object.keys(rowDrafts).length
				) {
					changed = true;
				}
				if (Object.keys(filteredDrafts).length > 0) {
					next[entityId] = filteredDrafts;
				}
			});

			return changed ? next : prev;
		});
	}, [entities]);

	const entityById = useMemo(
		() => new Map(entities.map((entity) => [entity.id, entity])),
		[entities],
	);

	const visibleEntitiesWithDrafts = useMemo(
		() =>
			entities.map((entity) => ({
				...entity,
				rows: entity.rows.map(
					(row) => draftRowsByEntityId[entity.id]?.[row.id] ?? row,
				),
			})),
		[entities, draftRowsByEntityId],
	);

	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		startRow,
		endRow,
		totalPages,
	} = useServerPagination({
		totalCount: visibleEntitiesWithDrafts.length,
		initialRowsPerPage: 5,
		pageIndexBase: 0,
	});

	const visibleEntities = useMemo(
		() =>
			visibleEntitiesWithDrafts.slice(
				page * rowsPerPage,
				page * rowsPerPage + rowsPerPage,
			),
		[page, rowsPerPage, visibleEntitiesWithDrafts],
	);

	const filteredEntityOptions = useMemo(() => {
		const normalizedSearch = normalizeSearchValue(dialogSearchTerm);
		if (!normalizedSearch) {
			return entityOptions;
		}
		return entityOptions.filter((entity) =>
			`${entity.name} ${entity.id}`
				.toLowerCase()
				.includes(normalizedSearch),
		);
	}, [dialogSearchTerm, entityOptions]);

	const dialogTotalPages = Math.max(
		1,
		Math.ceil(filteredEntityOptions.length / DIALOG_ROWS_PER_PAGE),
	);
	const pagedEntityOptions = useMemo(
		() =>
			filteredEntityOptions.slice(
				dialogPage * DIALOG_ROWS_PER_PAGE,
				dialogPage * DIALOG_ROWS_PER_PAGE + DIALOG_ROWS_PER_PAGE,
			),
		[dialogPage, filteredEntityOptions],
	);

	useEffect(() => {
		if (dialogPage > dialogTotalPages - 1) {
			setDialogPage(Math.max(0, dialogTotalPages - 1));
		}
	}, [dialogPage, dialogTotalPages]);

	const updateDraftRow = (
		entityId: string,
		rowId: string,
		next: GroupedLimitRow,
	) => {
		setDraftRowsByEntityId((prev) => ({
			...prev,
			[entityId]: {
				...(prev[entityId] ?? {}),
				[rowId]: next,
			},
		}));
	};

	const clearDraftRow = (entityId: string, rowId: string) => {
		setDraftRowsByEntityId((prev) => {
			const entityDrafts = { ...(prev[entityId] ?? {}) };
			delete entityDrafts[rowId];
			if (Object.keys(entityDrafts).length === 0) {
				const next = { ...prev };
				delete next[entityId];
				return next;
			}
			return {
				...prev,
				[entityId]: entityDrafts,
			};
		});
	};

	return (
		<section className="rounded-xl border">
			<Collapsible open={open} onOpenChange={setOpen}>
				<div className="border-b px-4 py-3">
					<div className="flex items-start justify-between gap-3">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex flex-1 items-start gap-2 text-left"
							>
								{open ? (
									<ChevronDown className="mt-0.5 size-4" />
								) : (
									<ChevronRight className="mt-0.5 size-4" />
								)}
								<div>
									<h3 className="font-semibold text-base">
										{title}
									</h3>
									<p className="text-muted-foreground text-sm">
										{description}
									</p>
								</div>
							</button>
						</CollapsibleTrigger>
						<Button
							size="sm"
							onClick={() => setShowAddDialog(true)}
							disabled={entityOptions.length === 0}
						>
							<Plus className="mr-1 size-3" /> Add Limit
						</Button>
					</div>
				</div>
				<CollapsibleContent className="px-4 py-4">
					{visibleEntitiesWithDrafts.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							{emptyMessage}
						</p>
					) : (
						<div className="flex flex-col gap-3">
							{visibleEntities.map((entity) => {
								const sourceEntity =
									entityById.get(entity.id) ?? entity;
								const entityOpen = expanded[entity.id] ?? true;
								const saving = savingIds.has(entity.id);
								return (
									<Collapsible
										key={entity.id}
										open={entityOpen}
										onOpenChange={(next) =>
											setExpanded((prev) => ({
												...prev,
												[entity.id]: next,
											}))
										}
									>
										<div className="rounded-lg border">
											<div className="flex items-start justify-between gap-3 px-3 py-3">
												<CollapsibleTrigger asChild>
													<button
														type="button"
														className="flex flex-1 items-start gap-2 text-left"
													>
														{entityOpen ? (
															<ChevronDown className="mt-0.5 size-4" />
														) : (
															<ChevronRight className="mt-0.5 size-4" />
														)}
														<div>
															<div className="font-medium text-sm">
																{entity.name}
															</div>
															<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
																{entity.details.map(
																	(
																		detail,
																	) => (
																		<span
																			key={
																				detail.label
																			}
																		>
																			<span className="font-medium">
																				{
																					detail.label
																				}
																				:
																			</span>{" "}
																			{
																				detail.value
																			}
																		</span>
																	),
																)}
															</div>
														</div>
													</button>
												</CollapsibleTrigger>
												{multiPeriod &&
													entity.option && (
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																onAddEntity(
																	entity.option as TOption,
																)
															}
														>
															<Plus className="mr-1 size-3" />{" "}
															Add Period
														</Button>
													)}
											</div>
											<CollapsibleContent className="border-t px-3 py-3">
												<div className="flex flex-col gap-2">
													{entity.rows.map((row) => {
														const sourceRow =
															sourceEntity.rows.find(
																(existing) =>
																	existing.id ===
																	row.id,
															) ?? row;
														return (
															<GroupedLimitEditorRow
																key={row.id}
																row={row}
																sourceRow={
																	sourceRow
																}
																disabled={
																	saving
																}
																supportsActive={
																	supportsActive
																}
																fieldMode={
																	fieldMode
																}
																availablePeriods={
																	multiPeriod
																		? PERIODS.filter(
																				(
																					period,
																				) =>
																					period ===
																						row.period ||
																					!entity.rows.some(
																						(
																							existing,
																						) =>
																							existing.id !==
																								row.id &&
																							existing.period ===
																								period,
																					),
																			)
																		: PERIODS
																}
																onChange={(
																	nextRow,
																) =>
																	updateDraftRow(
																		entity.id,
																		row.id,
																		nextRow,
																	)
																}
																onSave={() => {
																	const draftRow =
																		draftRowsByEntityId[
																			entity
																				.id
																		]?.[
																			row
																				.id
																		] ??
																		row;
																	if (
																		multiPeriod &&
																		onSaveRows
																	) {
																		onSaveRows(
																			entity.id,
																			sourceEntity.rows.map(
																				(
																					existing,
																				) =>
																					existing.id ===
																					row.id
																						? draftRow
																						: existing,
																			),
																		);
																		return;
																	}
																	onSaveSingleRow?.(
																		entity.id,
																		draftRow,
																	);
																}}
																onDelete={() => {
																	clearDraftRow(
																		entity.id,
																		row.id,
																	);
																	onRemoveEntityRow(
																		entity.id,
																		row.id,
																	);
																}}
															/>
														);
													})}
												</div>
											</CollapsibleContent>
										</div>
									</Collapsible>
								);
							})}
							<PaginationControls
								page={page}
								totalPages={totalPages}
								rowsPerPage={rowsPerPage}
								setPage={setPage}
								setRowsPerPage={setRowsPerPage}
								startRow={startRow}
								endRow={endRow}
								totalCount={visibleEntitiesWithDrafts.length}
							/>
						</div>
					)}
				</CollapsibleContent>
			</Collapsible>

			<Dialog
				open={showAddDialog}
				onOpenChange={(next) => {
					setShowAddDialog(next);
					if (!next) {
						setSelectedEntityId("");
						setDialogSearchTerm("");
						setDialogPage(0);
					}
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add {entityLabel} Limit</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3 py-2">
						<Input
							placeholder={`Search ${entityLabel.toLowerCase()}s...`}
							value={dialogSearchTerm}
							onChange={(e) => {
								setDialogSearchTerm(e.target.value);
								setDialogPage(0);
							}}
						/>
						<div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
							{pagedEntityOptions.length === 0 ? (
								<p className="py-6 text-center text-muted-foreground text-sm">
									No {entityLabel.toLowerCase()}s found.
								</p>
							) : (
								pagedEntityOptions.map((entity) => (
									<button
										type="button"
										key={entity.id}
										className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
											selectedEntityId === entity.id
												? "border-primary bg-accent"
												: ""
										}`}
										onClick={() =>
											setSelectedEntityId(entity.id)
										}
									>
										{renderEntityDetails(entity)}
									</button>
								))
							)}
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								Showing{" "}
								{filteredEntityOptions.length === 0
									? 0
									: dialogPage * DIALOG_ROWS_PER_PAGE + 1}
								-
								{Math.min(
									filteredEntityOptions.length,
									(dialogPage + 1) * DIALOG_ROWS_PER_PAGE,
								)}{" "}
								of {filteredEntityOptions.length}
							</span>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setDialogPage((prev) => prev - 1)
									}
									disabled={dialogPage <= 0}
								>
									Previous
								</Button>
								<div className="min-w-14 text-center">
									{dialogPage + 1} / {dialogTotalPages}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setDialogPage((prev) => prev + 1)
									}
									disabled={
										dialogPage >= dialogTotalPages - 1
									}
								>
									Next
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowAddDialog(false)}
						>
							Cancel
						</Button>
						<Button
							disabled={!selectedEntityId}
							onClick={() => {
								const entity = entityOptions.find(
									(option) => option.id === selectedEntityId,
								);
								if (entity) {
									onAddEntity(entity);
								}
								setSelectedEntityId("");
								setShowAddDialog(false);
							}}
						>
							Add Limit
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</section>
	);
}
