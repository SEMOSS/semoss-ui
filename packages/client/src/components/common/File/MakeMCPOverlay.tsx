import {
	DeleteOutlined,
	ExpandMore,
	RestoreFromTrash,
	UnfoldLess,
	UnfoldMore,
} from "@mui/icons-material";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Accordion,
	Box,
	Button,
	Checkbox,
	Chip,
	IconButton,
	List,
	Modal,
	Search,
	Select,
	Stepper,
	Switch,
	styled,
	Table,
	TextField,
	Typography,
} from "@semoss/ui";

// ==================== TYPES ====================

type PropertyDetails = {
	title?: string;
	description?: string;
	type?: string | string[];
	default?: string | number | boolean | Record<string, unknown> | unknown[];
};

type Tool = {
	name: string;
	title?: string;
	description?: string;
	inputSchema?: {
		properties?: Record<string, PropertyDetails>;
		required?: string[];
		title?: string;
		type?: string;
	};
	_meta?: {
		generated_on?: string;
	};
};

interface MakeMCPOverlayProps {
	tools: Record<string, unknown>[];
	onClose: (success: boolean) => void;
	handleToolsUpdate: (tools: Record<string, unknown>[]) => void;
	handleMCPEditSave: (tools: Record<string, unknown>[]) => void;
}

type CollapseState = Record<number, boolean>;
type ExpandedState = Record<number, string[]>;

// ==================== STYLED COMPONENTS ====================

const StyledModalContent = styled(Modal.Content)(() => ({
	maxHeight: "500px",
	display: "flex",
	flexDirection: "column",
	overflow: "hidden",
}));

const StyledFunctionListContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	height: "100%",
	border: `1px solid ${theme.palette.divider}`,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(2),
	overflow: "hidden",
}));

const StyledFunctionList = styled(List)(() => ({
	flex: 1,
	overflow: "auto",
	padding: 0,
	borderRadius: 4,
	marginTop: "8px",
	"& .MuiListItem-root": {
		padding: 0,
	},
}));

const StyledExpandMore = styled(ExpandMore)(({ theme }) => ({
	color: theme.palette.text.secondary,
}));

const StyledAccordionTrigger = styled(Accordion.Trigger)(({ theme }) => ({
	backgroundColor: theme.palette.primary.selected,
	borderTopLeftRadius: theme.shape.borderRadius,
	borderTopRightRadius: theme.shape.borderRadius,
}));

const StyledStepperContainer = styled(Box)(({ theme }) => ({
	marginTop: theme.spacing(2),
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	flexShrink: 0,
}));

const StyledContentWrapper = styled(Box)(({ theme }) => ({
	marginTop: theme.spacing(2),
	flex: 1,
	overflow: "auto",
	minHeight: 0,
}));

const StyledParameterBox = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	gap: "4px",
}));

const StyledHeaderBox = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	width: "100%",
}));

const StyledCollapseButton = styled(Button)(({ theme }) => ({
	borderRadius: theme.shape.borderRadius,
	minWidth: "130px",
}));

const StyledEmptyState = styled(Typography)(({ theme }) => ({
	margin: theme.spacing(1),
	textAlign: "center",
}));

const StyledTypeSelectCell = styled(Table.Cell)(() => ({
	width: "30%",
}));

const StyledStepperWrapper = styled(Box)(() => ({
	flexShrink: 0,
}));

const StyledAccordionWrapper = styled(Box)(() => ({
	"& .MuiAccordion-root": {
		marginBottom: "8px",
	},
}));

const StyledDeleteIcon = styled(IconButton)(() => ({
	padding: "4px",
	marginLeft: "auto",
}));

const StyledJsonEditor = styled(TextField)(() => ({
	fontFamily: "monospace",
	fontSize: "12px",
}));

const StyledBooleanContainer = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	gap: "8px",
}));

const StyledDeletedItem = styled(Box)(({ theme }) => ({
	opacity: 0.6,
	backgroundColor: theme.palette.error.light + "15",
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.error.light}`,
	padding: theme.spacing(0.5),
	width: "100%",
	"& *": {
		color: theme.palette.text.secondary,
	},
}));

const StyledDeletedAccordion = styled(Box)(({ theme }) => ({
	opacity: 0.6,
	position: "relative",
	backgroundColor: theme.palette.error.light + "10",
	borderRadius: theme.shape.borderRadius,
	border: `1px solid ${theme.palette.error.light}`,
	marginBottom: theme.spacing(1),
	pointerEvents: "none",
	"&::before": {
		content: '""',
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: theme.palette.error.light,
		opacity: 0.05,
		borderRadius: theme.shape.borderRadius,
		pointerEvents: "none",
		zIndex: 1,
	},
}));

const StyledFunctionItemContent = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	width: "100%",
	gap: "8px",
}));

const StyledDescriptionBox = styled(Box)(({ theme }) => ({
	marginBottom: theme.spacing(1.5),
}));

// ==================== UTILITY FUNCTIONS ====================

function isTool(obj: unknown): obj is Tool {
	if (typeof obj !== "object" || obj === null) return false;
	const rec = obj as Record<string, unknown>;
	return typeof rec.name === "string";
}

const getNormalizedType = (type: string | string[] | undefined): string => {
	if (Array.isArray(type)) {
		return type[0] || "string";
	}
	return type || "string";
};

const getDefaultValueForType = (
	type: string,
): string | number | boolean | Record<string, unknown> | unknown[] => {
	switch (type) {
		case "number":
			return 0;
		case "boolean":
			return false;
		case "object":
			return {};
		case "array":
			return [];
		case "string":
		default:
			return "";
	}
};

const toBooleanValue = (value: unknown): boolean => {
	return typeof value === "boolean" ? value : false;
};

const formatDefaultValue = (value: unknown, type: string): string => {
	if (value === undefined || value === null) return "";
	if (type === "object" || type === "array") {
		try {
			return JSON.stringify(value, null, 2);
		} catch {
			return String(value);
		}
	}
	return String(value);
};

const parseDefaultValue = (
	value: string,
	type: string,
): string | number | boolean | Record<string, unknown> | unknown[] => {
	if (!value) return "";

	switch (type) {
		case "number": {
			const num = Number(value);
			return Number.isNaN(num) ? "" : num;
		}
		case "boolean":
			return typeof value === "string"
				? value === "true"
				: value === true;
		case "object":
		case "array":
			try {
				return JSON.parse(value) as Record<string, unknown> | unknown[];
			} catch {
				return value;
			}
		default:
			return value;
	}
};

const isValidJSON = (value: string, type: string): boolean => {
	if (type !== "object" && type !== "array") return true;
	if (!value || value.trim() === "") return true;

	try {
		const parsed = JSON.parse(value);
		if (type === "array") {
			return Array.isArray(parsed);
		}
		if (type === "object") {
			return typeof parsed === "object" && !Array.isArray(parsed);
		}
		return true;
	} catch {
		return false;
	}
};

// ==================== MAIN COMPONENT ====================

export const MakeMCPOverlay = (props: MakeMCPOverlayProps) => {
	const {
		tools = [],
		onClose = () => null,
		handleToolsUpdate = () => null,
		handleMCPEditSave = () => null,
	} = props;

	// ==================== STATE ====================

	const [activeStep, setActiveStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [functionSearch, setFunctionSearch] = useState("");
	const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
	const [selectedParameters, setSelectedParameters] = useState<
		Record<string, Record<string, boolean>>
	>({});
	const [collapseAll, setCollapseAll] = useState<CollapseState>({
		1: false,
		2: false,
	});
	const [expanded, setExpanded] = useState<ExpandedState>({ 1: [], 2: [] });
	const [deletedFunctions, setDeletedFunctions] = useState<string[]>([]);
	const [jsonErrors, setJsonErrors] = useState<
		Record<string, Record<string, boolean>>
	>({});

	// ==================== CONSTANTS ====================

	const steps = [
		"Select Functions",
		"Select Parameters",
		"Configure Parameters",
	];

	const stepsDescriptions = [
		{
			text: "Select Functions from File",
			subText:
				"Choose which functions should be included in your MCP JSON configuration.",
		},
		{
			text: "Select Parameters for Each Function",
			subText: "Choose the parameters to include for each function.",
		},
		{
			text: "Configure Parameters",
			subText:
				"Set default values and return types for each selected parameter.",
		},
	];

	// ==================== MEMOIZED VALUES ====================

	const filteredFunctions = useMemo(() => {
		if (functionSearch.trim() === "") {
			return tools;
		}
		return tools.filter((tool) =>
			(tool.title as string | undefined)
				?.toLowerCase()
				.includes(functionSearch.toLowerCase()),
		);
	}, [tools, functionSearch]);

	const step2Functions = useMemo(() => {
		return (filteredFunctions as unknown[])
			.filter(isTool)
			.filter(
				(t) =>
					selectedFunctions.includes(t.name) ||
					deletedFunctions.includes(t.name),
			);
	}, [filteredFunctions, selectedFunctions, deletedFunctions]);

	const configuredFunctions = useMemo(() => {
		const allFunctionNames = Array.from(
			new Set([...Object.keys(selectedParameters), ...deletedFunctions]),
		);

		return allFunctionNames
			.map((toolName) => {
				const tool = (tools as unknown[])
					.filter(isTool)
					.find((t) => t.name === toolName);

				if (!tool) return undefined;

				const isDeleted = deletedFunctions.includes(toolName);

				if (isDeleted) {
					return {
						...tool,
						inputSchema: {
							...tool.inputSchema,
							properties: tool.inputSchema?.properties || {},
						},
					} as Tool;
				}

				const filteredProperties = Object.entries(
					tool.inputSchema?.properties ?? {},
				)
					.filter(
						([paramName]) =>
							selectedParameters[toolName]?.[paramName] === true,
					)
					.reduce(
						(acc, [paramName, propDetails]) => ({
							...acc,
							[paramName]: propDetails,
						}),
						{} as Record<string, PropertyDetails>,
					);

				if (Object.keys(filteredProperties).length === 0)
					return undefined;

				return {
					...tool,
					inputSchema: {
						...tool.inputSchema,
						properties: filteredProperties,
					},
				} as Tool;
			})
			.filter((t): t is Tool => t !== undefined);
	}, [selectedParameters, tools, deletedFunctions]);

	const hasEmptyRequiredTitles = useMemo(() => {
		if (activeStep !== 1) return false;

		const selectedFunctionNames = selectedFunctions.filter(
			(name) => !deletedFunctions.includes(name),
		);

		for (const functionName of selectedFunctionNames) {
			const tool = (tools as unknown[])
				.filter(isTool)
				.find((t) => t.name === functionName);

			if (!tool) continue;

			const requiredParams = tool.inputSchema?.required || [];
			const properties = tool.inputSchema?.properties || {};

			for (const paramName of requiredParams) {
				const propDetails = properties[paramName];
				const title = propDetails?.title?.trim() || "";
				if (title === "") {
					return true;
				}
			}
		}
		return false;
	}, [activeStep, selectedFunctions, deletedFunctions, tools]);

	// ==================== EFFECTS ====================

	useEffect(() => {
		if (activeStep === 1) {
			setExpanded((prev) => ({
				...prev,
				1: step2Functions.map((f) => f.name),
			}));
			setCollapseAll((prev) => ({ ...prev, 1: false }));
		} else if (activeStep === 2) {
			setExpanded((prev) => ({
				...prev,
				2: configuredFunctions.map((f) => f.name),
			}));
			setCollapseAll((prev) => ({ ...prev, 2: false }));
		}
	}, [activeStep, step2Functions, configuredFunctions]);

	// ==================== HELPER FUNCTIONS ====================

	const getSelectedForTool = useCallback(
		(toolName: string): Record<string, boolean> => {
			return selectedParameters[toolName] ?? {};
		},
		[selectedParameters],
	);

	const setSelectedForTool = useCallback(
		(toolName: string, params: Record<string, boolean>) => {
			setSelectedParameters((prev) => ({ ...prev, [toolName]: params }));
		},
		[],
	);

	const isRequired = useCallback((tool: Tool, paramName: string): boolean => {
		return tool.inputSchema?.required?.includes(paramName) ?? false;
	}, []);

	const updateToolProperty = useCallback(
		(
			toolName: string,
			paramName: string,
			propertyKey: string,
			value:
				| string
				| number
				| boolean
				| Record<string, unknown>
				| unknown[],
		) => {
			const updated = tools.map((tool) => {
				if (isTool(tool) && tool.name === toolName) {
					const updatedProperties = {
						...(tool.inputSchema?.properties || {}),
						[paramName]: {
							...(tool.inputSchema?.properties?.[paramName] ||
								{}),
							[propertyKey]: value,
						},
					};
					return {
						...tool,
						inputSchema: {
							...tool.inputSchema,
							properties: updatedProperties,
						},
					};
				}
				return tool;
			});
			handleToolsUpdate(updated);
		},
		[tools, handleToolsUpdate],
	);

	const updateToolDescription = useCallback(
		(toolName: string, newDescription: string) => {
			const updated = tools.map((tool) => {
				if (isTool(tool) && tool.name === toolName) {
					return {
						...tool,
						description: newDescription,
					};
				}
				return tool;
			});
			handleToolsUpdate(updated);
		},
		[tools, handleToolsUpdate],
	);

	const updateToolTypeAndDefault = useCallback(
		(
			toolName: string,
			paramName: string,
			newType: string,
			newDefault:
				| string
				| number
				| boolean
				| Record<string, unknown>
				| unknown[],
		) => {
			const updated = tools.map((tool) => {
				if (isTool(tool) && tool.name === toolName) {
					const updatedProperties = {
						...(tool.inputSchema?.properties || {}),
						[paramName]: {
							...(tool.inputSchema?.properties?.[paramName] ||
								{}),
							type: newType,
							default: newDefault,
						},
					};
					return {
						...tool,
						inputSchema: {
							...tool.inputSchema,
							properties: updatedProperties,
						},
					};
				}
				return tool;
			});
			handleToolsUpdate(updated);
		},
		[tools, handleToolsUpdate],
	);

	// ==================== EVENT HANDLERS ====================

	const handleSelectAllFunctions = useCallback(() => {
		const availableFunctions = filteredFunctions.filter(
			(tool) => !deletedFunctions.includes((tool as Tool).name),
		);
		if (selectedFunctions.length === availableFunctions.length) {
			setSelectedFunctions([]);
		} else {
			const allFunctionNames = availableFunctions.map(
				(tool) => tool.name as string,
			);
			setSelectedFunctions(allFunctionNames);
		}
	}, [selectedFunctions.length, filteredFunctions, deletedFunctions]);

	const handleFunctionToggle = useCallback(
		(tool: Tool) => {
			if (deletedFunctions.includes(tool.name)) return;

			setSelectedFunctions((prev) => {
				if (prev.includes(tool.name)) {
					setSelectedParameters((prevParams) => {
						const newParams = { ...prevParams };
						delete newParams[tool.name];
						return newParams;
					});
					return prev.filter((name) => name !== tool.name);
				}
				const requiredParams = Array.isArray(tool.inputSchema?.required)
					? tool.inputSchema.required.reduce(
							(acc, n) => ({ ...acc, [n]: true }),
							{} as Record<string, boolean>,
						)
					: {};
				setSelectedParameters((prevParams) => ({
					...prevParams,
					[tool.name]: {
						...(prevParams[tool.name] ?? {}),
						...requiredParams,
					},
				}));
				return [...prev, tool.name];
			});
		},
		[deletedFunctions],
	);

	const handleFunctionDelete = useCallback(
		(e: React.MouseEvent, tool: Tool) => {
			e.stopPropagation();
			setDeletedFunctions((prev) => [...prev, tool.name]);
			setSelectedFunctions((prev) =>
				prev.filter((name) => name !== tool.name),
			);
		},
		[],
	);

	const handleFunctionRestore = useCallback(
		(e: React.MouseEvent, tool: Tool) => {
			e.stopPropagation();
			setDeletedFunctions((prev) =>
				prev.filter((name) => name !== tool.name),
			);
		},
		[],
	);

	const handleSelectAllParameters = useCallback(
		(tool: Tool) => {
			const props = tool.inputSchema?.properties ?? {};
			const paramNames = Object.keys(props);
			if (paramNames.length === 0) return;

			const required = new Set(tool.inputSchema?.required ?? []);
			const currentlySelected = selectedParameters[tool.name] ?? {};

			const selectedCount = paramNames.reduce(
				(acc, name) =>
					acc +
					(currentlySelected[name] || required.has(name) ? 1 : 0),
				0,
			);

			if (selectedCount === paramNames.length) {
				const newSelection: Record<string, boolean> = {};
				for (const name of paramNames) {
					newSelection[name] = required.has(name);
				}
				setSelectedForTool(tool.name, newSelection);
			} else {
				const newSelection: Record<string, boolean> = {};
				for (const name of paramNames) newSelection[name] = true;
				setSelectedForTool(tool.name, newSelection);
			}
		},
		[selectedParameters, setSelectedForTool],
	);

	const toggleParameterForTool = useCallback(
		(tool: Tool, paramName: string) => {
			const required = new Set(tool.inputSchema?.required ?? []);
			if (required.has(paramName)) return;

			setSelectedParameters((prev) => {
				const current = prev[tool.name] ?? {};
				const newVal = !current[paramName];
				return {
					...prev,
					[tool.name]: { ...current, [paramName]: newVal },
				};
			});
		},
		[],
	);

	const handleCollapseAll = useCallback(() => {
		const currentStep = activeStep;
		const isCurrentlyCollapsed = collapseAll[currentStep];

		setCollapseAll((prev) => ({
			...prev,
			[currentStep]: !isCurrentlyCollapsed,
		}));

		const functionsToExpand =
			currentStep === 1
				? step2Functions.map((f) => f.name)
				: configuredFunctions.map((f) => f.name);

		setExpanded((prev) => ({
			...prev,
			[currentStep]: isCurrentlyCollapsed ? functionsToExpand : [],
		}));
	}, [activeStep, collapseAll, step2Functions, configuredFunctions]);

	const handleAccordionExpand = useCallback(
		(name: string) => {
			setExpanded((prev) => {
				const currentExpanded = prev[activeStep] || [];
				return {
					...prev,
					[activeStep]: currentExpanded.includes(name)
						? currentExpanded.filter((n) => n !== name)
						: [...currentExpanded, name],
				};
			});
		},
		[activeStep],
	);

	const handleTitleChange = useCallback(
		(newTitle: string, toolName: string, paramName: string) => {
			updateToolProperty(toolName, paramName, "title", newTitle);
		},
		[updateToolProperty],
	);

	const handleDescriptionChange = useCallback(
		(newDescription: string, toolName: string, paramName: string) => {
			updateToolProperty(
				toolName,
				paramName,
				"description",
				newDescription,
			);
		},
		[updateToolProperty],
	);

	const handleTypeChange = useCallback(
		(newType: string, toolName: string, paramName: string) => {
			const defaultValue = getDefaultValueForType(newType);
			updateToolTypeAndDefault(
				toolName,
				paramName,
				newType,
				defaultValue,
			);
			// Clear any JSON errors when type changes
			setJsonErrors((prev) => {
				const toolErrors = { ...prev[toolName] };
				delete toolErrors[paramName];
				return {
					...prev,
					[toolName]: toolErrors,
				};
			});
		},
		[updateToolTypeAndDefault],
	);

	const handleDefaultChange = useCallback(
		(
			newDefault: string | boolean,
			toolName: string,
			paramName: string,
			type: string,
		) => {
			const parsedValue = parseDefaultValue(String(newDefault), type);
			updateToolProperty(toolName, paramName, "default", parsedValue);
		},
		[updateToolProperty],
	);

	const handleNextDisableCheck = useCallback((): boolean => {
		if (activeStep === 0) {
			return (
				selectedFunctions.length === 0 && deletedFunctions.length === 0
			);
		}
		if (activeStep === 1) {
			return hasEmptyRequiredTitles;
		}
		return false;
	}, [
		activeStep,
		selectedFunctions.length,
		deletedFunctions.length,
		hasEmptyRequiredTitles,
	]);

	const handleNext = useCallback(() => {
		if (activeStep === steps.length - 1) {
			setIsLoading(true);
			const finalTools = tools.filter((t) => {
				if (isTool(t)) {
					return !deletedFunctions.includes(t.name);
				}
				return true;
			});
			handleToolsUpdate(finalTools);
			setTimeout(() => {
				handleMCPEditSave(finalTools);
				onClose(true);
			}, 100);
		} else {
			setActiveStep((prev) => prev + 1);
		}
	}, [
		activeStep,
		steps.length,
		tools,
		deletedFunctions,
		handleToolsUpdate,
		handleMCPEditSave,
		onClose,
	]);

	const handleBack = useCallback(() => {
		if (activeStep > 0) {
			setActiveStep((prev) => prev - 1);
		}
	}, [activeStep]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setFunctionSearch(e.target.value);
		},
		[],
	);

	// ==================== RENDER FUNCTIONS ====================

	const renderDefaultValueInput = useCallback(
		(tool: Tool, propName: string, propDetails: PropertyDetails) => {
			const type = getNormalizedType(propDetails?.type);
			const defaultValue = propDetails?.default;
			const displayValue = formatDefaultValue(defaultValue, type);
			const hasError = jsonErrors[tool.name]?.[propName] || false;

			switch (type) {
				case "number":
					return (
						<TextField
							data-testid={`parameter-default-${tool.name}-${propName}`}
							key={`${tool.name}-${propName}-default`}
							size="small"
							fullWidth
							type="number"
							defaultValue={displayValue}
							onChange={(e) =>
								handleDefaultChange(
									e.target.value,
									tool.name,
									propName,
									type,
								)
							}
							placeholder="Enter number"
						/>
					);

				case "boolean":
					return (
						<StyledBooleanContainer
							data-testid={`parameter-default-container-${tool.name}-${propName}`}
						>
							<Typography
								variant="body2"
								data-testid={`parameter-boolean-label-${tool.name}-${propName}`}
							>
								{toBooleanValue(defaultValue)
									? "True"
									: "False"}
							</Typography>
							<Switch
								data-testid={`parameter-default-${tool.name}-${propName}`}
								checked={toBooleanValue(defaultValue)}
								onChange={(
									e: React.ChangeEvent<HTMLInputElement>,
								) =>
									handleDefaultChange(
										e.target.checked,
										tool.name,
										propName,
										type,
									)
								}
								size="small"
							/>
						</StyledBooleanContainer>
					);

				case "object":
					return (
						<StyledJsonEditor
							data-testid={`parameter-default-${tool.name}-${propName}`}
							key={`${tool.name}-${propName}-default`}
							size="small"
							fullWidth
							multiline
							rows={3}
							defaultValue={displayValue || "{}"}
							error={hasError}
							onChange={(e) => {
								const value = e.target.value;
								const isValid = isValidJSON(value, type);

								setJsonErrors((prev) => ({
									...prev,
									[tool.name]: {
										...(prev[tool.name] || {}),
										[propName]: !isValid,
									},
								}));

								if (isValid) {
									try {
										JSON.parse(value);
										handleDefaultChange(
											value,
											tool.name,
											propName,
											type,
										);
									} catch {}
								}
							}}
							placeholder='{"key": "value"}'
							helperText={
								hasError
									? "Invalid JSON object"
									: "Enter valid JSON object"
							}
						/>
					);

				case "array":
					return (
						<StyledJsonEditor
							data-testid={`parameter-default-${tool.name}-${propName}`}
							key={`${tool.name}-${propName}-default`}
							size="small"
							fullWidth
							multiline
							rows={3}
							defaultValue={displayValue || "[]"}
							error={hasError}
							onChange={(e) => {
								const value = e.target.value;
								const isValid = isValidJSON(value, type);

								setJsonErrors((prev) => ({
									...prev,
									[tool.name]: {
										...(prev[tool.name] || {}),
										[propName]: !isValid,
									},
								}));

								if (isValid) {
									try {
										const parsed = JSON.parse(value);
										if (Array.isArray(parsed)) {
											handleDefaultChange(
												value,
												tool.name,
												propName,
												type,
											);
										}
									} catch {
										// Invalid JSON, don't update
									}
								}
							}}
							placeholder='["item1", "item2"]'
							helperText={
								hasError
									? "Invalid JSON array"
									: "Enter valid JSON array"
							}
						/>
					);

				case "string":
				default:
					return (
						<TextField
							data-testid={`parameter-default-${tool.name}-${propName}`}
							key={`${tool.name}-${propName}-default`}
							size="small"
							fullWidth
							defaultValue={displayValue}
							onChange={(e) =>
								handleDefaultChange(
									e.target.value,
									tool.name,
									propName,
									type,
								)
							}
							placeholder="Enter string value"
						/>
					);
			}
		},
		[handleDefaultChange, jsonErrors],
	);

	const renderParameterRow = useCallback(
		(
			tool: Tool,
			propName: string,
			propDetails: PropertyDetails,
			showDescriptionField = false,
		) => {
			const requiredFlag = isRequired(tool, propName);
			const current = getSelectedForTool(tool.name);
			const checked = requiredFlag ? true : !!current[propName];
			const titleValue = propDetails?.title?.trim() || "";
			const hasEmptyTitle = requiredFlag && titleValue === "";

			return (
				<Table.Row
					key={propName}
					data-testid={`parameter-row-${tool.name}-${propName}`}
				>
					{showDescriptionField && (
						<Table.Cell
							data-testid={`parameter-checkbox-cell-${tool.name}-${propName}`}
						>
							<Checkbox
								data-testid={`parameter-checkbox-${tool.name}-${propName}`}
								disabled={requiredFlag}
								checked={checked}
								onChange={() =>
									toggleParameterForTool(tool, propName)
								}
							/>
						</Table.Cell>
					)}
					<Table.Cell
						data-testid={`parameter-name-cell-${tool.name}-${propName}`}
					>
						{showDescriptionField ? (
							<StyledParameterBox
								data-testid={`parameter-title-box-${tool.name}-${propName}`}
							>
								<TextField
									data-testid={`parameter-title-${tool.name}-${propName}`}
									key={`${tool.name}-${propName}-title`}
									size="small"
									defaultValue={
										propDetails?.title ?? propName
									}
									fullWidth
									onChange={(e) =>
										handleTitleChange(
											e.target.value,
											tool.name,
											propName,
										)
									}
									error={hasEmptyTitle}
									helperText={
										hasEmptyTitle ? "Title is required" : ""
									}
								/>
								{requiredFlag && (
									<Typography
										variant="body2"
										color="error"
										data-testid={`parameter-required-${tool.name}-${propName}`}
									>
										*
									</Typography>
								)}
							</StyledParameterBox>
						) : (
							<StyledParameterBox
								data-testid={`parameter-name-box-${tool.name}-${propName}`}
							>
								<Typography
									variant="body2"
									data-testid={`parameter-name-${tool.name}-${propName}`}
								>
									{propDetails?.title ?? propName}
								</Typography>
								{requiredFlag && (
									<Typography
										variant="body2"
										color="error"
										data-testid={`parameter-required-${tool.name}-${propName}`}
									>
										*
									</Typography>
								)}
							</StyledParameterBox>
						)}
					</Table.Cell>
					{showDescriptionField ? (
						<Table.Cell
							data-testid={`parameter-description-cell-${tool.name}-${propName}`}
						>
							<TextField
								data-testid={`parameter-description-${tool.name}-${propName}`}
								key={`${tool.name}-${propName}-description`}
								size="small"
								defaultValue={propDetails?.description ?? ""}
								fullWidth
								onChange={(e) =>
									handleDescriptionChange(
										e.target.value,
										tool.name,
										propName,
									)
								}
							/>
						</Table.Cell>
					) : (
						<>
							<StyledTypeSelectCell
								data-testid={`parameter-type-cell-${tool.name}-${propName}`}
							>
								<Select
									data-testid={`parameter-type-${tool.name}-${propName}`}
									value={getNormalizedType(propDetails?.type)}
									size="small"
									fullWidth
									onChange={(e) =>
										handleTypeChange(
											e.target.value,
											tool.name,
											propName,
										)
									}
								>
									<Select.Item
										value="string"
										data-testid={`parameter-type-option-string-${tool.name}-${propName}`}
									>
										string
									</Select.Item>
									<Select.Item
										value="number"
										data-testid={`parameter-type-option-number-${tool.name}-${propName}`}
									>
										number
									</Select.Item>
									<Select.Item
										value="boolean"
										data-testid={`parameter-type-option-boolean-${tool.name}-${propName}`}
									>
										boolean
									</Select.Item>
									<Select.Item
										value="array"
										data-testid={`parameter-type-option-array-${tool.name}-${propName}`}
									>
										array
									</Select.Item>
									<Select.Item
										value="object"
										data-testid={`parameter-type-option-object-${tool.name}-${propName}`}
									>
										object
									</Select.Item>
								</Select>
							</StyledTypeSelectCell>
							<Table.Cell
								data-testid={`parameter-default-cell-${tool.name}-${propName}`}
							>
								{renderDefaultValueInput(
									tool,
									propName,
									propDetails,
								)}
							</Table.Cell>
						</>
					)}
				</Table.Row>
			);
		},
		[
			isRequired,
			getSelectedForTool,
			toggleParameterForTool,
			handleTitleChange,
			handleDescriptionChange,
			handleTypeChange,
			renderDefaultValueInput,
		],
	);

	const renderParameterTable = useCallback(
		(tool: Tool, showDescriptionField = false) => {
			const props = tool.inputSchema?.properties ?? {};
			const names = Object.keys(props);
			const required = new Set(tool.inputSchema?.required ?? []);
			const current = getSelectedForTool(tool.name);
			const total = names.length;
			const selected = names.reduce(
				(acc, n) => acc + (current[n] || required.has(n) ? 1 : 0),
				0,
			);
			const checked = selected === total && total > 0;
			const indeterminate = selected > 0 && selected < total;

			return (
				<Table
					size="small"
					data-testid={`parameter-table-${tool.name}`}
				>
					<Table.Head
						data-testid={`parameter-table-head-${tool.name}`}
					>
						<Table.Row
							data-testid={`parameter-table-header-row-${tool.name}`}
						>
							{showDescriptionField && (
								<Table.Cell
									data-testid={`parameter-select-all-cell-${tool.name}`}
								>
									<Checkbox
										data-testid={`select-all-parameters-${tool.name}`}
										checked={checked}
										onChange={() =>
											handleSelectAllParameters(tool)
										}
										checkboxProps={
											indeterminate
												? { indeterminate: true }
												: undefined
										}
									/>
								</Table.Cell>
							)}
							<Table.Cell
								data-testid={`parameter-header-parameter-${tool.name}`}
							>
								Parameter
							</Table.Cell>
							{showDescriptionField ? (
								<Table.Cell
									data-testid={`parameter-header-description-${tool.name}`}
								>
									Description
								</Table.Cell>
							) : (
								<>
									<Table.Cell
										data-testid={`parameter-header-type-${tool.name}`}
									>
										Input Type
									</Table.Cell>
									<Table.Cell
										data-testid={`parameter-header-default-${tool.name}`}
									>
										Default Value
									</Table.Cell>
								</>
							)}
						</Table.Row>
					</Table.Head>
					<Table.Body
						data-testid={`parameter-table-body-${tool.name}`}
					>
						{Object.entries(props).map(([propName, propDetails]) =>
							renderParameterRow(
								tool,
								propName,
								propDetails,
								showDescriptionField,
							),
						)}
					</Table.Body>
				</Table>
			);
		},
		[getSelectedForTool, handleSelectAllParameters, renderParameterRow],
	);

	const renderAccordionContent = useCallback(
		(tool: Tool, showParameterSelection = false) => {
			const totalCount = Object.keys(
				tool.inputSchema?.properties ?? {},
			).length;
			const selectedCount = Object.keys(
				getSelectedForTool(tool.name),
			).filter((key) => getSelectedForTool(tool.name)[key]).length;
			const isExpanded = (expanded[activeStep] || []).includes(tool.name);
			const isDeleted = deletedFunctions.includes(tool.name);
			const description = tool.description ?? "No description available.";

			const accordionContent = (
				<Accordion
					key={tool.name}
					expanded={isExpanded}
					data-testid={`accordion-${tool.name}`}
				>
					<StyledAccordionTrigger
						expandIcon={
							<StyledExpandMore
								data-testid={`accordion-expand-icon-${tool.name}`}
							/>
						}
						onClick={() =>
							!isDeleted && handleAccordionExpand(tool.name)
						}
						data-testid={`accordion-trigger-${tool.name}`}
						disabled={isDeleted}
					>
						{showParameterSelection ? (
							<StyledHeaderBox
								data-testid={`accordion-header-box-${tool.name}`}
							>
								<Box
									data-testid={`accordion-title-wrapper-${tool.name}`}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: "8px",
									}}
								>
									<Typography
										variant="body1"
										data-testid={`accordion-title-${tool.name}`}
									>
										{tool.title ?? tool.name}
									</Typography>
									{isDeleted && (
										<Chip
											label="Deleted"
											size="small"
											data-testid={`accordion-deleted-chip-${tool.name}`}
										/>
									)}
								</Box>
								<Typography
									variant="body2"
									color="textDisabled"
									data-testid={`accordion-count-${tool.name}`}
								>
									{`${selectedCount} of ${totalCount} parameters selected`}
								</Typography>
							</StyledHeaderBox>
						) : (
							<Box
								data-testid={`accordion-title-wrapper-${tool.name}`}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: "8px",
									width: "100%",
								}}
							>
								<Typography
									variant="body1"
									data-testid={`accordion-title-${tool.name}`}
								>
									{tool.title ?? tool.name}
								</Typography>
								{isDeleted && (
									<Chip
										label="Deleted"
										size="small"
										data-testid={`accordion-deleted-chip-${tool.name}`}
									/>
								)}
							</Box>
						)}
					</StyledAccordionTrigger>
					<Accordion.Content
						data-testid={`accordion-content-${tool.name}`}
					>
						<StyledDescriptionBox>
							<TextField
								fullWidth
								variant="outlined"
								size="small"
								multiline
								maxRows={6}
								defaultValue={description}
								onChange={(e) =>
									updateToolDescription(
										tool.name,
										e.target.value,
									)
								}
								placeholder="Enter function description"
								label="Description"
							/>
						</StyledDescriptionBox>
						{renderParameterTable(tool, showParameterSelection)}
					</Accordion.Content>
				</Accordion>
			);

			return isDeleted ? (
				<StyledDeletedAccordion
					key={`deleted-${tool.name}`}
					data-testid={`deleted-accordion-wrapper-${tool.name}`}
				>
					{accordionContent}
				</StyledDeletedAccordion>
			) : (
				accordionContent
			);
		},
		[
			expanded,
			activeStep,
			getSelectedForTool,
			handleAccordionExpand,
			renderParameterTable,
			deletedFunctions,
			updateToolDescription,
		],
	);

	// ==================== STEP CONTENT COMPONENTS ====================

	const renderContentStep1 = () => {
		const total = filteredFunctions.filter(
			(tool) => !deletedFunctions.includes((tool as Tool).name),
		).length;
		const sel = selectedFunctions.length;
		const allChecked = total > 0 && sel === total;
		const indeterminate = sel > 0 && sel < total;

		return (
			<StyledFunctionListContainer data-testid="function-list-container">
				<Search
					data-testid="function-search-input"
					placeholder="Search Functions"
					value={functionSearch}
					onChange={handleSearchChange}
				/>
				{filteredFunctions.length === 0 ? (
					<StyledEmptyState
						variant="body2"
						data-testid="empty-state-message"
					>
						No functions found.
					</StyledEmptyState>
				) : (
					<StyledFunctionList data-testid="function-list">
						{functionSearch === "" && (
							<List.Item data-testid="select-all-functions-item">
								<List.ItemButton
									onClick={handleSelectAllFunctions}
									data-testid="select-all-functions-button"
								>
									<Checkbox
										data-testid="select-all-functions-checkbox"
										checked={allChecked}
										checkboxProps={
											indeterminate
												? { indeterminate: true }
												: undefined
										}
									/>
									<List.ItemText
										primary="Select All"
										data-testid="select-all-functions-text"
									/>
								</List.ItemButton>
							</List.Item>
						)}
						{filteredFunctions.map((tool) => {
							if (!isTool(tool)) return null;
							const isDeleted = deletedFunctions.includes(
								tool.name,
							);

							const itemContent = (
								<List.ItemButton
									data-testid={`function-button-${tool.name}`}
								>
									<StyledFunctionItemContent
										data-testid={`function-content-${tool.name}`}
										onClick={(e) => {
											e.stopPropagation();
											handleFunctionToggle(tool);
										}}
									>
										<Checkbox
											data-testid={`function-checkbox-${tool.name}`}
											checked={selectedFunctions.includes(
												tool.name,
											)}
											disabled={isDeleted}
										/>
										<List.ItemText
											primary={
												tool.title ||
												`Function ${tool.name}`
											}
											data-testid={`function-text-${tool.name}`}
										/>
										{isDeleted ? (
											<>
												<Chip
													label="Deleted"
													size="small"
													data-testid={`function-deleted-chip-${tool.name}`}
												/>
												<StyledDeleteIcon
													data-testid={`restore-icon-${tool.name}`}
													onClick={(e) => {
														e.stopPropagation();
														handleFunctionRestore(
															e,
															tool,
														);
													}}
													size="small"
												>
													<RestoreFromTrash
														color="primary"
														fontSize="small"
														titleAccess="Restore Function"
														data-testid={`restore-icon-svg-${tool.name}`}
													/>
												</StyledDeleteIcon>
											</>
										) : (
											<StyledDeleteIcon
												data-testid={`delete-icon-${tool.name}`}
												onClick={(e) =>
													handleFunctionDelete(
														e,
														tool,
													)
												}
												size="small"
											>
												<DeleteOutlined
													color="error"
													fontSize="small"
													titleAccess="Delete Function"
													data-testid={`delete-icon-svg-${tool.name}`}
												/>
											</StyledDeleteIcon>
										)}
									</StyledFunctionItemContent>
								</List.ItemButton>
							);

							return (
								<List.Item
									key={tool.name}
									data-testid={`function-item-${tool.name}`}
								>
									{isDeleted ? (
										<StyledDeletedItem
											data-testid={`deleted-function-wrapper-${tool.name}`}
										>
											{itemContent}
										</StyledDeletedItem>
									) : (
										itemContent
									)}
								</List.Item>
							);
						})}
					</StyledFunctionList>
				)}
			</StyledFunctionListContainer>
		);
	};

	const renderContentStep2 = () => {
		return (
			<StyledAccordionWrapper data-testid="step-2-accordion-wrapper">
				{step2Functions.map((tool) =>
					renderAccordionContent(tool, true),
				)}
			</StyledAccordionWrapper>
		);
	};

	const renderContentStep3 = () => {
		return (
			<StyledAccordionWrapper data-testid="step-3-accordion-wrapper">
				{configuredFunctions.map((tool) =>
					renderAccordionContent(tool, false),
				)}
			</StyledAccordionWrapper>
		);
	};

	// ==================== MAIN RENDER ====================

	return (
		<Modal
			open
			onClose={() => onClose(false)}
			maxWidth="lg"
			fullWidth
			data-testid="mcp-overlay-modal"
		>
			<StyledModalContent data-testid="modal-content">
				<StyledStepperWrapper data-testid="stepper-wrapper">
					<Stepper activeStep={activeStep} data-testid="mcp-stepper">
						{steps.map((label, index) => (
							<Stepper.Step
								key={label}
								data-testid={`stepper-step-${index}`}
							>
								<Stepper.StepLabel
									data-testid={`stepper-label-${index}`}
								>
									{label}
								</Stepper.StepLabel>
							</Stepper.Step>
						))}
					</Stepper>
				</StyledStepperWrapper>

				<StyledStepperContainer data-testid="stepper-container">
					<Box data-testid="stepper-description-box">
						<Typography variant="body1" data-testid="step-title">
							{stepsDescriptions[activeStep].text}
						</Typography>
						<Typography
							variant="caption"
							color="textSecondary"
							data-testid="step-subtitle"
						>
							{stepsDescriptions[activeStep].subText}
						</Typography>
					</Box>
					{activeStep !== 0 && (
						<StyledCollapseButton
							data-testid="collapse-all-button"
							variant="outlined"
							size="small"
							startIcon={
								collapseAll[activeStep] ? (
									<UnfoldMore data-testid="unfold-more-icon" />
								) : (
									<UnfoldLess data-testid="unfold-less-icon" />
								)
							}
							onClick={handleCollapseAll}
						>
							{collapseAll[activeStep]
								? "Expand All   "
								: "Collapse All"}
						</StyledCollapseButton>
					)}
				</StyledStepperContainer>

				<StyledContentWrapper
					data-testid={`content-wrapper-step-${activeStep}`}
				>
					{activeStep === 0 && renderContentStep1()}
					{activeStep === 1 && renderContentStep2()}
					{activeStep === 2 && renderContentStep3()}
				</StyledContentWrapper>
			</StyledModalContent>

			<Modal.Actions data-testid="modal-actions">
				<Button
					data-testid="back-button"
					variant="text"
					disabled={activeStep === 0 || isLoading}
					onClick={handleBack}
				>
					Back
				</Button>
				<Button
					data-testid="next-button"
					variant="contained"
					disabled={isLoading || handleNextDisableCheck()}
					onClick={handleNext}
				>
					{activeStep === steps.length - 1 ? "Save" : "Next"}
				</Button>
			</Modal.Actions>
		</Modal>
	);
};
