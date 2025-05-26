import { useEffect, useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "react-beautiful-dnd";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { DeleteOutline } from "@mui/icons-material";

import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
    styled,
    Button,
    TextField,
    Stack,
    Select,
    Autocomplete,
    Checkbox,
    Typography,
} from "@semoss/ui";
import { usePixel } from "@semoss/sdk/react";
import {
    ActionMessages,
    CellComponent,
    CellDef,
    CellState,
} from "../../../store";
import { useBlocks } from "../../../hooks";
import { BaseSettingSection } from "../../../components/block-settings/BaseSettingSection";
import { QueryImportCellDef } from "../query-import-cell";

const StyledSelect = styled(Select)(() => ({
    flex: 1,
    minWidth: 0,
}));
const StyledSelectItem = styled(Select.Item)(({ theme }) => ({}));
const StyledContent = styled("div")(({ theme }) => ({
    position: "relative",
    width: "100%",
}));
const EmptyContainer = styled("div")(() => ({}));
const LeftButtonContainer = styled("div")(() => ({
    display: "flex",
    gap: "10px",
    marginTop: "5px",
}));
const RightButtonContainer = styled("div")(() => ({
    justifyContent: "flex-end",
    display: "flex",
    gap: "10px",
    marginTop: "5px",
    marginRight: "15px",
}));
const AutoCompleteValueDiv = styled("div")(() => ({
    flex: 1,
}));
const MainContainer = styled("div")(() => ({
    paddingBottom: "20px",
    paddingLeft: "20px",
    paddingRight: "10px",
}));
const BorderContainer = styled("div")(() => ({
    border: "2px dotted #ccc",
    padding: "10px",
    margin: "10px",
    position: "relative",
}));
const StackContainer = styled("div")(() => ({
    display: "flex",
    width: "100%",
}));
const StackChildContainer = styled("div")(() => ({
    width: "inherit",
}));
const RuleButton = styled(Button)(() => ({}));
export interface TransformationTargetCell {
    id: string;
    frameVariableName: string;
}
export interface FilterDataCellDef extends CellDef<"filter-data"> {
    widget: "filter-data";
    parameters: {
        /** Ouput variable name */
        frameName: string;
        /** Select query rendered in the cell */
        filterQuery: string;
        targetCell: TransformationTargetCell;
    };
}
type Rule = {
    id: number;
    field: string;
    operator: string;
    value: string[] | number[];
};
type RuleGroup = {
    id: number;
    condition: "AND" | "OR";
    rules: (Rule | RuleGroup)[];
};
export const FilterDataCell: CellComponent<FilterDataCellDef> = observer(
    (props) => {
        const { cell } = props;
        const { state } = useBlocks();
        const [selectedFrameHeaders, setSelectedFrameHeaders] = useState([]);
        const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
        const [framelist, setFramelist] = useState([]);
        const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([
            {
                id: Date.now(),
                condition: "AND",
                rules: [{ id: Date.now(), field: "", operator: "", value: [] }],
            },
        ]);
        const [query, setQuery] = useState<string>(
            cell.parameters.filterQuery || "",
        );
        const [valueOptionsMap, setValueOptionsMap] = useState<
            Record<string | number, string[] | number[]>
        >({});
        /**
         * Cell that Transformation will be made to
         */
        const targetCell: CellState<QueryImportCellDef> = computed(() => {
            let c;
            Object.values(state.queries).forEach((query) => {
                if (query.cells[cell.parameters.targetCell.id]) {
                    c = query.cells[
                        cell.parameters.targetCell.id
                    ] as CellState<QueryImportCellDef>;
                }
            });
            return c;
        }).get();
        /**
         * Determines if Target Cell is a frame and is executed
         */
        const doesFrameExist: boolean = computed(() => {
            return (
                !!targetCell && (targetCell.isExecuted || !!targetCell.output)
            );
        }).get();
        useEffect(() => {
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: "parameters.filterQuery",
                    value: query,
                },
            });
        }, [query]);
        useEffect(() => {
            if (doesFrameExist && targetCell.isExecuted !== undefined) {
                handleTargetCellChange();
            }
        }, [targetCell?.isExecuted, doesFrameExist]);
        const myDbs =
            usePixel<{ app_id: string; app_name: string }[]>(`GetFrames();`);
        useEffect(() => {
            if (myDbs.status !== "SUCCESS") {
                return;
            }
            handleFrame();
            let query = parseQuery(cell.parameters.filterQuery);
            setRuleGroups(query);
        }, [myDbs.status]);
        useEffect(() => {
            setSelectedFrame(cell.parameters.frameName);
        }, [framelist]);
        const stringOperators = [
            { label: "Equals", value: "==" },
            { label: "Not Equals", value: "!=" },
        ];
        const numberOperators = [
            { label: "Equals", value: "==" },
            { label: "Not Equals", value: "!=" },
            { label: "Less Than", value: "<" },
            { label: "Less Than or Equal", value: "<=" },
            { label: "Greater Than", value: ">" },
            { label: "Greater Than or Equal", value: ">=" },
        ];
        async function handleTargetCellChange() {
            const parsedRules = parseQuery(query);
            setRuleGroups(parsedRules);
            const getFrames = await state.runSideEffect("GetFrames();");
            let list = getFrames["pixelReturn"][0]["output"] as string[];
            if (list.length > 0) {
                setFramelist((prev) => [...list]);
            }
            const headerResponse = await state.runSideEffect(
                `META | ${selectedFrame} | FrameHeaders();`,
            );
            if (headerResponse) {
                const headers = headerResponse["pixelReturn"][0]["output"][
                    "headerInfo"
                ]["headers"].map((element) => ({
                    name: element["displayName"],
                    type: element["dataType"],
                }));
                setSelectedFrameHeaders(headers);
            }
            const response = await state.runSideEffect(
                `META | Frame("${selectedFrame}") | QueryAll()| Limit(1000) | CollectAll()`,
            );
            let responseData = response["pixelReturn"][0]["output"]["data"];
            const headers = response["pixelReturn"][0]["output"][
                "headerInfo"
            ].map((element) => ({
                name: element["header"],
                type: element["dataType"],
            }));
            const fieldToValues: Record<string, any[]> = {};
            headers.forEach((name, index) => {
                const rawValues = responseData.values.map((row) => row[index]);
                const numbers: number[] = [];
                const strings: Set<string> = new Set();
                let hasNaNString = false;
                rawValues.forEach((val) => {
                    if (val === "NaN") {
                        hasNaNString = true; // Keep only one "NaN"
                    } else if (
                        !isNaN(Number(val)) &&
                        val !== null &&
                        val !== undefined &&
                        val !== ""
                    ) {
                        numbers.push(Number(val));
                    } else {
                        strings.add(String(val));
                    }
                });
                // Remove duplicates from numbers, sort ascending
                const uniqueSortedNumbers = Array.from(new Set(numbers)).sort(
                    (a, b) => a - b,
                );
                // Sort strings alphabetically
                const sortedStrings = Array.from(strings).sort((a, b) =>
                    a.localeCompare(b),
                );
                // Add single "NaN" if present
                if (hasNaNString) {
                    sortedStrings.unshift("NaN");
                }
                // Combine numbers first, then strings
                fieldToValues[name.name] = [
                    ...uniqueSortedNumbers,
                    ...sortedStrings,
                ];
            });
            setValueOptionsMap(fieldToValues);
            const usedFields = new Set<string>();
            const extractFields = (rules: (Rule | RuleGroup)[]) => {
                for (const rule of rules) {
                    if ("condition" in rule) extractFields(rule.rules);
                    else if (rule.field) usedFields.add(rule.field);
                }
            };
            parsedRules.forEach((group) => extractFields(group.rules));
        }
        function parseQuery(query: string): RuleGroup[] {
            query = query.replace(/\s+/g, " ").trim();
            const parseRule = (expression: string): Rule => {
                let expr = expression.trim();
                // Strip outer parentheses recursively
                while (expr.startsWith("(") && expr.endsWith(")")) {
                    const inner = expr.slice(1, -1).trim();
                    // If removing parens still leaves a valid rule, use it
                    if (/^\w+\s*[!=<>]+\s*\[.*?\]$/.test(inner)) {
                        expr = inner;
                        break;
                    }
                    expr = inner;
                }
                const match = expr.match(/^(\w+)\s*([!=<>]+)\s*(\[.*?\])$/);
                if (!match)
                    throw new Error("Invalid rule format: " + expression);
                const [, field, operator, valueRaw] = match;
                const parts = valueRaw
                    .replace(/[\[\]]/g, "")
                    .split(",")
                    .map((v) => v.trim().replace(/^["']|["']$/g, ""));
                const allAreNumbers = parts.every((p) => !isNaN(Number(p)));
                const value = allAreNumbers ? parts.map(Number) : parts;
                return {
                    id: Date.now() + Math.random(),
                    field,
                    operator,
                    value,
                };
            };
            const buildGroup = (expr: string): RuleGroup => {
                expr = expr.trim();
                if (expr.startsWith("(") && expr.endsWith(")")) {
                    expr = expr.slice(1, -1).trim();
                }
                let condition: "AND" | "OR" = "AND";
                const parts: (Rule | RuleGroup)[] = [];
                let buffer = "";
                let bracketCount = 0;
                let currentCondition: "AND" | "OR" | null = null;
                const flushBuffer = () => {
                    const trimmed = buffer.trim();
                    if (!trimmed) return;
                    const isGroup =
                        trimmed.includes("AND") || trimmed.includes("OR");
                    parts.push(
                        isGroup ? buildGroup(trimmed) : parseRule(trimmed),
                    );
                    buffer = "";
                };
                const tokens =
                    expr.match(/\(|\)|AND|OR|\[.*?\]|[^\s()]+/g) || [];
                for (let i = 0; i < tokens.length; i++) {
                    const token = tokens[i];
                    if (token === "(") bracketCount++;
                    if (token === ")") bracketCount--;
                    if (
                        (token === "AND" || token === "OR") &&
                        bracketCount === 0
                    ) {
                        flushBuffer();
                        if (!currentCondition)
                            currentCondition = token as "AND" | "OR";
                        else if (currentCondition !== token) {
                            throw new Error(
                                "Mixed operators at same level not supported.",
                            );
                        }
                        continue;
                    }
                    buffer += token + " ";
                }
                flushBuffer();
                return {
                    id: Date.now() + Math.random(),
                    condition: currentCondition ?? condition,
                    rules: parts,
                };
            };
            return [buildGroup(query)];
        }
        const handleConditionChange = (
            groupId: number,
            newCond: "AND" | "OR",
        ) => {
            const updateCondition = (groups: RuleGroup[]): RuleGroup[] => {
                return groups.map((group) => {
                    if (group.id === groupId) {
                        return { ...group, condition: newCond };
                    }
                    const updatedRules = group.rules.map((rule) => {
                        if ("condition" in rule) {
                            return updateCondition([rule])[0];
                        }
                        return rule;
                    });
                    return { ...group, rules: updatedRules };
                });
            };
            setRuleGroups((prev) => {
                const updated = updateCondition(prev);
                const newQuery = stringifyQuery(updated); // Convert updated rules back to query
                setQuery(newQuery); // Update the query state
                return updated;
            });
        };
        function stringifyQuery(groups: RuleGroup[]): string {
            const buildQueryString = (group: RuleGroup): string => {
                const ruleStr = group.rules
                    .map((rule) => {
                        if ("rules" in rule) {
                            return `(${buildQueryString(rule)})`; // For nested groups
                        }
                        const valueStr = rule.value
                            .map((v) => `[${v}]`)
                            .join(", ");
                        return `${rule.field} ${rule.operator} ${valueStr}`;
                    })
                    .join(` ${group.condition} `); // Join with AND/OR condition
                return ruleStr;
            };
            return groups.map(buildQueryString).join(" AND "); // You can modify the root condition here (AND by default)
        }
        const updateRules = (
            groups: RuleGroup[],
            groupId: number,
            updateFn: (rules: (Rule | RuleGroup)[]) => (Rule | RuleGroup)[],
            newCondition?: "AND" | "OR",
        ): RuleGroup[] => {
            return groups.map((group) => {
                if (group.id === groupId) {
                    return {
                        ...group,
                        rules: updateFn(group.rules),
                        condition: newCondition ?? group.condition, // Only update condition if provided
                    };
                } else {
                    return {
                        ...group,
                        rules: group.rules.map((rule) =>
                            "condition" in rule
                                ? updateRules(
                                      [rule],
                                      groupId,
                                      updateFn,
                                      newCondition,
                                  )[0]
                                : rule,
                        ),
                    };
                }
            });
        };
        const addRule = (groupId: number) => {
            setRuleGroups((prev) =>
                updateRules(prev, groupId, (rules) => [
                    ...rules,
                    { id: Date.now(), field: "", operator: "", value: [] },
                ]),
            );
        };
        const addNestedGroup = (groupId: number) => {
            setRuleGroups((prev) =>
                prev.map((group) =>
                    group.id === groupId
                        ? {
                              ...group,
                              rules: [
                                  ...group.rules,
                                  {
                                      id: Date.now(),
                                      condition: "AND", // Default condition for new groups
                                      rules: [
                                          {
                                              id: Date.now() + 1,
                                              field: "",
                                              operator: "",
                                              value: [],
                                          },
                                      ],
                                  },
                              ],
                          }
                        : {
                              ...group,
                              rules: group.rules.map((rule) =>
                                  "condition" in rule
                                      ? addNestedGroupToRule(rule, groupId)
                                      : rule,
                              ),
                          },
                ),
            );
        };
        const addNestedGroupToRule = (
            ruleGroup: RuleGroup,
            groupId: number,
        ): RuleGroup => {
            if (ruleGroup.id === groupId) {
                return {
                    ...ruleGroup,
                    rules: [
                        ...ruleGroup.rules,
                        {
                            id: Date.now(),
                            condition: "AND",
                            rules: [
                                {
                                    id: Date.now() + 1,
                                    field: "",
                                    operator: "",
                                    value: [],
                                },
                            ],
                        },
                    ],
                };
            } else {
                return {
                    ...ruleGroup,
                    rules: ruleGroup.rules.map((rule) =>
                        "condition" in rule
                            ? addNestedGroupToRule(rule, groupId)
                            : rule,
                    ),
                };
            }
        };
        const removeRuleOrGroup = (groupId: number, ruleId: number) => {
            const deepRemove = (
                rules: (Rule | RuleGroup)[],
            ): (Rule | RuleGroup)[] => {
                return rules
                    .filter((rule) => rule.id !== ruleId) // Remove the rule/group if it matches the ID
                    .map((rule) =>
                        "condition" in rule // If it's a group, recurse deeper
                            ? { ...rule, rules: deepRemove(rule.rules) }
                            : rule,
                    );
            };
            setRuleGroups((prev) => {
                const updatedRules = prev.map((group) => ({
                    ...group,
                    rules: deepRemove(group.rules),
                }));
                setQuery(buildQuery(updatedRules)); // Update query after deletion
                return updatedRules;
            });
        };
        const updateRuleValue = (
            groupId: number,
            ruleId: number,
            field: keyof Rule,
            value: string | number | (string | number)[],
        ) => {
            setRuleGroups((prev) => {
                const updatedRules = updateRules(prev, groupId, (rules) =>
                    rules.map((rule) => {
                        if ("condition" in rule) return rule;
                        if (rule.id === ruleId) {
                            const updatedRule: Rule = {
                                ...rule,
                                [field]: Array.isArray(value) ? value : value,
                            };
                            if (field === "field") {
                                const selectedFieldName = value as string;
                                const validOperators =
                                    getOperatorsForField(selectedFieldName);
                                const currentOperator = rule.operator;
                                updatedRule.value = [];
                                if (
                                    !currentOperator ||
                                    !validOperators.some(
                                        (op) => op.value === currentOperator,
                                    )
                                ) {
                                    updatedRule.operator = "==";
                                }
                            }
                            return updatedRule;
                        }
                        return rule;
                    }),
                );
                setQuery(buildQuery(updatedRules));
                return updatedRules;
            });
        };
        const buildQuery = (groups: RuleGroup[]): string => {
            const generate = (group: RuleGroup): string => {
                const conditions = group.rules
                    .map((rule) => {
                        if ("condition" in rule) {
                            return generate(rule); // Recursive for nested group
                        } else {
                            const valuePart = Array.isArray(rule.value)
                                ? `[${rule.value
                                      .map((v) =>
                                          typeof v === "string" ? `"${v}"` : v,
                                      )
                                      .join(", ")}]`
                                : typeof rule.value === "string"
                                ? `"${rule.value}"`
                                : rule.value;
                            return `(${rule.field} ${rule.operator} ${valuePart})`;
                        }
                    })
                    .join(` ${group.condition} `);
                return conditions ? `(${conditions})` : "";
            };
            return groups.map(generate).join(" AND ");
        };
        async function handleFrame() {
            const getFrames = await state.runSideEffect("GetFrames();");
            let list = getFrames["pixelReturn"][0]["output"] as string[];
            if (list.length > 0) {
                setFramelist((prev) => [...list]);
            }
        }
        async function handleFrameSelected(frameSelected) {
            setSelectedFrame(frameSelected);
            let target = frameSelected.match(/\d+/);
            const targetID = target ? parseInt(target[0], 10) : null;
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: "parameters.frameName",
                    value: frameSelected,
                },
            });
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: "parameters.targetCell",
                    value: {
                        id: targetID,
                        frameVariableName: frameSelected,
                    },
                },
            });
            resetAllRules();
        }
        const resetAllRules = () => {
            setRuleGroups((prev) => {
                if (prev.length === 0) return prev;
                // Keep only the top-level group and empty its rules
                const rootGroup = { ...prev[0], rules: [] };
                return [rootGroup];
            });
            setQuery(""); // Reset the query string
        };
        const helpText =
            !doesFrameExist && cell.parameters.targetCell.id
                ? `Run Cell ${cell.parameters.targetCell.id} to define the target frame variable before applying filter.`
                : "";
        const renderOption = (
            props: any,
            option: string | number,
            { selected }: any,
        ) => {
            const { ...optionProps } = props;
            return (
                <li {...optionProps}>
                    <Checkbox checked={selected} />
                    {option}
                </li>
            );
        };
        const getOperatorsForField = (fieldName: string) => {
            const field = selectedFrameHeaders.find(
                (h) => h.name === fieldName,
            );
            if (!field) return []; // fallback if field not found
            return field.type === "NUMBER" ? numberOperators : stringOperators;
        };
        const onDragEnd = (result: DropResult) => {
            if (!result.destination) return;
            const sourceGroupId = parseFloat(result.source.droppableId);
            const destGroupId = parseFloat(result.destination.droppableId);
            const sourceIndex = result.source.index;
            const destIndex = result.destination.index;
            if (sourceGroupId !== destGroupId) return; // only allow reordering within the same group
            setRuleGroups((prev) => {
                const updated = [...prev];
                const group = findGroupById(updated, sourceGroupId);
                if (!group) return prev;
                const rules = [...group.rules];
                const [movedRule] = rules.splice(sourceIndex, 1);
                rules.splice(destIndex, 0, movedRule);
                group.rules = rules;
                const newQuery = buildQuery(updated);
                setQuery(newQuery); // Update query immediately
                return [...updated];
            });
        };
        const findGroupById = (
            groups: RuleGroup[],
            groupId: number,
        ): RuleGroup | undefined => {
            for (const group of groups) {
                if (group.id === groupId) return group;
                for (const rule of group.rules) {
                    if ("condition" in rule) {
                        const found = findGroupById([rule], groupId);
                        if (found) return found;
                    }
                }
            }
            return undefined;
        };
        const renderRules = (group: RuleGroup, parentId?: number) => {
            return (
                <BorderContainer key={group.id}>
                    <Stack>
                        <StackContainer>
                            {/* Condition selector */}
                            {group.rules.length > 1 && (
                                <StyledSelect
                                    size={"small"}
                                    sx={{
                                        justifyContent: "center",
                                        flex: "none",
                                    }}
                                    value={group.condition}
                                    onChange={(e) => {
                                        const newCondition = e.target.value as
                                            | "AND"
                                            | "OR";
                                        handleConditionChange(
                                            group.id,
                                            newCondition,
                                        );
                                        setRuleGroups((prev) =>
                                            updateRules(
                                                prev,
                                                group.id,
                                                (rules) => rules,
                                                newCondition,
                                            ),
                                        );
                                    }}
                                >
                                    <StyledSelectItem value="AND">
                                        AND
                                    </StyledSelectItem>
                                    <StyledSelectItem value="OR">
                                        OR
                                    </StyledSelectItem>
                                </StyledSelect>
                            )}
                            {/* Render Rules with DragDropContext */}
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId={group.id.toString()}>
                                    {(provided) => (
                                        <StackChildContainer
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {group.rules.map((rule, index) =>
                                                "condition" in rule ? (
                                                    <EmptyContainer
                                                        key={rule.id}
                                                    >
                                                        {renderRules(
                                                            rule,
                                                            group.id,
                                                        )}
                                                    </EmptyContainer>
                                                ) : (
                                                    <Draggable
                                                        key={rule.id}
                                                        draggableId={rule.id.toString()}
                                                        index={index}
                                                    >
                                                        {(provided) => (
                                                            <EmptyContainer
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.draggableProps}
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    gap: "8px",
                                                                    padding:
                                                                        "12px 16px",
                                                                    alignItems:
                                                                        "center",
                                                                    ...provided
                                                                        .draggableProps
                                                                        .style,
                                                                }}
                                                            >
                                                                {/* Header Select */}
                                                                <StyledSelect
                                                                    size={
                                                                        "small"
                                                                    }
                                                                    disabled={
                                                                        cell.isLoading
                                                                    }
                                                                    title={
                                                                        "Select Header"
                                                                    }
                                                                    name="Select Header"
                                                                    label={
                                                                        "Select Header"
                                                                    }
                                                                    defaultValue={
                                                                        rule.field
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        const value =
                                                                            e
                                                                                .target
                                                                                .value;
                                                                        updateRuleValue(
                                                                            group.id,
                                                                            rule.id,
                                                                            "field",
                                                                            value,
                                                                        );
                                                                    }}
                                                                    sx={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    {selectedFrameHeaders.map(
                                                                        (
                                                                            framelist,
                                                                        ) => (
                                                                            <StyledSelectItem
                                                                                key={
                                                                                    framelist.name
                                                                                }
                                                                                value={
                                                                                    framelist.name ??
                                                                                    ""
                                                                                }
                                                                            >
                                                                                {framelist.name ??
                                                                                    ""}
                                                                            </StyledSelectItem>
                                                                        ),
                                                                    )}
                                                                </StyledSelect>
                                                                {/* Operator Select */}
                                                                <StyledSelect
                                                                    size={
                                                                        "small"
                                                                    }
                                                                    disabled={
                                                                        cell.isLoading
                                                                    }
                                                                    title={
                                                                        "Select Operator"
                                                                    }
                                                                    name="Select Operator"
                                                                    label={
                                                                        "Select Operator"
                                                                    }
                                                                    value={
                                                                        rule.operator
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) => {
                                                                        updateRuleValue(
                                                                            group.id,
                                                                            rule.id,
                                                                            "operator",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        );
                                                                    }}
                                                                    sx={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    {getOperatorsForField(
                                                                        rule.field,
                                                                    ).map(
                                                                        (
                                                                            op,
                                                                        ) => (
                                                                            <StyledSelectItem
                                                                                key={
                                                                                    op.value
                                                                                }
                                                                                value={
                                                                                    op.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    op.label
                                                                                }
                                                                            </StyledSelectItem>
                                                                        ),
                                                                    )}
                                                                </StyledSelect>
                                                                {/* Value Select */}
                                                                <AutoCompleteValueDiv
                                                                    style={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    <Autocomplete
                                                                        size="small"
                                                                        multiple
                                                                        renderOption={
                                                                            renderOption
                                                                        }
                                                                        options={
                                                                            valueOptionsMap[
                                                                                rule
                                                                                    .field
                                                                            ] ??
                                                                            []
                                                                        }
                                                                        value={
                                                                            Array.isArray(
                                                                                rule.value,
                                                                            )
                                                                                ? rule.value
                                                                                : []
                                                                        }
                                                                        onChange={(
                                                                            _,
                                                                            value,
                                                                        ) => {
                                                                            updateRuleValue(
                                                                                group.id,
                                                                                rule.id,
                                                                                "value",
                                                                                value,
                                                                            );
                                                                        }}
                                                                        renderInput={(
                                                                            params,
                                                                        ) => (
                                                                            <TextField
                                                                                {...params}
                                                                                label="Select Data"
                                                                            />
                                                                        )}
                                                                    />
                                                                </AutoCompleteValueDiv>
                                                                <EmptyContainer
                                                                    {...provided.dragHandleProps}
                                                                >
                                                                    <DragIndicatorIcon
                                                                        style={{
                                                                            cursor: "grab",
                                                                            color: "#888",
                                                                        }}
                                                                    />
                                                                </EmptyContainer>
                                                                {/* Delete Icon */}
                                                                <DeleteOutline
                                                                    style={{
                                                                        marginBottom:
                                                                            "7px",
                                                                    }}
                                                                    onClick={() =>
                                                                        removeRuleOrGroup(
                                                                            group.id,
                                                                            rule.id,
                                                                        )
                                                                    }
                                                                    fontSize="small"
                                                                />
                                                            </EmptyContainer>
                                                        )}
                                                    </Draggable>
                                                ),
                                            )}
                                            {provided.placeholder}
                                        </StackChildContainer>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </StackContainer>
                    </Stack>
                    {/* Action buttons */}
                    <EmptyContainer>
                        {parentId == undefined && (
                            <LeftButtonContainer>
                                <RuleButton onClick={() => addRule(group.id)}>
                                    + Add Rule
                                </RuleButton>
                                <RuleButton
                                    onClick={() => addNestedGroup(group.id)}
                                >
                                    + Add Nested Rule
                                </RuleButton>
                            </LeftButtonContainer>
                        )}
                        {parentId !== undefined && (
                            <RightButtonContainer>
                                <RuleButton onClick={() => addRule(group.id)}>
                                    + Add Rule
                                </RuleButton>
                                <RuleButton
                                    onClick={() => addNestedGroup(group.id)}
                                >
                                    + Add Nested Rule
                                </RuleButton>
                                <DeleteOutline
                                    style={{ marginTop: "5px" }}
                                    onClick={() =>
                                        removeRuleOrGroup(parentId, group.id)
                                    }
                                    fontSize="small"
                                />
                            </RightButtonContainer>
                        )}
                    </EmptyContainer>
                </BorderContainer>
            );
        };
        return (
            <StyledContent>
                <Stack direction="column" spacing={1}>
                    <MainContainer>
                        <BaseSettingSection label="Frame">
                            <Autocomplete
                                fullWidth
                                multiple={false}
                                disabled={cell.isLoading}
                                value={selectedFrame}
                                options={framelist}
                                getOptionLabel={(option) => {
                                    return option;
                                }}
                                onChange={(e, value) => {
                                    handleFrameSelected(value);
                                }}
                                freeSolo={false}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select Frame"
                                        size="small"
                                        variant="outlined"
                                    />
                                )}
                            />
                        </BaseSettingSection>
                    </MainContainer>
                    <EmptyContainer>
                        {doesFrameExist &&
                            ruleGroups.map((group) => renderRules(group))}
                    </EmptyContainer>
                    <Stack width="100%" paddingY={0.75}>
                        <Typography variant="caption">
                            <em>{helpText}</em>
                        </Typography>
                    </Stack>
                </Stack>
            </StyledContent>
        );
    },
);
