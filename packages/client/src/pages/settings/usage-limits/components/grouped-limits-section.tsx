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
import { TIME_PERIOD_LABELS } from "../constants";
import type { TimePeriod } from "../types";

export interface GroupedLimitRow {
	id: string;
	period: TimePeriod;
	combinedLimit: number;
	inputLimit: number;
	outputLimit: number;
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

const PERIODS = Object.keys(TIME_PERIOD_LABELS) as TimePeriod[];

const GroupedLimitEditorRow = ({
	row,
	onSave,
	onDelete,
	disabled,
	availablePeriods = PERIODS,
}: {
	row: GroupedLimitRow;
	onSave: (next: GroupedLimitRow) => void;
	onDelete: () => void;
	disabled?: boolean;
	availablePeriods?: TimePeriod[];
}) => {
	const [draft, setDraft] = useState(row);
	useEffect(() => {
		setDraft(row);
	}, [row]);
	const isDirty =
		draft.period !== row.period ||
		draft.combinedLimit !== row.combinedLimit ||
		draft.inputLimit !== row.inputLimit ||
		draft.outputLimit !== row.outputLimit ||
		draft.isActive !== row.isActive;

	return (
		<div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
			<div className="flex items-center gap-2">
				<Label className="whitespace-nowrap text-xs">Combined:</Label>
				<Input
					type="number"
					value={draft.combinedLimit}
					onChange={(e) =>
						setDraft((prev) => ({
							...prev,
							combinedLimit: parseInt(e.target.value, 10) || 0,
						}))
					}
					disabled={disabled}
					className="h-8 w-24"
				/>
			</div>
			<div className="flex items-center gap-2">
				<Label className="whitespace-nowrap text-xs">Input:</Label>
				<Input
					type="number"
					value={draft.inputLimit}
					onChange={(e) =>
						setDraft((prev) => ({
							...prev,
							inputLimit: parseInt(e.target.value, 10) || 0,
						}))
					}
					disabled={disabled}
					className="h-8 w-24"
				/>
			</div>
			<div className="flex items-center gap-2">
				<Label className="whitespace-nowrap text-xs">Output:</Label>
				<Input
					type="number"
					value={draft.outputLimit}
					onChange={(e) =>
						setDraft((prev) => ({
							...prev,
							outputLimit: parseInt(e.target.value, 10) || 0,
						}))
					}
					disabled={disabled}
					className="h-8 w-24"
				/>
			</div>
			<div className="flex items-center gap-2">
				<Label className="text-xs">Period:</Label>
				<Select
					value={draft.period}
					onValueChange={(value: TimePeriod) =>
						setDraft((prev) => ({ ...prev, period: value }))
					}
				>
					<SelectTrigger className="h-8 w-28">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{availablePeriods.map((period) => (
							<SelectItem key={period} value={period}>
								{TIME_PERIOD_LABELS[period]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-center gap-2">
				<Label className="text-xs">Active:</Label>
				<Switch
					checked={draft.isActive}
					onCheckedChange={(checked) =>
						setDraft((prev) => ({ ...prev, isActive: checked }))
					}
					disabled={disabled}
				/>
			</div>
			<div className="ml-auto flex items-center gap-1">
				{isDirty && (
					<Button
						variant="ghost"
						size="icon"
						className="text-primary"
						onClick={() => onSave(draft)}
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
}) {
	const [open, setOpen] = useState(true);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [selectedEntityId, setSelectedEntityId] = useState("");
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		startRow,
		endRow,
		totalPages,
	} = useServerPagination({
		totalCount: entities.length,
		initialRowsPerPage: 5,
		pageIndexBase: 0,
	});

	const visibleEntities = useMemo(
		() =>
			entities.slice(
				page * rowsPerPage,
				page * rowsPerPage + rowsPerPage,
			),
		[entities, page, rowsPerPage],
	);

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
					{entities.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							{emptyMessage}
						</p>
					) : (
						<div className="flex flex-col gap-3">
							{visibleEntities.map((entity) => {
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
													{entity.rows.map((row) => (
														<GroupedLimitEditorRow
															key={row.id}
															row={row}
															disabled={saving}
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
																						existing.period ===
																						period,
																				),
																		)
																	: PERIODS
															}
															onSave={(
																nextRow,
															) => {
																if (
																	multiPeriod
																) {
																	onSaveRows?.(
																		entity.id,
																		entity.rows.map(
																			(
																				existing,
																			) =>
																				existing.id ===
																				row.id
																					? nextRow
																					: existing,
																		),
																	);
																	return;
																}
																onSaveSingleRow?.(
																	entity.id,
																	nextRow,
																);
															}}
															onDelete={() => {
																onRemoveEntityRow(
																	entity.id,
																	row.id,
																);
															}}
														/>
													))}
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
								totalCount={entities.length}
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
					}
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add {entityLabel} Limit</DialogTitle>
					</DialogHeader>
					<div className="flex max-h-64 flex-col gap-2 overflow-y-auto py-2">
						{entityOptions.map((entity) => (
							<button
								type="button"
								key={entity.id}
								className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
									selectedEntityId === entity.id
										? "border-primary bg-accent"
										: ""
								}`}
								onClick={() => setSelectedEntityId(entity.id)}
							>
								{renderEntityDetails(entity)}
							</button>
						))}
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
