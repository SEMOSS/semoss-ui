// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { ChevronsUpDown, Plus, Wand2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocks, type Variable } from "@semoss/renderer";
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
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { AddVariablePopover, NotebookVariable } from "@/components/notebook";
import {
	type EnginesByType,
	getVariableTypeLabel,
	TypeIcon,
} from "@/components/notebook/variable-icon";
import { Panel } from "@/components/workspace";
import { usePixel, useWorkspace } from "@/hooks";
import { suggestVariableRenames } from "../utils";
import { PanelSearch } from "./panel-search";

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
		const [engines, setEngines] = useState<EnginesByType>({
			models: [],
			databases: [],
			storages: [],
			functions: [],
			vectors: [],
		});
		const [filterWord, setFilterWord] = useState("");
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

		const variables = useMemo(() => {
			const needle = filterWord.trim().toLowerCase();
			return Object.entries(state.variables)
				.filter(([id]) =>
					needle ? id.toLowerCase().includes(needle) : true,
				)
				.sort((a, b) => {
					const typeCompare = a[1].type.localeCompare(b[1].type);
					if (typeCompare !== 0) return typeCompare;
					return a[0].localeCompare(b[0]);
				});
		}, [filterWord, Object.values(state.variables)]);

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
						<div className="flex min-h-12 items-center justify-between px-3 pt-3 pb-2">
							<p className="m-0 font-semibold text-sm">{title}</p>
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
						<PanelSearch
							value={filterWord}
							onChange={setFilterWord}
							data-testid="variable-panel-search-txt"
						/>
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
											className="h-9 border-border/60 border-t bg-muted/30 px-3 py-2 hover:bg-muted/50 hover:no-underline"
											onClick={() => {
												setExpandedItems((prev) => ({
													...prev,
													[type]: !prev[type],
												}));
											}}
										>
											<div className="flex items-center gap-2">
												<TypeIcon
													type={type}
													className="size-5"
												/>
												<span className="font-semibold text-foreground text-xs uppercase tracking-wider">
													{getVariableTypeLabel(type)}
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
					<DialogContent className="max-h-[80vh] w-[calc(100vw-2rem)] max-w-2xl overflow-auto">
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
