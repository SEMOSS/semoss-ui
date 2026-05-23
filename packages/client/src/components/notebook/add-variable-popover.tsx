import {
	AlertTriangle,
	Archive,
	Bolt,
	Bot,
	Database,
	type LucideIcon,
	MoreHorizontal,
	Sigma,
	X,
} from "lucide-react";
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
import PreviewButton from "@/assets/img/PreviewRounded.png";
import { JsonValueViewer } from "@/components/common/json-value-viewer";
// TODO: MOVE TO SDK/UTILITY LIB
import {
	capitalizeFirstLetter,
	isOutputJSON,
	splitAtPeriod,
} from "../../utility";

const ENGINE_ICONS: Record<string, LucideIcon> = {
	model: Bot,
	database: Database,
	vector: Bolt,
	storage: Archive,
	function: Sigma,
};

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
	engines: {
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
	};
}
export const AddVariablePopover = observer((props: AddVariablePopoverProps) => {
	const { open, onClose, variable, engines } = props;
	const { state } = useBlocks();

	const [variableName, setVariableName] = useState("");
	const [variableType, setVariableType] = useState<VariableType | "">("");
	const [variablePointer, setVariablePointer] = useState("");
	const [engine, setEngine] = useState<{
		engine_id: string;
		engine_name: string;
		engine_type: string;
		engine_subtype;
	} | null>(null);
	const [showPreview, setShowPreview] = useState<boolean>(false);

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
		return Object.values(state.queries);
	}, [state.queries]);

	const cells = useMemo(() => {
		const cells = [];

		Object.values(state.queries).forEach((query) => {
			Object.values(query.cells).forEach((cell) => {
				cells.push(cell);
			});
		});

		return cells;
	}, [state.queries]);

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
				label: `${cell.query.id} - ${cell.id}`,
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
			return (
				<Suspense fallback={<>...</>}>
					<MonacoEditor
						width={"100%"}
						height={"10vh"}
						language={"json"}
						onChange={(newValue, _e) => {
							setVariableInputValue(newValue);
						}}
						value={
							typeof variableInputValue === "object"
								? JSON.stringify(variableInputValue)
								: variableInputValue
						}
					/>
				</Suspense>
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
					<SelectTrigger className="h-auto min-h-10 w-full py-2">
						{isEngineType(variableType) && engine ? (
							<div className="flex items-center gap-2 text-left">
								{engine.engine_type ? (
									<EngineSubtypeIcon
										engineType={engine.engine_type}
										engineSubtype={engine.engine_subtype}
										alt={`${engine.engine_name} icon`}
										className="size-5 shrink-0 object-contain"
									/>
								) : (
									(() => {
										const Icon = ENGINE_ICONS[variableType];
										return Icon ? (
											<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
										) : null;
									})()
								)}
								<div className="flex flex-col items-start gap-0.5">
									<span className="font-medium text-sm leading-tight">
										{engine.engine_name}
									</span>
									<span className="text-muted-foreground text-xs leading-tight">
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
									<div className="flex items-center gap-2">
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
											(() => {
												const Icon =
													ENGINE_ICONS[variableType];
												return Icon ? (
													<Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
												) : null;
											})()
										)}
										<div className="flex flex-col items-start gap-0.5">
											<span className="font-medium text-sm leading-tight">
												{opt.label}
											</span>
											<span className="text-muted-foreground text-xs leading-tight">
												{opt.subtitle}
											</span>
										</div>
									</div>
								</SelectItem>
							) : (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
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
						<div className="w-full">
							<Renderer state={s} />
						</div>
					);
				} else if (variableType === "query") {
					const query = state.getQuery(variablePointer);

					if (query.output) {
						return (
							<div className="max-h-[275px] w-full overflow-auto">
								<span className="text-sm">
									{JSON.stringify(query.output)}
								</span>
							</div>
						);
					} else {
						return (
							<Alert>
								<AlertTriangle className="size-4 text-yellow-600" />
								<AlertTitle>Not yet executed</AlertTitle>
								<AlertDescription>
									Sheet {variablePointer} has not been
									executed. Click &apos;Run All&apos; in order
									to preview output.
								</AlertDescription>
							</Alert>
						);
					}
				} else if (variableType === "cell") {
					const query = state.getQuery(
						splitAtPeriod(variablePointer, "left"),
					);

					const cell = query.getCell(
						splitAtPeriod(variablePointer, "right"),
					);

					if (cell.output) {
						const rawOutput = state
							.getQuery(splitAtPeriod(variablePointer, "left"))
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
							<Alert>
								<AlertTriangle className="size-4 text-yellow-600" />
								<AlertTitle>Not yet executed</AlertTitle>
								<AlertDescription>
									Cell{" "}
									{splitAtPeriod(variablePointer, "right")}{" "}
									has not been executed. Click &apos;Run
									All&apos; in order to preview output.
								</AlertDescription>
							</Alert>
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
			<DialogContent
				className="w-[444px] max-w-[444px]"
				showCloseButton={false}
			>
				<DialogHeader className="flex flex-row items-center justify-between pr-0">
					<DialogTitle className="font-medium text-xl">
						{variable ? "Edit" : "Create"} Variable
					</DialogTitle>
					<button
						type="button"
						className="rounded-sm opacity-70 hover:opacity-100"
						onClick={handleClose}
					>
						<X className="size-4" />
						<span className="sr-only">Close</span>
					</button>
				</DialogHeader>

				<div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
					{variable && (
						<Alert>
							<AlertTriangle className="size-4 text-yellow-600" />
							<AlertTitle>Warning</AlertTitle>
							<AlertDescription>
								If this variable is actively being used, editing
								it may result in errors throughout your sheets.
							</AlertDescription>
						</Alert>
					)}
					<div className="flex flex-col gap-3 pt-1">
						<div className="flex flex-col gap-1.5 px-4">
							<Label className="text-muted-foreground text-sm">
								Variable Name
							</Label>
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
						<div className="flex flex-col gap-1.5 px-4">
							<Label className="text-muted-foreground text-sm">
								Type
							</Label>
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
									<SelectValue placeholder="Select Type" />
								</SelectTrigger>
								<SelectContent>
									{VARIABLE_TYPES.map((val) => (
										<SelectItem key={val} value={val}>
											{capitalizeFirstLetter(val)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5 px-4">
							<Label className="text-muted-foreground text-sm">
								Value
							</Label>
							{input}
						</div>
						<div
							className={`flex flex-col gap-1.5 px-4 ${showPreview ? "bg-[#F5F9FE]" : ""}`}
						>
							<button
								type="button"
								className="flex items-center gap-1.5 font-medium text-[#0471F0] text-sm"
								onClick={() => setShowPreview(!showPreview)}
							>
								<img
									src={PreviewButton}
									alt="Expand/Collapse"
									className="h-5 w-5"
								/>
								<span>Preview</span>
							</button>
						</div>
						{showPreview && <div className="px-4">{preview}</div>}
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

									toast.success(
										`Successfully editted ${variable.id}, remember to save your app.`,
									);
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
