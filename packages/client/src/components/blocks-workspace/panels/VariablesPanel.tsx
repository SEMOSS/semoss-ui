// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import {
	Archive,
	ArrowDown,
	ArrowUp,
	Bolt,
	Bot,
	ChevronsUpDown,
	Database,
	type LucideIcon,
	Plus,
	Search,
	Sigma,
	SlidersHorizontal,
	Wand2,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocks, VARIABLE_TYPES, type Variable } from "@semoss/renderer";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { AddVariablePopover, NotebookVariable } from "@/components/notebook";
import { Panel } from "@/components/workspace";
import { usePixel, useWorkspace } from "@/hooks";
import VariableArray from "../../../assets/img/VariableArray.svg";
import VariableBlock from "../../../assets/img/VariableBlock.svg";
import VariableCell from "../../../assets/img/VariableCell.svg";
import VariableDate from "../../../assets/img/VariableDate.svg";
import VariableJSON from "../../../assets/img/VariableJSON.svg";
import VariableQuery from "../../../assets/img/VariableQuery.svg";
import VariableString from "../../../assets/img/VariableString.svg";
import { suggestVariableRenames } from "../utils";

const ENGINE_TYPE_ICONS: Record<string, LucideIcon> = {
	model: Bot,
	database: Database,
	vector: Bolt,
	storage: Archive,
	function: Sigma,
};

const VARIABLE_TYPE_ICONS: Record<string, string> = {
	block: VariableBlock,
	cell: VariableCell,
	query: VariableQuery,
	string: VariableString,
	JSON: VariableJSON,
	date: VariableDate,
	array: VariableArray,
};

interface VariablePanelProps {
	title: string;
}

/**
 * Render the variables menu
 */
export const VariablesPanel = observer(
	(props: VariablePanelProps): JSX.Element => {
		const { title } = props;

		const { state } = useBlocks();
		const { workspace } = useWorkspace();

		/**
		 * State
		 */
		const [popoverAnchorEle, setPopoverAnchorEl] =
			useState<HTMLElement | null>(null);
		const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
		const [engines, setEngines] = useState<{
			models: {
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype: string;
			}[];
			databases: {
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype: string;
			}[];
			storages: {
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype: string;
			}[];
			functions: {
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype: string;
			}[];
			vectors: {
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype: string;
			}[];
		}>({
			models: [],
			databases: [],
			storages: [],
			functions: [],
			vectors: [],
		});
		const [filterWord, setFilterWord] = useState("");
		const [selectedFilter, setSelectedFilter] = useState(VARIABLE_TYPES);
		const [tempFilter, setTempFilter] = useState<string[]>(VARIABLE_TYPES);
		const [expandedItems, setExpandedItems] = useState<
			Record<string, boolean>
		>(() => {
			const groupedVariables = Object.entries(state.variables).reduce(
				(acc, [id, variable]) => {
					if (!acc[variable.type]) acc[variable.type] = [];
					acc[variable.type].push({ id, variable });
					return acc;
				},
				{} as Record<string, { id: string; variable: Variable }[]>,
			);

			const initial: Record<string, boolean> = {};
			Object.keys(groupedVariables).forEach((type) => {
				initial[type] = false;
			});
			return initial;
		});
		const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
		const [tempSortOrder, setTempSortOrder] = useState<"asc" | "desc">(
			"asc",
		);

		// New state for the rename modal
		const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
		const [suggestedChanges, setSuggestedChanges] = useState<
			Record<string, string>
		>({});
		const [selectedChanges, setSelectedChanges] = useState<
			Record<string, boolean>
		>({});
		const [isProcessing, _setIsProcessing] = useState(false);

		const [llmLoad, setLLMLoad] = useState<boolean>(false);

		/**
		 * API
		 */
		const getEngines =
			usePixel<
				{
					engine_id: string;
					engine_name: string;
					engine_type: string;
					engine_subtype: string;
				}[]
			>(`MyEngines();`);

		/**
		 * Computed
		 */
		const isPopoverOpen = Boolean(popoverAnchorEle);

		/**
		 * Effects/Memos
		 */
		useEffect(() => {
			if (getEngines.status !== "SUCCESS") {
				return;
			}
			const cleanedEngines = getEngines.data.map((d) => ({
				engine_name: d.engine_name
					? d.engine_name.replace(/_/g, " ")
					: "",
				engine_id: d.engine_id,
				engine_type: d.engine_type,
				engine_subtype: d.engine_subtype,
			}));

			const newEngines = {
				models: cleanedEngines.filter((e) => e.engine_type === "MODEL"),
				databases: cleanedEngines.filter(
					(e) => e.engine_type === "DATABASE",
				),
				storages: cleanedEngines.filter(
					(e) => e.engine_type === "STORAGE",
				),
				functions: cleanedEngines.filter(
					(e) => e.engine_type === "FUNCTION",
				),
				vectors: cleanedEngines.filter(
					(e) => e.engine_type === "VECTOR",
				),
			};

			setEngines(newEngines);
		}, [getEngines.status, getEngines.data]);

		useEffect(() => {
			if (filterPopoverOpen) {
				setTempFilter(selectedFilter);
				setTempSortOrder(sortOrder);
			}
		}, [filterPopoverOpen]);

		useEffect(() => {
			if (filterPopoverOpen) {
				setTempFilter(selectedFilter);
			}
		}, [filterPopoverOpen]);

		const variables = useMemo(() => {
			return Object.entries(state.variables)
				.filter(
					([id, val]) =>
						id.includes(filterWord) &&
						selectedFilter.includes(val.type),
				)
				.sort((a, b) => {
					const typeCompare = a[1].type.localeCompare(b[1].type);
					if (typeCompare !== 0) {
						return sortOrder === "asc" ? typeCompare : -typeCompare;
					}
					return sortOrder === "asc"
						? a[0].localeCompare(b[0])
						: b[0].localeCompare(a[0]);
				});
		}, [
			filterWord,
			JSON.stringify(selectedFilter),
			sortOrder,
			Object.values(state.variables),
		]);

		/**
		 * Handle opening the rename modal and getting suggestions
		 */
		const handleOpenRenameModal = async () => {
			setLLMLoad(true);
			try {
				const changes = await suggestVariableRenames(
					state,
					workspace.agentModelEngine,
				);

				if (typeof changes === "object" && changes !== null) {
					const changesRecord = changes as Record<string, string>;
					setSuggestedChanges(changesRecord);

					const initialSelection: Record<string, boolean> = {};
					Object.keys(changesRecord).forEach((key) => {
						initialSelection[key] = true;
					});
					setSelectedChanges(initialSelection);

					setIsRenameModalOpen(true);
				}
				setLLMLoad(false);
			} catch (error) {
				console.error("Error getting suggested changes:", error);
				setLLMLoad(false);
			}
		};

		/**
		 * Handle applying the selected changes
		 */
		const handleApplyChanges = async () => {
			workspace.setLoading(true);
			try {
				const changesToApply: Record<string, string> = {};
				Object.entries(suggestedChanges).forEach(
					([oldName, newName]) => {
						if (selectedChanges[oldName]) {
							changesToApply[oldName] = newName;
						}
					},
				);

				if (Object.keys(changesToApply).length > 0) {
					await (
						state as {
							applyVariableRenames: (
								changes: Record<string, string>,
							) => Promise<unknown>;
						}
					).applyVariableRenames(changesToApply);
					setIsRenameModalOpen(false);
					setSuggestedChanges({});
					setSelectedChanges({});
				}
			} catch (error) {
				console.error("Error applying changes:", error);
			} finally {
				workspace.setLoading(false);
			}
		};

		/**
		 * Handle toggling a change selection
		 */
		const handleToggleChange = (oldName: string) => {
			setSelectedChanges((prev) => ({
				...prev,
				[oldName]: !prev[oldName],
			}));
		};

		const allSelected = tempFilter.length === VARIABLE_TYPES.length;

		function capitalizeFirstLetter(str) {
			if (!str) return "";
			return str.charAt(0).toUpperCase() + str.slice(1);
		}

		const groupedVariables = useMemo(() => {
			return variables.reduce(
				(acc, [id, variable]) => {
					if (!acc[variable.type]) acc[variable.type] = [];
					acc[variable.type].push({ id, variable });
					return acc;
				},
				{} as Record<string, { id: string; variable: Variable }[]>,
			);
		}, [variables]);

		const tooltipText = useMemo(() => {
			const groupedVariables = variables.reduce(
				(acc, [id, variable]) => {
					if (!acc[variable.type]) acc[variable.type] = [];
					acc[variable.type].push({ id, variable });
					return acc;
				},
				{} as Record<string, { id: string; variable: Variable }[]>,
			);

			const types = Object.keys(groupedVariables);
			const expandedCount = types.filter(
				(type) => expandedItems[type] === true,
			).length;

			if (expandedCount === 0) {
				return "Expand Variables";
			} else if (expandedCount === types.length) {
				return "Collapse Variables";
			} else {
				return "Collapse All";
			}
		}, [variables, expandedItems]);

		const prevTypesRef = useRef<string[]>([]);

		useEffect(() => {
			const currentTypes = Object.keys(groupedVariables);
			const prevTypes = prevTypesRef.current;

			const newTypes = currentTypes.filter(
				(type) => !prevTypes.includes(type),
			);

			if (newTypes.length > 0) {
				setTimeout(() => {
					setExpandedItems((prev) => {
						const updated = { ...prev };

						const existingTypes = Object.keys(prev);
						let defaultStateForNewTypes = false;

						if (existingTypes.length > 0) {
							const allExpanded = existingTypes.every(
								(type) => prev[type] === true,
							);
							const allCollapsed = existingTypes.every(
								(type) => prev[type] === false,
							);

							if (allExpanded) {
								defaultStateForNewTypes = true;
							} else if (allCollapsed) {
								defaultStateForNewTypes = false;
							} else {
								defaultStateForNewTypes = false;
							}
						}

						newTypes.forEach((type) => {
							updated[type] = defaultStateForNewTypes;
						});
						return updated;
					});
				}, 0);
			}

			prevTypesRef.current = currentTypes;
		}, [groupedVariables]);

		return (
			<Panel
				actions={
					<div className="flex w-full flex-col bg-white p-0">
						<div className="mt-1 mb-2 ml-3 w-fit rounded-2xl bg-[#EBF4FE] px-3">
							<span className="mt-2 mb-2 inline-block font-normal text-[#1260DD] text-[13px] leading-[18px] tracking-[0.16px]">
								{title}
							</span>
						</div>
						<div className="mt-1 mb-0 flex items-center gap-2 px-3">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
								<Input
									placeholder="Search"
									className="w-full rounded-lg pl-9"
									value={filterWord}
									onChange={(e) =>
										setFilterWord(e.target.value)
									}
									data-testid={"variable-panel-search-txt"}
								/>
							</div>
							<Popover
								open={filterPopoverOpen}
								onOpenChange={setFilterPopoverOpen}
							>
								<PopoverTrigger asChild>
									<Button
										variant="ghost"
										size="icon-sm"
										data-testid={
											"variable-panel-filter-btn"
										}
										className="relative shrink-0"
									>
										{(selectedFilter.length !==
											VARIABLE_TYPES.length ||
											sortOrder !== "asc") && (
											<span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary" />
										)}
										<SlidersHorizontal className="size-4" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-72 p-0"
									align="end"
								>
									<div className="flex flex-col rounded-lg bg-white">
										<div className="flex items-center justify-between border-border border-b px-4 py-2">
											<span className="font-medium text-primary text-sm">
												Filter By
											</span>
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() =>
													setFilterPopoverOpen(false)
												}
												data-testid={
													"variable-filter-popover-close-btn"
												}
											>
												<X className="size-4" />
											</Button>
										</div>
										<ul className="m-0 flex max-h-64 list-none flex-col overflow-y-auto p-0 py-1">
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: filter list item */}
											<li
												className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-accent"
												onClick={() =>
													allSelected
														? setTempFilter([])
														: setTempFilter([
																...VARIABLE_TYPES,
															])
												}
												data-testid={
													"variable-filter-select-all-item"
												}
											>
												<Checkbox
													checked={allSelected}
													onCheckedChange={(
														checked,
													) => {
														setTempFilter(
															checked
																? [
																		...VARIABLE_TYPES,
																	]
																: [],
														);
													}}
													onClick={(e) =>
														e.stopPropagation()
													}
													data-testid={
														"variable-filter-select-all-chk"
													}
												/>
												<span className="text-foreground text-sm">
													Select All
												</span>
											</li>
											{VARIABLE_TYPES.map((type) => (
												// biome-ignore lint/a11y/useKeyWithClickEvents: filter list item
												<li
													key={type}
													data-testid={`variable-filter-${type}-item`}
													className="flex cursor-pointer items-center gap-3 px-4 py-2 transition-colors hover:bg-accent"
													onClick={() =>
														setTempFilter((prev) =>
															prev.includes(type)
																? prev.filter(
																		(t) =>
																			t !==
																			type,
																	)
																: [
																		...prev,
																		type,
																	],
														)
													}
												>
													<Checkbox
														checked={tempFilter.includes(
															type,
														)}
														data-testid={`variable-filter-${type}-chk`}
														onCheckedChange={(
															checked,
														) => {
															setTempFilter(
																(prev) =>
																	checked
																		? [
																				...prev,
																				type,
																			]
																		: prev.filter(
																				(
																					t,
																				) =>
																					t !==
																					type,
																			),
															);
														}}
														onClick={(e) =>
															e.stopPropagation()
														}
													/>
													<span className="text-foreground text-sm">
														{capitalizeFirstLetter(
															type,
														)}
													</span>
												</li>
											))}
										</ul>
										<Separator />
										<div className="flex flex-col py-1">
											<span className="px-4 py-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
												Sort By
											</span>
											<button
												type="button"
												className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${tempSortOrder === "asc" ? "bg-accent font-medium" : "hover:bg-accent"}`}
												onClick={() =>
													setTempSortOrder("asc")
												}
												data-testid={
													"variable-filter-sort-asc-item"
												}
											>
												<ArrowUp className="size-4 text-muted-foreground" />
												<span>Ascending</span>
											</button>
											<button
												type="button"
												className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${tempSortOrder === "desc" ? "bg-accent font-medium" : "hover:bg-accent"}`}
												onClick={() =>
													setTempSortOrder("desc")
												}
												data-testid={
													"variable-filter-sort-desc-item"
												}
											>
												<ArrowDown className="size-4 text-muted-foreground" />
												<span>Descending</span>
											</button>
										</div>
										<Separator />
										<div className="flex gap-2 px-4 py-3">
											<Button
												variant="outline"
												className="flex-1"
												onClick={() => {
													setTempFilter(
														VARIABLE_TYPES,
													);
													setSelectedFilter(
														VARIABLE_TYPES,
													);
													setTempSortOrder("asc");
													setSortOrder("asc");
													setFilterPopoverOpen(false);
												}}
												data-testid={
													"variable-filter-clear-all-btn"
												}
											>
												Clear All
											</Button>
											<Button
												className="flex-1"
												onClick={() => {
													setSelectedFilter(
														tempFilter,
													);
													setSortOrder(tempSortOrder);
													setFilterPopoverOpen(false);
												}}
												data-testid={
													"variable-filter-apply-btn"
												}
											>
												Apply
											</Button>
										</div>
									</div>
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex items-center justify-between px-3 py-3">
							<p className="m-0 font-semibold text-sm">
								Variables
							</p>
							<div className="flex flex-row gap-1">
								<Button
									variant="ghost"
									size="icon-sm"
									disabled={
										!workspace.agentModelEngine ||
										isProcessing
									}
									onClick={handleOpenRenameModal}
									data-testid={
										"variable-panel-rename-suggest-btn"
									}
								>
									{llmLoad ? (
										<Spinner className="size-4" />
									) : (
										<Wand2 className="size-4" />
									)}
								</Button>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											className="notebook-variable-menu__add-variable-button"
											onClick={(e) =>
												setPopoverAnchorEl(
													e.currentTarget,
												)
											}
											data-testid={
												"variable-panel-add-variable-btn"
											}
										>
											<Plus className="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										Create New Variable
									</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon-sm"
											onClick={() => {
												const types =
													Object.keys(
														groupedVariables,
													);
												const hasAnyExpanded =
													types.some(
														(type) =>
															expandedItems[
																type
															] === true,
													);
												const newState: Record<
													string,
													boolean
												> = {};
												types.forEach((type) => {
													newState[type] =
														!hasAnyExpanded;
												});
												setExpandedItems(newState);
											}}
											data-testid={
												"variable-panel-expand-collapse-btn"
											}
										>
											<ChevronsUpDown className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">
										{tooltipText}
									</TooltipContent>
								</Tooltip>
							</div>
						</div>
					</div>
				}
			>
				<div className="flex h-full flex-col overflow-auto bg-white">
					<Accordion
						type="multiple"
						value={Object.keys(expandedItems).filter(
							(k) => expandedItems[k],
						)}
					>
						{Object.entries(groupedVariables).map(
							([type, vars]) => {
								if (expandedItems[type] === undefined)
									return null;
								return (
									<AccordionItem
										key={type}
										value={type}
										className="border-b-0 shadow-none"
										data-testid={`variable-panel-type-${type}-accordion`}
									>
										<AccordionTrigger
											className="h-10 px-3 py-2.5 hover:bg-accent/50 hover:no-underline"
											onClick={() => {
												setExpandedItems((prev) => ({
													...prev,
													[type]: !prev[type],
												}));
											}}
										>
											<div className="flex items-center gap-2">
												{(() => {
													const LucideIcon =
														ENGINE_TYPE_ICONS[type];
													if (LucideIcon)
														return (
															<LucideIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
														);
													if (type === "number")
														return (
															<span className="flex h-4 w-4 shrink-0 items-center justify-center font-bold text-muted-foreground text-xs">
																#
															</span>
														);
													if (
														VARIABLE_TYPE_ICONS[
															type
														]
													)
														return (
															<img
																src={
																	VARIABLE_TYPE_ICONS[
																		type
																	]
																}
																alt={type}
																className="h-4 w-4 shrink-0"
															/>
														);
													return null;
												})()}
												<span className="font-medium text-foreground text-sm">
													{capitalizeFirstLetter(
														type,
													)}
												</span>
											</div>
										</AccordionTrigger>
										<AccordionContent className="p-0 pb-0">
											<ul className="m-0 list-none p-0">
												{vars.map(
													({ id, variable }) => (
														<NotebookVariable
															key={id}
															id={id}
															variable={variable}
															engines={engines}
															suggestVariableRenames={
																suggestVariableRenames
															}
														/>
													),
												)}
											</ul>
										</AccordionContent>
									</AccordionItem>
								);
							},
						)}
					</Accordion>
				</div>

				{isPopoverOpen && (
					<AddVariablePopover
						open={isPopoverOpen}
						anchorEl={popoverAnchorEle}
						onClose={() => setPopoverAnchorEl(null)}
						engines={engines}
					/>
				)}

				<Dialog
					open={isRenameModalOpen}
					onOpenChange={(open) =>
						!open && setIsRenameModalOpen(false)
					}
				>
					<DialogContent className="max-h-[80vh] max-w-[600px] overflow-auto">
						<DialogHeader>
							<DialogTitle>
								Suggested Variable Name Changes
							</DialogTitle>
						</DialogHeader>
						<p className="text-muted-foreground text-sm">
							Review and select the variable name changes you'd
							like to apply. All changes are selected by default.
						</p>
						<div className="flex flex-col gap-2">
							{Object.entries(suggestedChanges).map(
								([oldName, newName]) => (
									<div
										key={oldName}
										className="flex items-center gap-3 rounded-md border border-border bg-background p-3"
									>
										<Checkbox
											checked={
												selectedChanges[oldName] ||
												false
											}
											onCheckedChange={() =>
												handleToggleChange(oldName)
											}
										/>
										<div className="min-w-0 flex-1">
											<p className="truncate text-muted-foreground text-xs">
												{oldName}
											</p>
											<p className="font-medium text-sm">
												→ {newName}
											</p>
										</div>
									</div>
								),
							)}
						</div>
						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setIsRenameModalOpen(false)}
								disabled={isProcessing}
							>
								Cancel
							</Button>
							<Button
								onClick={handleApplyChanges}
								disabled={
									isProcessing ||
									Object.keys(selectedChanges).filter(
										(key) => selectedChanges[key],
									).length === 0
								}
							>
								{isProcessing
									? "Applying..."
									: "Apply Selected Changes"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</Panel>
		);
	},
);
