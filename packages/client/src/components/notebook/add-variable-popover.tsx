import { AlertTriangle, Eye, MoreHorizontal } from "lucide-react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
	ActionMessages,
	BLOCK_TYPE_INPUT,
	DefaultBlocks,
	Renderer,
	type SerializedState,
	STATE_VERSION,
	useBlocks,
	VARIABLE_TYPES,
	type Variable,
	type VariableType,
	type VariableWithId,
} from "@semoss/renderer";
import { EngineSubtypeIcon, MonacoEditor } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import { JsonValueViewer } from "@/components/common/json-value-viewer";
// TODO: MOVE TO SDK/UTILITY LIB
import { isOutputJSON, splitAtPeriod } from "../../utility";
import {
	type EnginesByType,
	getVariableTypeLabel,
	TypeIcon,
} from "./variable-icon";
import {
	countAffectedSources,
	findVariableReferences,
	noLigatureStyle,
	rewriteVariableReferences,
} from "./variable-references";

interface AddVariablePopoverProps {
	/**
	 * modal open
	 */
	open: boolean;

	/**
	 * closes modal
	 */
	onClose: () => void;

	/**
	 * El the popover is tied to (kept for API compat, unused)
	 */
	// biome-ignore lint/suspicious/noExplicitAny: anchorEl kept for API compatibility
	anchorEl: any;

	/**
	 * Do we want edit variable
	 */
	variable?: VariableWithId;

	/**
	 * Engines
	 */
	engines: EnginesByType;
}
export const AddVariablePopover = observer((props: AddVariablePopoverProps) => {
	const { open, onClose, variable, engines } = props;
	const { state } = useBlocks();

	const [variableName, setVariableName] = useState("");
	const [variableType, setVariableType] = useState<VariableType | "">("");
	const [variablePointer, setVariablePointer] = useState("");

	// In edit mode, find every {{currentName}} reference so we can surface a
	// list of affected cells/blocks and warn the user when they change the
	// underlying type or pointer (the alias key is preserved but consumers
	// will silently get a different value).
	const affectedRefs = useMemo(
		() => (variable?.id ? findVariableReferences(state, variable.id) : []),
		[variable, state],
	);
	const affectedSourceCount = useMemo(
		() => countAffectedSources(affectedRefs),
		[affectedRefs],
	);
	const typeOrPointerChanged = useMemo(() => {
		if (!variable) return false;
		if (variableType !== variable.type) return true;
		if (variable.type === "cell") {
			const originalPointer = `${variable.to}.${(variable as { cellId?: string }).cellId ?? ""}`;
			return originalPointer !== variablePointer;
		}
		return variable.to !== variablePointer;
	}, [variable, variableType, variablePointer]);
	const [engine, setEngine] = useState<{
		engine_id: string;
		engine_name: string;
		engine_type: string;
		engine_subtype;
	} | null>(null);
	const [showPreview, setShowPreview] = useState<boolean>(true);

	const [variableInputValue, setVariableInputValue] = useState(null);
	const inputVariableTypeList = ["string", "number", "JSON", "date", "array"];

	let alreadyAliased = false;

	if (variable) {
		if (variable.id !== variableName) {
			alreadyAliased = Boolean(state.variables[variableName]);
		}
	} else {
		alreadyAliased = Boolean(state.variables[variableName]);
	}

	// get the input type blocks as an array
	const inputBlocks = computed(() => {
		return Object.values(state.blocks)
			.filter(
				(block) =>
					DefaultBlocks[block.widget].type === BLOCK_TYPE_INPUT,
			)
			.sort((a, b) => {
				const aId = a.id.toLowerCase(),
					bId = b.id.toLowerCase();

				if (aId < bId) {
					return -1;
				}
				if (aId > bId) {
					return 1;
				}
				return 0;
			});
	}).get();

	const queries = useMemo(() => {
		return Object.values(state.notebooks);
	}, [state.notebooks]);

	const cells = useMemo(() => {
		const cells = [];

		Object.values(state.notebooks).forEach((query) => {
			Object.values(query.cells).forEach((cell) => {
				cells.push(cell);
			});
		});

		return cells;
	}, [state.notebooks]);

	// Get the LLM Comparison Blocks
	// TODO: REMOVE DEAD CODE
	const comparisonBlocks = computed(() => {
		return [];
	}).get();

	/**
	 * Select options depending on variable type
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: comparisonBlocks intentionally omitted
	const selectOptions = useMemo((): {
		value: string;
		label: string;
		subtitle?: string;
		engineType?: string;
		engineSubtype?: string;
	}[] => {
		if (variableType === "block") {
			return inputBlocks.map((block) => ({
				value: block.id,
				label: block.id,
			}));
		} else if (variableType === "query") {
			return queries.map((q) => ({ value: q.id, label: q.id }));
		} else if (variableType === "LLM Comparison") {
			return comparisonBlocks.map((block) => ({
				value: block.id,
				label: block.id,
			}));
		} else if (variableType === "cell") {
			return cells.map((cell) => ({
				value: `${cell.query.id}.${cell.id}`,
				label: `${cell.query.id}--${cell.id}`,
			}));
		} else if (variableType === "model") {
			return engines.models.map((m) => ({
				value: m.engine_id,
				label: m.engine_name,
				subtitle: m.engine_id,
				engineType: m.engine_type,
				engineSubtype: m.engine_subtype,
			}));
		} else if (variableType === "database") {
			return engines.databases.map((m) => ({
				value: m.engine_id,
				label: m.engine_name,
				subtitle: m.engine_id,
				engineType: m.engine_type,
				engineSubtype: m.engine_subtype,
			}));
		} else if (variableType === "storage") {
			return engines.storages.map((m) => ({
				value: m.engine_id,
				label: m.engine_name,
				subtitle: m.engine_id,
				engineType: m.engine_type,
				engineSubtype: m.engine_subtype,
			}));
		} else if (variableType === "function") {
			return engines.functions.map((m) => ({
				value: m.engine_id,
				label: m.engine_name,
				subtitle: m.engine_id,
				engineType: m.engine_type,
				engineSubtype: m.engine_subtype,
			}));
		} else if (variableType === "vector") {
			return engines.vectors.map((m) => ({
				value: m.engine_id,
				label: m.engine_name,
				subtitle: m.engine_id,
				engineType: m.engine_type,
				engineSubtype: m.engine_subtype,
			}));
		}
		return [];
	}, [variableType, inputBlocks, queries, cells, engines]);

	const isEngineType = (type: string) =>
		["model", "database", "storage", "function", "vector"].includes(type);
	const isPointerType = (type: string) =>
		["block", "query", "cell", "LLM Comparison"].includes(type);

	// biome-ignore lint/correctness/useExhaustiveDependencies: isPointerType/isEngineType are stable
	const selectValue = useMemo(() => {
		if (isPointerType(variableType)) return variablePointer;
		if (isEngineType(variableType)) return engine?.engine_id ?? "";
		return "";
	}, [variableType, variablePointer, engine]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: complex memo with stable callbacks
	const input = useMemo(() => {
		if (variableType === "string") {
			return (
				<Input
					placeholder="Add Value"
					onChange={(e) =>
						setVariableInputValue(e.target.value.toString())
					}
					value={variableInputValue ?? ""}
				/>
			);
		} else if (variableType === "number") {
			return (
				<Input
					type="number"
					placeholder="Add Value"
					onChange={(e) => {
						setVariableInputValue(parseInt(e.target.value, 10));
					}}
					value={variableInputValue ?? ""}
				/>
			);
		} else if (variableType === "JSON" || variableType === "array") {
			const raw =
				typeof variableInputValue === "object" &&
				variableInputValue !== null
					? JSON.stringify(variableInputValue, null, 2)
					: ((variableInputValue as string | null) ?? "");
			let parseError: string | null = null;
			if (raw && raw.trim().length > 0) {
				try {
					const parsed = JSON.parse(raw);
					if (variableType === "array" && !Array.isArray(parsed)) {
						parseError = "Value must be a JSON array.";
					}
				} catch (e) {
					parseError =
						e instanceof Error ? e.message : "Invalid JSON.";
				}
			}
			return (
				<div className="flex flex-col gap-1.5">
					<div className="overflow-hidden rounded-md border border-input">
						<Suspense
							fallback={
								<div className="h-[200px] animate-pulse bg-muted" />
							}
						>
							<MonacoEditor
								width={"100%"}
								height={"200px"}
								language={"json"}
								options={{
									minimap: { enabled: false },
									scrollBeyondLastLine: false,
									fontSize: 13,
									lineNumbers: "on",
									tabSize: 2,
									automaticLayout: true,
								}}
								onChange={(newValue, _e) => {
									setVariableInputValue(newValue);
								}}
								value={raw}
							/>
						</Suspense>
					</div>
					{parseError && (
						<span className="text-destructive text-xs">
							{parseError}
						</span>
					)}
				</div>
			);
		} else if (variableType === "date") {
			return (
				<Input
					type="date"
					placeholder="Add Value"
					onChange={(e) =>
						setVariableInputValue(e.target.value.toString())
					}
					value={variableInputValue ?? ""}
				/>
			);
		} else if (variableType) {
			return (
				<Select
					disabled={!variableType || selectOptions.length === 0}
					value={selectValue}
					onValueChange={(val) => {
						if (isPointerType(variableType)) {
							setVariablePointer(val);
						} else if (isEngineType(variableType)) {
							const engineType =
								`${variableType}s` as keyof typeof engines;
							const found = (
								engines[engineType] as {
									engine_id: string;
									engine_name: string;
									engine_type: string;
									engine_subtype: string;
								}[]
							)?.find((e) => e.engine_id === val);
							if (found) setEngine(found);
						}
					}}
				>
					<SelectTrigger
						className="h-auto min-h-10 w-full py-2"
						style={
							variableType === "cell" ||
							variableType === "block" ||
							variableType === "query"
								? noLigatureStyle
								: undefined
						}
					>
						{isEngineType(variableType) && engine ? (
							<div className="flex min-w-0 items-center gap-2 text-left">
								{engine.engine_type ? (
									<EngineSubtypeIcon
										engineType={engine.engine_type}
										engineSubtype={engine.engine_subtype}
										alt={`${engine.engine_name} icon`}
										className="size-5 shrink-0 object-contain"
									/>
								) : (
									<TypeIcon
										type={variableType}
										className="size-5"
									/>
								)}
								<div className="flex min-w-0 flex-col items-start gap-0.5">
									<span className="truncate font-medium text-sm leading-tight">
										{engine.engine_name}
									</span>
									<span className="truncate text-muted-foreground text-xs leading-tight">
										{engine.engine_id}
									</span>
								</div>
							</div>
						) : (
							<SelectValue placeholder="Add Value" />
						)}
					</SelectTrigger>
					<SelectContent>
						{selectOptions.map((opt) =>
							opt.subtitle ? (
								<SelectItem key={opt.value} value={opt.value}>
									<div className="flex min-w-0 items-center gap-2">
										{opt.engineType ? (
											<EngineSubtypeIcon
												engineType={opt.engineType}
												engineSubtype={
													opt.engineSubtype
												}
												alt={`${opt.label} icon`}
												className="size-5 shrink-0 object-contain"
											/>
										) : (
											<TypeIcon
												type={variableType}
												className="size-5"
											/>
										)}
										<div className="flex min-w-0 flex-col items-start gap-0.5">
											<span className="truncate font-medium text-sm leading-tight">
												{opt.label}
											</span>
											<span className="truncate text-muted-foreground text-xs leading-tight">
												{opt.subtitle}
											</span>
										</div>
									</div>
								</SelectItem>
							) : (
								<SelectItem key={opt.value} value={opt.value}>
									<span style={noLigatureStyle}>
										{opt.label}
									</span>
								</SelectItem>
							),
						)}
						{selectOptions.length === 0 && (
							<SelectItem value="" disabled>
								No options
							</SelectItem>
						)}
					</SelectContent>
				</Select>
			);
		}
		return null;
	}, [variableType, variableInputValue, selectOptions, selectValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dep subset
	const preview = useMemo(() => {
		try {
			if (
				variableType &&
				(variablePointer || engine || variableInputValue)
			) {
				if (
					variableType === "block" ||
					variableType === "LLM Comparison"
				) {
					const block = state.getBlock(variablePointer);
					const s: SerializedState = {
						version: STATE_VERSION,
						executionOrder: [],
						variables: {},
						queries: {},
						blocks: {
							"page-1": {
								id: "page-1",
								widget: "page",
								parent: null,
								data: {
									style: {
										display: "flex",
										justifyContent: "center",
										alignItems: "center",
									},
								},
								listeners: {
									onPageLoad: {
										type: "sync",
										order: [],
									},
								},
								slots: {
									content: {
										name: "content",
										children: [variablePointer],
									},
								},
							},
							[variablePointer]: {
								id: block.id,
								widget: block.widget,
								data: block.data,
								parent: null,
								listeners: block.listeners,
								slots: block.slots,
							},
						},
					};

					return (
						<div className="relative w-full min-w-0 overflow-hidden">
							<Renderer state={s} />
						</div>
					);
				} else if (variableType === "query") {
					const notebook = state.getNotebook(variablePointer);

					if (notebook.output) {
						return (
							<div className="max-h-[275px] w-full overflow-auto">
								<span className="text-sm">
									{JSON.stringify(notebook.output)}
								</span>
							</div>
						);
					} else {
						return (
							<div className="flex items-center gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2.5">
								<AlertTriangle className="size-5 shrink-0 text-yellow-600" />
								<div className="flex flex-col">
									<span className="font-medium text-sm text-yellow-900">
										Not yet executed
									</span>
									<span className="text-xs text-yellow-800/80">
										Notebook {variablePointer} has no output
										yet.
									</span>
								</div>
							</div>
						);
					}
				} else if (variableType === "cell") {
					const notebook = state.getNotebook(
						splitAtPeriod(variablePointer, "left"),
					);

					const cell = notebook.getCell(
						splitAtPeriod(variablePointer, "right"),
					);

					if (cell.output) {
						const rawOutput = state
							.getNotebook(splitAtPeriod(variablePointer, "left"))
							.getCell(
								splitAtPeriod(variablePointer, "right"),
							).output;
						return (
							<div className="max-h-[275px] w-full overflow-auto">
								<span className="text-sm">
									{JSON.stringify(rawOutput)}
								</span>
							</div>
						);
					} else {
						return (
							<div className="flex items-center gap-3 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2.5">
								<AlertTriangle className="size-5 shrink-0 text-yellow-600" />
								<div className="flex flex-col">
									<span className="font-medium text-sm text-yellow-900">
										Not yet executed
									</span>
									<span className="text-xs text-yellow-800/80">
										Cell{" "}
										{splitAtPeriod(
											variablePointer,
											"right",
										)}{" "}
										has no output yet.
									</span>
								</div>
							</div>
						);
					}
				} else if (inputVariableTypeList.indexOf(variableType) > -1) {
					let value = null;
					value = isOutputJSON(variableInputValue);
					return (
						<JsonValueViewer
							value={value === null ? variableInputValue : value}
						/>
					);
				} else {
					return (
						<div className="relative left-1.5 flex flex-row items-center gap-2">
							<MoreHorizontal className="size-4 text-muted-foreground" />
							<div className="flex flex-col">
								<span className="text-sm">
									{engine?.engine_name}
								</span>
								<span className="text-muted-foreground text-xs">
									{engine?.engine_id}
								</span>
							</div>
						</div>
					);
				}
			}
		} catch (_e) {
			return <span className="text-sm">Value is undefined</span>;
		}
	}, [variableType, variablePointer, engine, variableInputValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional dep subset
	const addVariableDisabled = useMemo(() => {
		const hasRequiredFields = Boolean(
			variableType.length > 0 && variableName.length > 0,
		);

		const hasRequiredDependency = Boolean(
			engine || variablePointer.length > 0 || variableInputValue,
		);

		let isValid = null;

		// Disable the add button when adding in JSON / array incorrectly
		if (variableType === "JSON" || variableType === "array") {
			const checkValidJSON = Boolean(
				isOutputJSON(variableInputValue) != null,
			);
			isValid =
				hasRequiredFields && hasRequiredDependency && checkValidJSON;
		} else {
			isValid = hasRequiredFields && hasRequiredDependency;
		}
		let v: Variable | unknown;
		if (variable) {
			v = state.getVariable(variable.to, variable.type);
		}

		const hasChanges = variable
			? variable.id !== variableName ||
				variable.to !== variablePointer ||
				variable.type !== variableType ||
				variableInputValue !== v
			: true;

		return !isValid || !hasChanges || alreadyAliased;
	}, [
		variableType,
		variableName,
		engine,
		variablePointer,
		variableInputValue,
		alreadyAliased,
	]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only re-sync on variable change
	useEffect(() => {
		if (variable?.id) {
			setVariableName(variable.id);
			setVariableType(variable.type);

			if (
				variable.type !== "query" &&
				variable.type !== "block" &&
				variable.type !== "cell"
			) {
				const val = state.getVariable(
					variable.to,
					variable.type,
					null,
					null,
					variable.value ? variable.value : null,
				);

				if (inputVariableTypeList.includes(variable.type)) {
					setVariableInputValue(val);
				} else {
					const variableEngine = engines[`${variable.type}s`]
						? engines[`${variable.type}s`].find(
								(engineValue) => engineValue.engine_id === val,
							)
						: null;
					if (variableEngine) {
						setEngine(variableEngine);
					}
				}
			} else {
				if (variable.type === "cell") {
					setVariablePointer(`${variable.to}.${variable.cellId}`);
				} else {
					setVariablePointer(variable.to);
				}
			}
		}
	}, [variable]);

	const handleClose = () => {
		setVariablePointer("");
		setVariableName("");
		setEngine(null);
		setVariableType("");
		onClose();
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="w-[calc(100vw-2rem)] max-w-md overflow-hidden sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle className="font-medium text-xl">
						{variable ? "Edit" : "Create"} Variable
					</DialogTitle>
				</DialogHeader>

				<div className="-mx-1 flex max-h-[60vh] flex-col gap-2 overflow-y-auto px-1">
					{variable && affectedRefs.length > 0 && (
						<div className="rounded-md border border-border bg-muted/30 px-3 py-2">
							<div className="font-medium text-xs">
								{affectedRefs.length}{" "}
								{affectedRefs.length === 1
									? "reference"
									: "references"}{" "}
								across {affectedSourceCount}{" "}
								{affectedSourceCount === 1
									? "location"
									: "locations"}{" "}
								to{" "}
								<span
									className="font-mono"
									style={noLigatureStyle}
								>
									{`{{${variable.id}}}`}
								</span>
								. Renaming rewrites all of these in place;
								changing type or pointer keeps the alias but
								makes them resolve to a different value.
							</div>
							<ul className="mt-1.5 flex max-h-40 flex-col gap-1 overflow-y-auto text-xs">
								{affectedRefs.map((hit) => (
									<li
										key={hit.key}
										className="flex flex-col gap-0.5 rounded border border-border/60 bg-background px-2 py-1.5"
									>
										<div className="flex items-center gap-1.5">
											<span className="inline-flex items-center rounded bg-primary/10 px-1 py-0.5 font-medium text-[9px] text-primary uppercase tracking-wider">
												{hit.kind}
											</span>
											<span
												className="font-medium font-mono"
												style={noLigatureStyle}
											>
												{hit.sourceLabel}
											</span>
											<span className="inline-flex items-center rounded bg-muted px-1 py-0.5 font-medium text-[9px] text-muted-foreground uppercase tracking-wider">
												{hit.widget}
											</span>
											<span
												className="truncate font-mono text-[10px] text-muted-foreground"
												style={noLigatureStyle}
											>
												{hit.pathLabel}
											</span>
										</div>
										<code
											className="block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] text-muted-foreground"
											style={noLigatureStyle}
										>
											{hit.snippet}
										</code>
									</li>
								))}
							</ul>
						</div>
					)}
					{variable &&
						affectedRefs.length > 0 &&
						typeOrPointerChanged && (
							<Alert variant="destructive">
								<AlertTriangle className="size-4" />
								<AlertTitle>
									This will affect {affectedSourceCount}{" "}
									{affectedSourceCount === 1
										? "location"
										: "locations"}
								</AlertTitle>
								<AlertDescription>
									You're changing the type or what this
									variable points to. The references above
									will keep working but will silently resolve
									to a different value (or wrong type).
								</AlertDescription>
							</Alert>
						)}
					<div className="flex flex-col gap-3 pt-1">
						<div className="flex flex-col gap-1.5">
							<Label>Variable Name</Label>
							<Input
								placeholder="Name"
								value={variableName}
								aria-invalid={alreadyAliased}
								onChange={(e) => {
									setVariableName(e.target.value);
								}}
							/>
							{alreadyAliased && (
								<span className="text-destructive text-xs">
									This is not a unique alias
								</span>
							)}
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Type</Label>
							<Select
								value={variableType}
								onValueChange={(val) => {
									setEngine(null);
									setVariableInputValue(null);
									setVariablePointer("");
									setVariableType(val as VariableType);
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select Type">
										{variableType && (
											<div className="flex items-center gap-2">
												<TypeIcon
													type={variableType}
													className="size-4"
												/>
												<span>
													{getVariableTypeLabel(
														variableType,
													)}
												</span>
											</div>
										)}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{VARIABLE_TYPES.map((val) => (
										<SelectItem key={val} value={val}>
											<div className="flex items-center gap-2">
												<TypeIcon
													type={val}
													className="size-4"
												/>
												<span>
													{getVariableTypeLabel(val)}
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Value</Label>
							{input}
						</div>
						<div className="-mx-6 border-border/60 border-t bg-muted/30 px-6 pt-3 pb-3">
							<button
								type="button"
								className="flex items-center gap-1.5 font-medium text-primary text-sm hover:text-primary/80"
								onClick={() => setShowPreview(!showPreview)}
							>
								<Eye className="size-4" />
								<span>
									{showPreview
										? "Hide preview"
										: "Show preview"}
								</span>
							</button>
							{showPreview && (
								<div className="mt-3 rounded-md border border-border bg-background p-3">
									{preview ?? (
										<span className="text-muted-foreground text-sm">
											Pick a type and a value to see a
											preview.
										</span>
									)}
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="flex justify-end gap-2 pt-2">
					<Button variant="outline" onClick={handleClose}>
						Cancel
					</Button>
					<Button
						disabled={addVariableDisabled}
						onClick={async () => {
							// Refactor this
							if (variableType) {
								if (variable) {
									const aliasChanged =
										variable.id !== variableName;
									if (aliasChanged) {
										rewriteVariableReferences(
											state,
											variable.id,
											variableName,
											affectedRefs,
										);
									}

									state.dispatch({
										message: ActionMessages.EDIT_VARIABLE,
										payload: {
											id: variableName,
											from: variable,
											to:
												variableType === "cell"
													? {
															to: splitAtPeriod(
																variablePointer,
																"left",
															),
															type: variableType,
															cellId: splitAtPeriod(
																variablePointer,
																"right",
															),
														}
													: {
															to: variablePointer,
															type: variableType,
															value: engine
																? engine.engine_id
																: variableType ===
																			"array" ||
																		variableType ===
																			"JSON"
																	? JSON.parse(
																			variableInputValue,
																		)
																	: variableInputValue,
														},
										},
									});

									if (
										aliasChanged &&
										affectedRefs.length > 0
									) {
										toast.success(
											`Renamed ${variable.id} → ${variableName} and updated ${affectedRefs.length} ${
												affectedRefs.length === 1
													? "reference"
													: "references"
											}. Remember to save your app.`,
										);
									} else {
										toast.success(
											`Successfully edited ${variable.id}, remember to save your app.`,
										);
									}
									onClose();
								} else {
									console.warn(
										`Adding variable ${variableName}`,
									);

									const success = state.dispatch({
										message: ActionMessages.ADD_VARIABLE,
										payload:
											variableType === "cell"
												? {
														id: variableName,
														to: splitAtPeriod(
															variablePointer,
															"left",
														),
														type: variableType,
														cellId: splitAtPeriod(
															variablePointer,
															"right",
														),
													}
												: {
														id: variableName,
														to: variablePointer,
														type: variableType,
														value: engine
															? engine.engine_id
															: variableType ===
																		"array" ||
																	variableType ===
																		"JSON"
																? JSON.parse(
																		variableInputValue,
																	)
																: variableInputValue,
													},
									});

									if (success) {
										toast.success(
											`Successfully added ${variableName}, remember to save your app.`,
										);
									} else {
										toast.error(
											`Unable to create ${variableName}`,
										);
									}
									onClose();
								}
							}
						}}
					>
						{variable ? "Save" : "Add"}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
});
