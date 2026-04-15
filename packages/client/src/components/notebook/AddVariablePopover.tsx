import { Close, MoreSharp, WarningRounded } from "@mui/icons-material";
import { JsonViewer } from "@textea/json-viewer";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
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
// import { MonacoEditor } from "@semoss/shared/monaco";
import {
	Alert,
	Box,
	Button,
	Icon,
	IconButton,
	Popover,
	Select,
	Stack,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import PreviewButton from "../../assets/img/PreviewRounded.png";
// TODO: MOVE TO SDK/UTILITY LIB
import {
	capitalizeFirstLetter,
	isOutputJSON,
	splitAtPeriod,
} from "../../utility";

const StyledPlaceholder = styled("div")(() => ({
	height: "10vh",
	width: "100%",
}));

const StyledStack = styled(Stack)(() => ({
	width: "444px",
	"& .MuiStack-root": {
		marginTop: "0px",
		gap: "0px",
	},
}));

const StyledPopover = styled(Popover)(({ theme }) => ({
	padding: theme.spacing(2),
	marginLeft: theme.spacing(2),
	"& .MuiPopover-paper": {
		maxWidth: "none",
		borderRadius: "12px",
		maxHeight: "none",
	},
	width: "444px",
	height: "396px",
	left: "10px",
	position: "absolute",
}));

const QueryPreviewContainer = styled(Stack)(() => ({
	maxHeight: "275px",
	width: "100%",
	overflow: "auto",
}));

const _StyledImg = styled("img")(({ theme }) => ({
	maxWidth: theme.spacing(5),
}));

const StyledTypography = styled(Typography)(() => ({
	color: "#212121",
	fontSize: "20px",
	fontWeight: "500",
	lineHeight: "160%",
}));

const StyledStackVariable = styled(Stack)(() => ({
	padding: "8px 16px",
	gap: "8px",
	"& .MuiStack-root": {
		marginTop: "0px",
	},
}));

const StyledTypographyVariable = styled(Typography)(() => ({
	color: "#666",
	fontSize: "14px",
	fontWeight: "400",
	lineHeight: "143%",
}));

const StyledButtonPreview = styled(Button)(() => ({
	color: "#0471F0",
	fontSize: "14px",
	fontWeight: "500",
	lineHeight: "24px",
	letterSpacing: "0.4px",
	bottom: "8px",
	minWidth: "auto",
	display: "flex",
	gap: "6px",
	alignItems: "center",
	justifyContent: "flex-start",
	whiteSpace: "nowrap",
	svg: {
		display: "inline-block",
		verticalAlign: "middle",
	},
	span: {
		display: "inline-block",
	},
	width: "100%",
	"& .MuiButton-startIcon, & .MuiButton-label, & > span": {
		display: "inline-flex !important",
		alignItems: "center",
		gap: "8px !important",
	},
	top: "1px",
}));

const StyledStackFooter = styled(Stack)(() => ({
	padding: "8px 16px",
}));

const StyledTypographyName = styled(Typography)(() => ({
	color: "#212121",
	fontSize: "16px",
	fontWeight: "400",
	lineHeight: "24px",
	letterSpacing: "0.15px",
}));

const StyledTypographyId = styled(Typography)(() => ({
	color: "#666",
	fontSize: "14px",
	fontWeight: "400",
	lineHeight: "21px",
	letterSpacing: "0.17px",
}));

const StyledStackModel = styled(Stack)(() => ({
	position: "relative",
	left: "6px",
}));

const StyledSpan = styled("span")(() => ({
	color: "#999",
}));

const StyledPreviewSpan = styled("span")(() => ({
	position: "relative",
	top: "1px",
}));

const StyledCancelButton = styled(Button)(() => ({
	color: "#212121",
	fontFamily: "Inter",
	fontSize: "14px",
	fontWeight: "500",
	lineHeight: "24px",
	letterSpacing: "0.4px",
}));

const StyledLabelBox = styled(Box)(() => ({
	"& .MuiFormLabel-root.MuiInputLabel-root": {
		top: "6px",
	},
}));

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

const MonacoEditor = lazy(() =>
	import("@semoss/shared/monaco").then((module) => module.MonacoEditor),
);

export const AddVariablePopover = observer((props: AddVariablePopoverProps) => {
	const { open, anchorEl, onClose, variable, engines } = props;
	const { state } = useBlocks();
	const notification = useNotification();

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
	//biome-ignore lint/correctness/useExhaustiveDependencies: keeping dependencies for functionality
	const values = useMemo(() => {
		if (variableType === "block") {
			return inputBlocks.map((block) => {
				return (
					<Select.Item key={block.id} value={block.id}>
						<Typography variant="caption">{block.id}</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "query") {
			return queries.map((q) => {
				return (
					<Select.Item key={q.id} value={q.id}>
						<Typography variant="caption">{q.id}</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "LLM Comparison") {
			return comparisonBlocks.map((block) => {
				return (
					<Select.Item key={block.id} value={block.id}>
						<Typography variant="caption">{block.id}</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "cell") {
			return cells.map((cell) => {
				return (
					<Select.Item
						key={cell.id}
						value={`${cell.query.id}.${cell.id}`}
					>
						<Typography variant="caption">
							{cell.query.id} - {cell.id}
						</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "model") {
			return engines.models.map((model) => {
				return (
					<Select.Item key={model.app_id} value={model}>
						<Typography variant="caption">
							{model.app_name}
						</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "database") {
			return engines.databases.map((model) => {
				return (
					<Select.Item key={model.app_id} value={model}>
						<Typography variant="caption">
							{model.app_name}
						</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "storage") {
			return engines.storages.map((model) => {
				return (
					<Select.Item key={model.app_id} value={model}>
						<Typography variant="caption">
							{model.app_name}
						</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "function") {
			return engines.functions.map((model) => {
				return (
					<Select.Item key={model.app_id} value={model}>
						<Typography variant="caption">
							{model.app_name}
						</Typography>
					</Select.Item>
				);
			});
		} else if (variableType === "vector") {
			return engines.vectors.map((model) => {
				return (
					<Select.Item key={model.app_id} value={model}>
						<Typography variant="caption">
							{model.app_name}
						</Typography>
					</Select.Item>
				);
			});
		} else {
			return <Select.Item value="">No options</Select.Item>;
		}
	}, [variableType]);
	//biome-ignore lint/correctness/useExhaustiveDependencies: keeping dependencies for functionality
	const input = useMemo(() => {
		if (variableType === "string") {
			return (
				<TextField
					placeholder={"Add Value"}
					variant="outlined"
					size="small"
					onChange={(e) =>
						setVariableInputValue(e.target.value.toString())
					}
					value={variableInputValue}
				/>
			);
		} else if (variableType === "number") {
			return (
				<TextField
					variant="outlined"
					type="number"
					size="small"
					placeholder="Add Value"
					onChange={(e) => {
						//biome-ignore lint/correctness/useParseIntRadix: keeping parseint for getting integer value
						setVariableInputValue(parseInt(e.target.value));
					}}
					value={variableInputValue}
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
				<TextField
					type="date"
					variant="outlined"
					size="small"
					placeholder="Add Value"
					onChange={(e) =>
						setVariableInputValue(e.target.value.toString())
					}
					value={variableInputValue}
				/>
			);
		} else {
			return (
				<Select
					disabled={!variableType}
					size="small"
					value={
						variableType === "cell" ||
						variableType === "query" ||
						variableType === "block" ||
						variableType === "LLM Comparison"
							? variablePointer
							: (engine ?? "")
					}
					SelectProps={{
						displayEmpty: true,
						renderValue: (value) => {
							if (!value || value === "") {
								return <StyledSpan>Add Value</StyledSpan>;
							}
							if (
								variableType === "cell" ||
								variableType === "query" ||
								variableType === "block" ||
								variableType === "LLM Comparison"
							) {
								return String(value);
							}
							const eng =
								(value as { app_name?: string }) || engine;
							return eng?.app_name ?? String(eng);
						},
					}}
					onChange={(e) => {
						const val = e.target.value as unknown;
						if (
							variableType === "cell" ||
							variableType === "query" ||
							variableType === "block" ||
							variableType === "LLM Comparison"
						) {
							setVariablePointer(val as string);
						} else {
							setEngine(
								val as {
									app_id: string;
									app_name: string;
									app_type: string;
									app_subtype: string;
								},
							);
						}
					}}
				>
					{values}
				</Select>
			);
		}
	}, [variableType, variableInputValue, variablePointer, engine]);
	//biome-ignore lint/correctness/useExhaustiveDependencies: keeping dependencies for functionality
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
						<StyledLabelBox>
							<Renderer state={s} />
						</StyledLabelBox>
					);
				} else if (variableType === "query") {
					const query = state.getQuery(variablePointer);

					if (query.output) {
						return (
							<QueryPreviewContainer>
								<Typography variant={"body2"}>
									{JSON.stringify(query.output)}
								</Typography>
							</QueryPreviewContainer>
						);
					} else {
						return (
							<Alert severity="warning" icon={<WarningRounded />}>
								<Alert.Title>
									Sheet {variablePointer} has not been
									executed. Click &apos;Run All&apos; in order
									to preview output.
								</Alert.Title>
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
							<QueryPreviewContainer>
								<Typography variant={"body2"}>
									{JSON.stringify(rawOutput)}
								</Typography>
							</QueryPreviewContainer>
						);
					} else {
						return (
							<Alert severity="warning" icon={<WarningRounded />}>
								<Alert.Title>
									Cell{" "}
									{splitAtPeriod(variablePointer, "right")}{" "}
									has not been executed. Click &apos;Run
									All&apos; in order to preview output.
								</Alert.Title>
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
						<StyledStackModel direction="row" alignItems="center">
							<Icon>
								<MoreSharp />
							</Icon>
							<Stack direction="column">
								<StyledTypographyName variant="body2">
									{engine.app_name}
								</StyledTypographyName>
								<StyledTypographyId variant="body2">
									{engine.app_id}
								</StyledTypographyId>
							</Stack>
						</StyledStackModel>
					);
				}
			} else if (
				(variableType && engine) ||
				(variableType && variablePointer) ||
				(variableType && variableInputValue)
			) {
				return <StyledPlaceholder />;
			}
		} catch (_e) {
			return (
				<Typography variant={"body2"}>Value is undefined</Typography>
			);
		}
	}, [variableType, variablePointer, engine, variableInputValue]);
	//biome-ignore lint/correctness/useExhaustiveDependencies: keeping dependencies for functionality
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
	//biome-ignore lint/correctness/useExhaustiveDependencies: keeping dependencies for functionality
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
		<StyledPopover
			marginThreshold={60}
			id={"variable-popover"}
			open={open}
			onClose={() => {
				setVariablePointer("");
				setVariableName("");
				setEngine(null);
				setVariableType("");

				onClose();
			}}
			anchorOrigin={{
				vertical: "center",
				horizontal: "right",
			}}
			transformOrigin={{
				vertical: "bottom",
				horizontal: "left",
			}}
			anchorEl={anchorEl}
		>
			<StyledStack
				direction={"column"}
				className="add-variable-popover__content max-h-[90vh] overflow-hidden"
			>
				<StyledStackVariable
					direction="row"
					justifyContent={"space-between"}
					alignItems={"center"}
				>
					<StyledTypography variant={"h6"}>
						{variable ? "Edit" : "Create"} Variable
					</StyledTypography>
					<IconButton
						size="small"
						onClick={() => {
							onClose();
						}}
					>
						<Close />
					</IconButton>
				</StyledStackVariable>
				<div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
					{variable && (
						<Alert icon={<WarningRounded />} severity={"warning"}>
							<Alert.Title>
								If this variable is actively being used, editing
								it may result in errors throughout your sheets.
							</Alert.Title>
						</Alert>
					)}
					<Stack direction="column" mt={1} gap={1}>
						<StyledStackVariable direction="column">
							<StyledTypographyVariable variant={"body2"}>
								Variable Name
							</StyledTypographyVariable>
							<TextField
								placeholder={"Name"}
								value={variableName}
								error={alreadyAliased}
								onChange={(e) => {
									setVariableName(e.target.value);
								}}
								size="small"
								helperText={
									alreadyAliased ? (
										<Typography
											variant={"caption"}
											color={"error"}
										>
											This is not a unique alias
										</Typography>
									) : (
										""
									)
								}
							/>
						</StyledStackVariable>
						<StyledStackVariable direction="column">
							<StyledTypographyVariable variant={"body2"}>
								Type
							</StyledTypographyVariable>
							<Select
								value={variableType}
								onChange={(e) => {
									const val = e.target.value as VariableType;
									setEngine(null);
									setVariableInputValue(null);
									setVariablePointer("");
									setVariableType(val);
								}}
								SelectProps={{
									displayEmpty: true,
									renderValue: (value) => {
										console.log(value, "value");
										if (!value || value === "") {
											return (
												<StyledSpan>
													Select Type
												</StyledSpan>
											);
										}
										return capitalizeFirstLetter(
											value as string,
										);
									},
								}}
								size="small"
							>
								{VARIABLE_TYPES.map((val) => {
									return (
										<Select.Item key={val} value={val}>
											{capitalizeFirstLetter(val)}
										</Select.Item>
									);
								})}
							</Select>
						</StyledStackVariable>
						<StyledStackVariable direction="column">
							<StyledTypographyVariable variant={"body2"}>
								Value
							</StyledTypographyVariable>
							{input}
						</StyledStackVariable>
						<StyledStackVariable
							direction="column"
							sx={{
								background: showPreview ? "#F5F9FE" : "none",
							}}
						>
							<StyledButtonPreview
								onClick={() => setShowPreview(!showPreview)}
							>
								<img
									src={PreviewButton}
									alt="Expand/Collapse"
									style={{
										width: 20,
										height: 20,
									}}
								/>
								<StyledPreviewSpan>Preview</StyledPreviewSpan>
							</StyledButtonPreview>
						</StyledStackVariable>
						<StyledStackVariable>
							{showPreview && preview}
						</StyledStackVariable>
					</Stack>
				</div>
				<StyledStackFooter
					direction={"row"}
					justifyContent={"flex-end"}
				>
					<StyledCancelButton
						variant={"text"}
						onClick={() => {
							onClose();
						}}
					>
						Cancel
					</StyledCancelButton>
					<Button
						color="primary"
						variant={"contained"}
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

									// else {
									//     const id = await state.dispatch({
									//         message:
									//             ActionMessages.ADD_DEPENDENCY,
									//         payload: {
									//             id: engine
									//                 ? engine.app_id
									//                 : variableType ===
									//                       'array' ||
									//                   variableType === 'JSON'
									//                 ? JSON.parse(
									//                       variableInputValue,
									//                   )
									//                 : variableInputValue,
									//             type: variableType,
									//         },
									//     });

									//     state.dispatch({
									//         message:
									//             ActionMessages.EDIT_VARIABLE,
									//         payload: {
									//             id: variableName,
									//             from: variable,
									//             to: {
									//                 to: id,
									//                 type: variableType,
									//             },
									//         },
									//     });
									// }

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
									// else {
									//     // Add dependency to reference
									//     const id = await state.dispatch({
									//         message:
									//             ActionMessages.ADD_DEPENDENCY,
									//         payload: {
									//             id: engine
									//                 ? engine.app_id
									//                 : variableType ===
									//                       'array' ||
									//                   variableType === 'JSON'
									//                 ? JSON.parse(
									//                       variableInputValue,
									//                   )
									//                 : variableInputValue,
									//             type: variableType,
									//         },
									//     });

									//     success = state.dispatch({
									//         message:
									//             ActionMessages.ADD_VARIABLE,
									//         payload: {
									//             id: variableName,
									//             to: id,
									//             type: variableType,
									//         },
									//     });

									//     if (!success) {
									//         state.dispatch({
									//             message:
									//                 ActionMessages.REMOVE_DEPENDENCY,
									//             payload: {
									//                 id: id,
									//             },
									//         });
									//     }
									// }

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
				</StyledStackFooter>
			</StyledStack>
		</StyledPopover>
	);
});
