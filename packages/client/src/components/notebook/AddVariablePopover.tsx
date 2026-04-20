import { X as Close, MoreHorizontal as MoreSharp, AlertTriangle as WarningRounded } from "lucide-react";
import { JsonViewer } from "@textea/json-viewer";
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
import { MonacoEditor } from "@semoss/shared";
import {
	Alert,
	AlertTitle,
	Button,
	Dialog,
	DialogContent,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	toast,
} from "@semoss/ui/next";
import PreviewButton from "../../assets/img/PreviewRounded.png";
// TODO: MOVE TO SDK/UTILITY LIB
import {
	capitalizeFirstLetter,
	isOutputJSON,
	splitAtPeriod,
} from "../../utility";

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
	 * El the popover is tied to
	 */
	anchorEl: Element;

	/**
	 * Do we want edit variable
	 */
	variable?: VariableWithId;

	/**
	 * Engines
	 */
	engines: {
		models: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		databases: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		storages: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		functions: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
		vectors: {
			app_id: string;
			app_name: string;
			app_type: string;
			app_subtype: string;
		}[];
	};
}
export const AddVariablePopover = observer((props: AddVariablePopoverProps) => {
	const { open, anchorEl, onClose, variable, engines } = props;
	const { state } = useBlocks();
	const notification = {
		add: ({ color, message }: { color: string; message: string }) => {
			if (color === "success") toast.success(message);
			else if (color === "error") toast.error(message);
			else if (color === "warning") toast.warning(message);
			else toast(message);
		},
	};

	const [variableName, setVariableName] = useState("");
	const [variableType, setVariableType] = useState<VariableType | "">("");
	const [variablePointer, setVariablePointer] = useState("");
	const [engine, setEngine] = useState<{
		app_id: string;
		app_name: string;
		app_type: string;
		app_subtype;
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
	 * Select Box on different constants to tie to
	 */
	const values = useMemo(() => {
		if (variableType === "block") {
			return inputBlocks.map((block) => {
				return (
					<SelectItem key={block.id} value={block.id}>
						{block.id}
					</SelectItem>
				);
			});
		} else if (variableType === "query") {
			return queries.map((q) => {
				return (
					<SelectItem key={q.id} value={q.id}>
						{q.id}
					</SelectItem>
				);
			});
		} else if (variableType === "LLM Comparison") {
			return comparisonBlocks.map((block) => {
				return (
					<SelectItem key={block.id} value={block.id}>
						{block.id}
					</SelectItem>
				);
			});
		} else if (variableType === "cell") {
			return cells.map((cell) => {
				return (
					<SelectItem
						key={cell.id}
						value={`${cell.query.id}.${cell.id}`}
					>
						{cell.query.id} - {cell.id}
					</SelectItem>
				);
			});
		} else if (variableType === "model") {
			return engines.models.map((model) => {
				return (
					<SelectItem key={model.app_id} value={model.app_id}>
						{model.app_name}
					</SelectItem>
				);
			});
		} else if (variableType === "database") {
			return engines.databases.map((model) => {
				return (
					<SelectItem key={model.app_id} value={model.app_id}>
						{model.app_name}
					</SelectItem>
				);
			});
		} else if (variableType === "storage") {
			return engines.storages.map((model) => {
				return (
					<SelectItem key={model.app_id} value={model.app_id}>
						{model.app_name}
					</SelectItem>
				);
			});
		} else if (variableType === "function") {
			return engines.functions.map((model) => {
				return (
					<SelectItem key={model.app_id} value={model.app_id}>
						{model.app_name}
					</SelectItem>
				);
			});
		} else if (variableType === "vector") {
			return engines.vectors.map((model) => {
				return (
					<SelectItem key={model.app_id} value={model.app_id}>
						{model.app_name}
					</SelectItem>
				);
			});
		} else {
			return null;
		}
	}, [variableType]);

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
						setVariableInputValue(parseInt(e.target.value));
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
		} else {
			const isPointerType =
				variableType === "cell" ||
				variableType === "query" ||
				variableType === "block" ||
				variableType === "LLM Comparison";
			const currentValue = isPointerType
				? variablePointer
				: (engine?.app_id ?? "");
			return (
				<Select
					disabled={!variableType}
					value={currentValue || undefined}
					onValueChange={(val) => {
						if (isPointerType) {
							setVariablePointer(val);
						} else {
							const engineMap: Record<string, typeof engines.models> = {
								model: engines.models,
								database: engines.databases,
								storage: engines.storages,
								function: engines.functions,
								vector: engines.vectors,
							};
							const list = engineMap[variableType] || [];
							const found = list.find((e) => e.app_id === val);
							if (found) setEngine(found);
						}
					}}
				>
					<SelectTrigger className="h-9">
						<SelectValue placeholder="Add Value" />
					</SelectTrigger>
					<SelectContent>
						{values}
					</SelectContent>
				</Select>
			);
		}
	}, [variableType, variableInputValue, variablePointer, engine]);

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
						<div>
							<Renderer state={s} />
						</div>
					);
				} else if (variableType === "query") {
					const query = state.getQuery(variablePointer);

					if (query.output) {
						return (
							<div className="max-h-[275px] w-full overflow-auto">
								<p className="text-sm">
									{JSON.stringify(query.output)}
								</p>
							</div>
						);
					} else {
						return (
							<Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
								<WarningRounded className="h-4 w-4" />
								<AlertTitle>
									Sheet {variablePointer} has not been
									executed. Click &apos;Run All&apos; in order
									to preview output.
								</AlertTitle>
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
								<p className="text-sm">
									{JSON.stringify(rawOutput)}
								</p>
							</div>
						);
					} else {
						return (
							<Alert className="border-yellow-300 bg-yellow-50 text-yellow-800">
								<WarningRounded className="h-4 w-4" />
								<AlertTitle>
									Cell{" "}
									{splitAtPeriod(variablePointer, "right")}{" "}
									has not been executed. Click &apos;Run
									All&apos; in order to preview output.
								</AlertTitle>
							</Alert>
						);
					}
				} else if (inputVariableTypeList.indexOf(variableType) > -1) {
					let value = null;
					value = isOutputJSON(variableInputValue);
					return (
						<JsonViewer
							value={value === null ? variableInputValue : value}
							displayDataTypes={true}
							displaySize={true}
							displayComma={true}
							rootName={false}
						/>
					);
				} else {
					return (
						<div className="relative left-1.5 flex flex-row items-center">
							<MoreSharp className="h-5 w-5" />
							<div className="flex flex-col">
								<span style={{ color: "#212121", fontSize: "16px", fontWeight: 400, lineHeight: "24px", letterSpacing: "0.15px" }}>
									{engine.app_name}
								</span>
								<span style={{ color: "#666", fontSize: "14px", fontWeight: 400, lineHeight: "21px", letterSpacing: "0.17px" }}>
									{engine.app_id}
								</span>
							</div>
						</div>
					);
				}
			} else if (
				variableType &&
				(engine || variablePointer || variableInputValue)
			) {
				return <div className="h-[10vh] w-full" />;
			}
		} catch (_e) {
			return (
				<p className="text-sm">Value is undefined</p>
			);
		}
	}, [variableType, variablePointer, engine, variableInputValue]);

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
								(engineValue) => engineValue.app_id === val,
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

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					setVariablePointer("");
					setVariableName("");
					setEngine(null);
					setVariableType("");
					onClose();
				}
			}}
		>
			<DialogContent className="max-w-[480px] p-0">
				<div
					className="add-variable-popover__content flex w-[444px] max-h-[90vh] flex-col overflow-hidden"
				>
					<div className="flex flex-row items-center justify-between px-4 py-2 gap-2">
						<span style={{ color: "#212121", fontSize: "20px", fontWeight: 500, lineHeight: "160%" }}>
							{variable ? "Edit" : "Create"} Variable
						</span>
						<button
							type="button"
							className="p-1 rounded hover:bg-accent border-none bg-transparent cursor-pointer"
							onClick={() => onClose()}
						>
							<Close className="h-5 w-5" />
						</button>
					</div>
					<div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
						{variable && (
							<Alert className="mx-4 border-yellow-300 bg-yellow-50 text-yellow-800">
								<WarningRounded className="h-4 w-4" />
								<AlertTitle>
									If this variable is actively being used, editing
									it may result in errors throughout your sheets.
								</AlertTitle>
							</Alert>
						)}
						<div className="flex flex-col mt-2 gap-2">
							<div className="flex flex-col px-4 py-2 gap-2">
								<span style={{ color: "#666", fontSize: "14px", fontWeight: 400, lineHeight: "143%" }}>
									Variable Name
								</span>
								<div>
									<Input
										placeholder="Name"
										value={variableName}
										aria-invalid={alreadyAliased}
										className={alreadyAliased ? "border-destructive" : ""}
										onChange={(e) => {
											setVariableName(e.target.value);
										}}
									/>
									{alreadyAliased && (
										<p className="text-xs text-destructive mt-1">
											This is not a unique alias
										</p>
									)}
								</div>
							</div>
							<div className="flex flex-col px-4 py-2 gap-2">
								<span style={{ color: "#666", fontSize: "14px", fontWeight: 400, lineHeight: "143%" }}>
									Type
								</span>
								<Select
									value={variableType || undefined}
									onValueChange={(val) => {
										const typedVal = val as VariableType;
										setEngine(null);
										setVariableInputValue(null);
										setVariablePointer("");
										setVariableType(typedVal);
									}}
								>
									<SelectTrigger className="h-9">
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
							<div className="flex flex-col px-4 py-2 gap-2">
								<span style={{ color: "#666", fontSize: "14px", fontWeight: 400, lineHeight: "143%" }}>
									Value
								</span>
								{input}
							</div>
							<div
								className="flex flex-col px-4 py-2 gap-2"
								style={{ background: showPreview ? "#F5F9FE" : "none" }}
							>
								<button
									type="button"
									className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 w-full justify-start"
									style={{ color: "#0471F0", fontSize: "14px", fontWeight: 500, lineHeight: "24px", letterSpacing: "0.4px" }}
									onClick={() => setShowPreview(!showPreview)}
								>
									<img
										src={PreviewButton}
										alt="Expand/Collapse"
										style={{ width: 20, height: 20 }}
									/>
									<span className="relative top-px">Preview</span>
								</button>
							</div>
							<div className="px-4 py-2 gap-2">
								{showPreview && preview}
							</div>
						</div>
					</div>
					<div className="flex flex-row justify-end px-4 py-2">
						<Button
							variant="ghost"
							onClick={() => onClose()}
							style={{ color: "#212121", fontFamily: "Inter", fontSize: "14px", fontWeight: 500, lineHeight: "24px", letterSpacing: "0.4px" }}
						>
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
																	? engine.app_id
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

										notification.add({
											color: "success",
											message: `Successfully editted ${variable.id}, remember to save your app.`,
										});
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
																? engine.app_id
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

										notification.add({
											color: success ? "success" : "error",
											message: success
												? `Successfully added ${variableName}, remember to save your app.`
												: `Unable to create ${variableName}`,
										});
										onClose();
									}
								}
							}}
						>
							{variable ? "Save" : "Add"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
});
