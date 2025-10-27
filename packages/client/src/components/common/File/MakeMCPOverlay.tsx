import { useMemo, useState, useEffect, useCallback } from "react";
import {
    Accordion,
    Box,
    Button,
    Checkbox,
    List,
    Modal,
    Search,
    Select,
    Stepper,
    styled,
    Table,
    TextField,
    Typography,
} from "@semoss/ui";
import { ExpandMore, UnfoldLess, UnfoldMore } from "@mui/icons-material";

// ==================== TYPES ====================

type PropertyDetails = {
    title?: string;
    description?: string;
    type?: string | string[];
    default?: string;
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
    width: "65%",
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

// ==================== UTILITY FUNCTIONS ====================

function isTool(obj: unknown): obj is Tool {
    if (typeof obj !== "object" || obj === null) return false;
    const rec = obj as Record<string, unknown>;
    return typeof rec.name === "string";
}

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
    const [selectedParameters, setSelectedParameters] = useState<Record<string, Record<string, boolean>>>({});
    const [collapseAll, setCollapseAll] = useState<CollapseState>({ 1: false, 2: false });
    const [expanded, setExpanded] = useState<ExpandedState>({ 1: [], 2: [] });

    // ==================== CONSTANTS ====================

    const steps = ["Select Functions", "Select Parameters", "Configure Parameters"];
    const stepsDescriptions = [
        {
            text: "Select Functions from File",
            subText: "Choose which functions should be included in your MCP JSON configuration.",
        },
        {
            text: "Select Parameters for Each Function",
            subText: "Choose the parameters to include for each function.",
        },
        {
            text: "Configure Parameters",
            subText: "Set default values and return types for each selected parameter.",
        },
    ];

    // ==================== MEMOIZED VALUES ====================

    const filteredFunctions = useMemo(() => {
        if (functionSearch.trim() === "") {
            return tools;
        }
        return tools.filter((tool) =>
            (tool.name as string | undefined)?.toLowerCase().includes(functionSearch.toLowerCase())
        );
    }, [tools, functionSearch]);

    const selectedFilteredFunctions = useMemo(() => {
        return (filteredFunctions as unknown[])
            .filter(isTool)
            .filter((t) => selectedFunctions.includes(t.name));
    }, [filteredFunctions, selectedFunctions]);

    const configuredFunctions = useMemo(() => {
        return Object.keys(selectedParameters)
            .map((toolName) => {
                const tool = filteredFunctions.find((t) => isTool(t) && t.name === toolName) as Tool | undefined;
                if (!tool) return undefined;

                const filteredProperties = Object.entries(tool.inputSchema?.properties ?? {})
                    .filter(([paramName]) => selectedParameters[toolName]?.[paramName])
                    .reduce((acc, [paramName, propDetails]) => ({ ...acc, [paramName]: propDetails }), {});

                return {
                    ...tool,
                    inputSchema: {
                        ...tool.inputSchema,
                        properties: filteredProperties,
                    },
                } as Tool;
            })
            .filter((t): t is Tool => t !== undefined);
    }, [selectedParameters, filteredFunctions]);

    // ==================== EFFECTS ====================

    // Initialize expanded state when step changes or functions change
    useEffect(() => {
        if (activeStep === 1) {
            // Step 2: expand all selected functions by default
            setExpanded((prev) => ({
                ...prev,
                1: selectedFilteredFunctions.map((f) => f.name),
            }));
            setCollapseAll((prev) => ({ ...prev, 1: false }));
        } else if (activeStep === 2) {
            // Step 3: expand all configured functions by default
            setExpanded((prev) => ({
                ...prev,
                2: configuredFunctions.map((f) => f.name),
            }));
            setCollapseAll((prev) => ({ ...prev, 2: false }));
        }
    }, [activeStep, selectedFilteredFunctions.length, configuredFunctions.length]);

    // ==================== HELPER FUNCTIONS ====================

    const getSelectedForTool = useCallback((toolName: string): Record<string, boolean> => {
        return selectedParameters[toolName] ?? {};
    }, [selectedParameters]);

    const setSelectedForTool = useCallback((toolName: string, params: Record<string, boolean>) => {
        setSelectedParameters((prev) => ({ ...prev, [toolName]: params }));
    }, []);

    const isRequired = useCallback((tool: Tool, paramName: string): boolean => {
        return tool.inputSchema?.required?.includes(paramName) ?? false;
    }, []);

    const updateToolProperty = useCallback((
        toolName: string,
        paramName: string,
        propertyKey: string,
        value: string
    ) => {
        const updated = tools.map((tool) => {
            if (isTool(tool) && tool.name === toolName) {
                const updatedProperties = {
                    ...(tool.inputSchema?.properties || {}),
                    [paramName]: {
                        ...(tool.inputSchema?.properties?.[paramName] || {}),
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
    }, [tools, handleToolsUpdate]);

    // ==================== EVENT HANDLERS ====================

    const handleSelectAllFunctions = useCallback(() => {
        if (selectedFunctions.length === filteredFunctions.length) {
            setSelectedFunctions([]);
        } else {
            const allFunctionNames = filteredFunctions.map((tool) => tool.name as string);
            setSelectedFunctions(allFunctionNames);
        }
    }, [selectedFunctions.length, filteredFunctions]);

    const handleFunctionToggle = useCallback((tool: Tool) => {
        setSelectedFunctions((prev) => {
            if (prev.includes(tool.name)) {
                setSelectedParameters((prevParams) => {
                    const newParams = { ...prevParams };
                    delete newParams[tool.name];
                    return newParams;
                });
                return prev.filter((name) => name !== tool.name);
            } else {
                const requiredParams = Array.isArray(tool.inputSchema?.required)
                    ? tool.inputSchema.required.reduce((acc, n) => ({ ...acc, [n]: true }), {})
                    : {};
                setSelectedParameters((prevParams) => ({
                    ...prevParams,
                    [tool.name]: {
                        ...(prevParams[tool.name] ?? {}),
                        ...requiredParams,
                    },
                }));
                return [...prev, tool.name];
            }
        });
    }, []);

    const handleSelectAllParameters = useCallback((tool: Tool) => {
        const props = tool.inputSchema?.properties ?? {};
        const paramNames = Object.keys(props);
        if (paramNames.length === 0) return;

        const required = new Set(tool.inputSchema?.required ?? []);
        const currentlySelected = selectedParameters[tool.name] ?? {};

        const selectedCount = paramNames.reduce(
            (acc, name) => acc + (currentlySelected[name] || required.has(name) ? 1 : 0),
            0
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
    }, [selectedParameters, setSelectedForTool]);

    const toggleParameterForTool = useCallback((tool: Tool, paramName: string) => {
        const required = new Set(tool.inputSchema?.required ?? []);
        if (required.has(paramName)) return;

        setSelectedParameters((prev) => {
            const current = prev[tool.name] ?? {};
            const newVal = !current[paramName];
            return { ...prev, [tool.name]: { ...current, [paramName]: newVal } };
        });
    }, []);

    const handleCollapseAll = useCallback(() => {
        const currentStep = activeStep;
        const isCurrentlyCollapsed = collapseAll[currentStep];
        
        setCollapseAll((prev) => ({
            ...prev,
            [currentStep]: !isCurrentlyCollapsed,
        }));

        const functionsToExpand = currentStep === 1 
            ? selectedFilteredFunctions.map((f) => f.name)
            : configuredFunctions.map((f) => f.name);

        setExpanded((prev) => ({
            ...prev,
            [currentStep]: isCurrentlyCollapsed ? functionsToExpand : [],
        }));
    }, [activeStep, collapseAll, selectedFilteredFunctions, configuredFunctions]);

    const handleAccordionExpand = useCallback((name: string) => {
        setExpanded((prev) => {
            const currentExpanded = prev[activeStep] || [];
            return {
                ...prev,
                [activeStep]: currentExpanded.includes(name)
                    ? currentExpanded.filter((n) => n !== name)
                    : [...currentExpanded, name],
            };
        });
    }, [activeStep]);

    const handleDescriptionChange = useCallback((newDescription: string, toolName: string, paramName: string) => {
        updateToolProperty(toolName, paramName, "description", newDescription);
    }, [updateToolProperty]);

    const handleTypeChange = useCallback((newType: string, toolName: string, paramName: string) => {
        updateToolProperty(toolName, paramName, "type", newType);
    }, [updateToolProperty]);

    const handleDefaultChange = useCallback((newDefault: string, toolName: string, paramName: string) => {
        updateToolProperty(toolName, paramName, "default", newDefault);
    }, [updateToolProperty]);

    const handleNextDisableCheck = useCallback((): boolean => {
        if (activeStep === 0) {
            return selectedFunctions.length === 0;
        }
        return false;
    }, [activeStep, selectedFunctions.length]);

    const handleSave = useCallback(() => {
        handleMCPEditSave(tools);
        onClose(true);
    }, [tools, handleMCPEditSave, onClose]);

    const handleNext = useCallback(() => {
        if (activeStep === steps.length - 1) {
            setIsLoading(true);
            handleSave();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    }, [activeStep, steps.length, handleSave]);

    const handleBack = useCallback(() => {
        if (activeStep > 0) {
            setActiveStep((prev) => prev - 1);
        }
    }, [activeStep]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFunctionSearch(e.target.value);
    }, []);

    // ==================== RENDER FUNCTIONS ====================

    const renderParameterRow = useCallback((
        tool: Tool,
        propName: string,
        propDetails: PropertyDetails,
        showDescriptionField: boolean = false
    ) => {
        const requiredFlag = isRequired(tool, propName);
        const current = getSelectedForTool(tool.name);
        const checked = requiredFlag ? true : !!current[propName];

        return (
            <Table.Row key={propName} data-testid={`parameter-row-${tool.name}-${propName}`}>
                {showDescriptionField && (
                    <Table.Cell>
                        <Checkbox
                            data-testid={`parameter-checkbox-${tool.name}-${propName}`}
                            disabled={requiredFlag}
                            checked={checked}
                            onChange={() => toggleParameterForTool(tool, propName)}
                        />
                    </Table.Cell>
                )}
                <Table.Cell>
                    <StyledParameterBox>
                        <Typography variant="body2" data-testid={`parameter-name-${tool.name}-${propName}`}>
                            {propDetails?.title ?? propName}
                        </Typography>
                        {requiredFlag && (
                            <Typography variant="body2" color="error" data-testid={`parameter-required-${tool.name}-${propName}`}>
                                *
                            </Typography>
                        )}
                    </StyledParameterBox>
                </Table.Cell>
                {showDescriptionField ? (
                    <Table.Cell>
                        <TextField
                            data-testid={`parameter-description-${tool.name}-${propName}`}
                            key={`${tool.name}-${propName}-description`}
                            size="small"
                            defaultValue={propDetails?.description ?? ""}
                            fullWidth
                            onChange={(e) => handleDescriptionChange(e.target.value, tool.name, propName)}
                        />
                    </Table.Cell>
                ) : (
                    <>
                        <StyledTypeSelectCell>
                            <Select
                                data-testid={`parameter-type-${tool.name}-${propName}`}
                                value={propDetails?.type ?? ""}
                                size="small"
                                fullWidth
                                onChange={(e) => handleTypeChange(e.target.value, tool.name, propName)}
                            >
                                <Select.Item value="string">string</Select.Item>
                                <Select.Item value="number">number</Select.Item>
                                <Select.Item value="boolean">boolean</Select.Item>
                                <Select.Item value="array">array</Select.Item>
                                <Select.Item value="object">object</Select.Item>
                            </Select>
                        </StyledTypeSelectCell>
                        <Table.Cell>
                            <TextField
                                data-testid={`parameter-default-${tool.name}-${propName}`}
                                key={`${tool.name}-${propName}-default`}
                                size="small"
                                fullWidth
                                defaultValue={propDetails?.default ?? ""}
                                onChange={(e) => handleDefaultChange(e.target.value, tool.name, propName)}
                                placeholder="Default value"
                                type={propDetails?.type === "number" ? "number" : "text"}
                            />
                        </Table.Cell>
                    </>
                )}
            </Table.Row>
        );
    }, [isRequired, getSelectedForTool, toggleParameterForTool, handleDescriptionChange, handleTypeChange, handleDefaultChange]);

    const renderParameterTable = useCallback((tool: Tool, showDescriptionField: boolean = false) => {
        const props = tool.inputSchema?.properties ?? {};
        const names = Object.keys(props);
        const required = new Set(tool.inputSchema?.required ?? []);
        const current = getSelectedForTool(tool.name);
        const total = names.length;
        const selected = names.reduce((acc, n) => acc + (current[n] || required.has(n) ? 1 : 0), 0);
        const checked = selected === total && total > 0;
        const indeterminate = selected > 0 && selected < total;

        return (
            <Table size="small" data-testid={`parameter-table-${tool.name}`}>
                <Table.Head>
                    <Table.Row>
                        {showDescriptionField && (
                            <Table.Cell>
                                <Checkbox
                                    data-testid={`select-all-parameters-${tool.name}`}
                                    
                                    checked={checked}
                                    onChange={() => handleSelectAllParameters(tool)}
                                    checkboxProps={
                                        indeterminate
                                            ? { indeterminate: true }
                                            : undefined
                                    }
                                />
                            </Table.Cell>
                        )}
                        <Table.Cell>Parameter</Table.Cell>
                        {showDescriptionField ? (
                            <Table.Cell>Description</Table.Cell>
                        ) : (
                            <>
                                <Table.Cell>Return Type</Table.Cell>
                                <Table.Cell>Default Value</Table.Cell>
                            </>
                        )}
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {Object.entries(props).map(([propName, propDetails]) =>
                        renderParameterRow(tool, propName, propDetails, showDescriptionField)
                    )}
                </Table.Body>
            </Table>
        );
    }, [getSelectedForTool, handleSelectAllParameters, renderParameterRow]);

    const renderAccordionContent = useCallback((tool: Tool, showParameterSelection: boolean = false) => {
        const totalCount = Object.keys(tool.inputSchema?.properties ?? {}).length;
        const selectedCount = Object.keys(getSelectedForTool(tool.name)).filter(
            (key) => getSelectedForTool(tool.name)[key]
        ).length;
        const isExpanded = (expanded[activeStep] || []).includes(tool.name);

        return (
            <Accordion key={tool.name} expanded={isExpanded} data-testid={`accordion-${tool.name}`}>
                <StyledAccordionTrigger 
                    expandIcon={<StyledExpandMore />} 
                    onClick={() => handleAccordionExpand(tool.name)}
                    data-testid={`accordion-trigger-${tool.name}`}
                >
                    {showParameterSelection ? (
                        <StyledHeaderBox>
                            <Typography variant="body1" data-testid={`accordion-title-${tool.name}`}>
                                {tool.title ?? tool.name}
                            </Typography>
                            <Typography variant="body2" color="textDisabled" data-testid={`accordion-count-${tool.name}`}>
                                {`${selectedCount} of ${totalCount} parameters selected`}
                            </Typography>
                        </StyledHeaderBox>
                    ) : (
                        <Typography variant="body1" data-testid={`accordion-title-${tool.name}`}>
                            {tool.title ?? tool.name}
                        </Typography>
                    )}
                </StyledAccordionTrigger>
                <Accordion.Content data-testid={`accordion-content-${tool.name}`}>
                    <Typography variant="body2" data-testid={`accordion-description-${tool.name}`}>
                        {tool.description ?? "No description available."}
                    </Typography>
                    {renderParameterTable(tool, showParameterSelection)}
                </Accordion.Content>
            </Accordion>
        );
    }, [expanded, activeStep, getSelectedForTool, handleAccordionExpand, renderParameterTable]);

    // ==================== STEP CONTENT COMPONENTS ====================

    const renderContentStep1 = () => {
        const total = filteredFunctions.length;
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
                    <StyledEmptyState variant="body2" data-testid="empty-state-message">
                        No functions found.
                    </StyledEmptyState>
                ) : (
                    <StyledFunctionList data-testid="function-list">
                        {functionSearch === "" && 
                            <List.Item>
                                <List.ItemButton onClick={handleSelectAllFunctions} data-testid="select-all-functions-button">
                                    <Checkbox 
                                        data-testid="select-all-functions-checkbox"
                                        checked={allChecked}
                                        checkboxProps={
                                            indeterminate
                                                ? { indeterminate: true }
                                                : undefined
                                        }
                                    />
                                    <List.ItemText primary="Select All" />
                                </List.ItemButton>
                            </List.Item>
                        }
                        {filteredFunctions.map(
                            (tool) =>
                                isTool(tool) && (
                                    <List.Item key={tool.name} data-testid={`function-item-${tool.name}`}>
                                        <List.ItemButton 
                                            onClick={() => handleFunctionToggle(tool)}
                                            data-testid={`function-button-${tool.name}`}
                                        >
                                            <Checkbox 
                                                data-testid={`function-checkbox-${tool.name}`}
                                                checked={selectedFunctions.includes(tool.name)} 
                                            />
                                            <List.ItemText primary={tool.title || `Function ${tool.name}`} />
                                        </List.ItemButton>
                                    </List.Item>
                                )
                        )}
                    </StyledFunctionList>
                )}
            </StyledFunctionListContainer>
        );
    };

    const renderContentStep2 = () => {
        return (
            <StyledAccordionWrapper data-testid="step-2-accordion-wrapper">
                {selectedFilteredFunctions.map((tool) => renderAccordionContent(tool, true))}
            </StyledAccordionWrapper>
        );
    };

    const renderContentStep3 = () => {
        return (
            <StyledAccordionWrapper data-testid="step-3-accordion-wrapper">
                {configuredFunctions.map((tool) => renderAccordionContent(tool, false))}
            </StyledAccordionWrapper>
        );
    };

    // ==================== MAIN RENDER ====================

    return (
        <Modal open onClose={() => onClose(false)} maxWidth="md" fullWidth data-testid="mcp-overlay-modal">
            <StyledModalContent data-testid="modal-content">
                <StyledStepperWrapper data-testid="stepper-wrapper">
                    <Stepper activeStep={activeStep} data-testid="mcp-stepper">
                        {steps.map((label, index) => (
                            <Stepper.Step key={label} data-testid={`stepper-step-${index}`}>
                                <Stepper.StepLabel data-testid={`stepper-label-${index}`}>
                                    {label}
                                </Stepper.StepLabel>
                            </Stepper.Step>
                        ))}
                    </Stepper>
                </StyledStepperWrapper>

                <StyledStepperContainer data-testid="stepper-container">
                    <Box>
                        <Typography variant="body1" data-testid="step-title">
                            {stepsDescriptions[activeStep].text}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" data-testid="step-subtitle">
                            {stepsDescriptions[activeStep].subText}
                        </Typography>
                    </Box>
                    {activeStep !== 0 && (
                        <StyledCollapseButton
                            data-testid="collapse-all-button"
                            variant="outlined"
                            size="small"
                            startIcon={collapseAll[activeStep] ? <UnfoldMore /> : <UnfoldLess />}
                            onClick={handleCollapseAll}
                        >
                            {collapseAll[activeStep] ? "Expand All   " : "Collapse All"}
                        </StyledCollapseButton>
                    )}
                </StyledStepperContainer>

                <StyledContentWrapper data-testid={`content-wrapper-step-${activeStep}`}>
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
