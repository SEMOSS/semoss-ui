import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";

import {
    Stack,
    Typography,
    TextField,
    Icon,
    Modal,
    IconButton,
    Divider,
    styled,
    useNotification,
    Accordion,
    List,
} from "@semoss/ui";
import { Autocomplete, Popper } from "@mui/material";
import {
    CalendarMonth,
    Close,
    DataArray,
    DataObject,
    ExpandMore,
    Gesture,
    Inventory2Outlined,
    OpenInNew,
    SwitchAccessShortcutOutlined,
    TokenOutlined,
} from "@mui/icons-material";

import { Paths, PathValue } from "../../../types";
import { useBlockSettings, useBlocks } from "../../../hooks";
import {
    Block,
    BlockDef,
    CellState,
    QueryState,
    Variable,
    INPUT_BLOCK_TYPES,
    VariableType,
    ActionMessages,
} from "../../../store";
import { getValueByPath } from "../../../utility";
import { ModelBrain } from "../../../assets/ModelBrain";
import { Database } from "../../../assets/Database";
import { AddVariable } from "../../../assets/AddVariable";

interface QueryInputSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;

    /**
     * Settings label
     */
    label: string;
    /**
     * Default path map by default {}
     */
    defaultPathMap?: any;
}

interface Option {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * node path
     */
    path: string;
    /**
     * node value type
     */
    type: string;
    /**
     * option display
     */
    display: string;

    /**
     * type of block
     */
    blockType: "block" | "query" | "cell" | "query-prop" | "cell-prop" | "cell";

    /**
     * whether the option is variabilized
     * @type {boolean}
     * @default false
     */
    variabilized: boolean;

    /**
     * Group alias for grouping options
     * @type {string}
     * @default ""
     */
    groupAlias: string;
}

const StyledModalHeader = styled(Stack)(({ theme }) => ({
    padding: theme.spacing(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
}));

const StyledMenuSection = styled(Accordion)(({ theme }) => ({
    boxShadow: "none",
    borderRadius: "0 !important",
    border: "0px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:before": {
        display: "none",
    },
    "&.Mui-expanded": {
        margin: "0",
        "&:last-child": {
            borderBottom: "0px",
        },
    },
}));

const StyledMenuSectionTitle = styled(Accordion.Trigger)(({ theme }) => ({
    minHeight: "auto !important",
    height: theme.spacing(6),
}));

// Group name mapper function
const groupAliasMapper = (type: string) => {
    switch (type) {
        case "query":
            return "Notebook";
        case "cell":
            return "Cell";
        case "cell-prop":
            return "Cell Properties";
        case "block":
            return "Block";
        case "query-prop":
            return "Notebook Properties";
        default:
            return "Others";
    }
};

// Priority map for sorting
const DISPLAY_PRIORITY_MAP: Record<string, number> = {
    block: 1,
    query: 2,
    cell: 3,
    "query-prop": 4,
    "cell-prop": 5,
};

/**
 * Specifically for selecting a query for to associate with a UI block
 */
export const QueryInputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
        defaultPathMap = {},
    }: QueryInputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        console.log(data, "queryInputSettings");
        const { state, notebook } = useBlocks();
        const notification = useNotification();

        // track the value
        const [value, setValue] = useState("");
        // internal state of the input component
        const [inputValue, setInputValue] = useState("");
        // track the modal
        const [open, setOpen] = useState(false);
        // track the expanded accordion group
        const [expandedQueryInputGroup, setExpandedQueryInputGroup] = useState<
            string | null
        >(null);
        // Track the input ref to grab the cursor position
        const inputRef = useRef(null);
        const suggestionRef = useRef(null);
        const measureRef = useRef(null);
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }

                const v = getValueByPath(data, path);

                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
            setInputValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setValue(value);

            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, value as PathValue<D["data"], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const optionMap = useMemo<Record<string, Option>>(() => {
            const pathMap = {};
            const variabilizedList = [];

            // iterate over the variables
            Object.entries(state.variables).forEach(
                (keyValue: [string, Variable]) => {
                    const alias = keyValue[0];
                    const variable = keyValue[1];

                    const ref = state.getVariable(variable.to, variable.type);

                    // check if the variable is variabilized
                    if (
                        variable.type === "block" &&
                        !variabilizedList.includes(variable.to)
                    )
                        variabilizedList.push(variable.to);
                    else if (
                        variable.type === "cell" &&
                        !variabilizedList.includes(variable.cellId)
                    )
                        variabilizedList.push(variable.cellId);
                    else if (
                        variable.type === "query" &&
                        !variabilizedList.includes(variable.to)
                    )
                        variabilizedList.push(variable.to);

                    pathMap[alias] = {
                        id: alias,
                        path: alias,
                        type: typeof ref,
                        display: alias,
                        blockType: variable.type,
                        variabilized: true,
                        groupAlias: groupAliasMapper(variable.type),
                    };

                    if (variable.type === "query") {
                        const q = state.getQuery(variable.to);
                        for (const f in q._exposed) {
                            pathMap[`${alias}.${f}`] = {
                                id: `${alias}.${f}`,
                                path: `${alias}.${f}`,
                                type: typeof q[f], // TODO: get value
                                display: `${alias}.${f}`,
                                blockType: "query-prop",
                                variabilized: true,
                                groupAlias: groupAliasMapper("query-prop"),
                            };
                        }
                    }

                    if (variable.type === "cell") {
                        const q = state.getQuery(variable.to);
                        const c = q.getCell(variable.cellId);

                        for (const f in c._exposed) {
                            pathMap[`${alias}.${f}`] = {
                                id: `${alias}.${f}`,
                                path: `${alias}.${f}`,
                                type: typeof c[f], // TODO: get value
                                display: `${alias}.${f}`,
                                blockType: "cell-prop",
                                variabilized: true,
                                groupAlias: groupAliasMapper("cell-prop"),
                            };
                        }
                    }
                },
            );

            // iterate over the blocks
            Object.entries(state.blocks).forEach(
                (keyValue: [string, Block]) => {
                    const alias = keyValue[0];
                    const block = keyValue[1];
                    //filter only valid(variabilizable) blocks
                    if (
                        INPUT_BLOCK_TYPES.indexOf(block.widget) > -1 &&
                        !variabilizedList.includes(alias)
                    ) {
                        pathMap[alias] = {
                            id: alias,
                            path: alias,
                            type: typeof block,
                            display: alias,
                            blockType: "block",
                            variabilized: Object.keys(state.variables).includes(
                                alias,
                            ),
                            groupAlias: groupAliasMapper("block"),
                        };
                    }
                },
            );

            // iterate over the Queries
            Object.entries(state.queries).forEach(
                (keyValue: [string, QueryState]) => {
                    const alias = keyValue[0];
                    const query = keyValue[1];

                    if (!variabilizedList.includes(alias)) {
                        pathMap[alias] = {
                            id: alias,
                            path: alias,
                            type: typeof query,
                            display: alias,
                            blockType: "query",
                            variabilized: Object.keys(state.variables).includes(
                                alias,
                            ),
                            groupAlias: groupAliasMapper("query"),
                        };

                        const q = state.getQuery(alias);
                        for (const f in q._exposed) {
                            pathMap[`${alias}.${f}`] = {
                                id: `${alias}.${f}`,
                                path: `${alias}.${f}`,
                                type: typeof q[f], // TODO: get value
                                display: `${alias}.${f}`,
                                blockType: "query-prop",
                                variabilized: true,
                                groupAlias: groupAliasMapper("query-prop"),
                            };
                        }
                    }
                    // iterate over the un-variabilized cells
                    if (query.cellList.length > 0) {
                        Object.entries(query.cells).forEach(
                            (keyValue: [string, CellState]) => {
                                const cellAlias = keyValue[0];
                                const cell = keyValue[1];

                                if (!variabilizedList.includes(cell.id)) {
                                    pathMap[`${alias}.${cellAlias}`] = {
                                        id: `${alias}.${cellAlias}`,
                                        path: `${alias}.${cellAlias}`,
                                        type: typeof cell,
                                        display: `${alias}.${cellAlias}`,
                                        blockType: "cell",
                                        variabilized: false,
                                        groupAlias: groupAliasMapper("cell"),
                                    };

                                    const q = state.getQuery(alias);
                                    const c = q.getCell(cellAlias);

                                    for (const f in c._exposed) {
                                        pathMap[`${alias}.${cellAlias}.${f}`] =
                                            {
                                                id: `${alias}.${cellAlias}.${f}`,
                                                path: `${alias}.${cellAlias}.${f}`,
                                                type: typeof c[f], // TODO: get value
                                                display: `${alias}.${cellAlias}.${f}`,
                                                blockType: "cell-prop",
                                                variabilized: true,
                                                groupAlias:
                                                    groupAliasMapper(
                                                        "cell-prop",
                                                    ),
                                            };
                                    }
                                }
                            },
                        );
                    }
                },
            );
            //iterate over defaultPathMap if available
            if (Object.keys(defaultPathMap).length > 0) {
                Object.keys(defaultPathMap).forEach((key) => {
                    pathMap[key] = defaultPathMap[key];
                });
            }
            return pathMap;
        }, [state, notebook, value]);

        // handle 'input' changes vs 'selections'
        const handleInputChange = (event, newInputValue, reason) => {
            if (reason === "input") {
                setInputValue(newInputValue);
            } else if (newInputValue?.path && reason === "selectOption") {
                setInputValue((currentInputValue) => {
                    const cursorPosition = inputRef?.current
                        ? inputRef.current?.selectionStart
                        : null;
                    const leftText = value.substring(0, cursorPosition);
                    const rightText = value.substring(cursorPosition);

                    return leftText + " {{" + newInputValue + "}} " + rightText;
                });
            }
        };

        const getIndent = (type: Option["blockType"]) => {
            switch (type) {
                case "cell-prop":
                    return 2;
                case "query-prop":
                    return 2;
                case "cell":
                    return 1;
                case "query":
                    return 1;
                default:
                    return 0;
            }
        };

        /**
         * @name getIcon
         * Used for the Select Dropdown
         * TODO: Add the icons for other data types
         */
        const getIcon = (type: string) => {
            switch (type) {
                case "cell-prop":
                    return <DataObject />;
                case "query-prop":
                    return <DataObject />;
                case "cell":
                    return <DataObject />;
                case "query":
                    return <DataObject />;
                case "array":
                    return <DataArray />;
                case "string":
                    return <Gesture />;
                case "date":
                    return <CalendarMonth />;
                case "JSON":
                    return <DataObject />;
                case "vector":
                    return <TokenOutlined />;
                case "database":
                    return <Database color="black" />;
                case "model":
                    return <ModelBrain color="black" />;
                case "function":
                    return <SwitchAccessShortcutOutlined />;
                case "storage":
                    return <Inventory2Outlined />;
                default:
                    return <DataObject />;
            }
        };

        /**
         * @name handleVariablize
         * Adds a new variable to the state
         */
        const handleVariablize = (option: Option) => {
            // add variable
            const success = state.dispatch({
                message: ActionMessages.ADD_VARIABLE,
                payload: {
                    id:
                        option.blockType === "cell"
                            ? option?.path?.split(".")[1]
                            : option.id,
                    to:
                        option.blockType === "cell"
                            ? option?.path?.split(".")[0]
                            : option?.path,
                    cellId:
                        option.blockType === "cell"
                            ? option?.path?.split(".")[1]
                            : null,
                    type: option.blockType as VariableType,
                },
            });

            // Create notification
            notification.add({
                color: success ? "success" : "error",
                message: success
                    ? `Successfully added ${option.id} as a variable.`
                    : `Unable to add ${option.id}, due to syntax or a duplicated alias`,
            });
        };

        /**
         * Renders the input field with a suggestion feature.
         * @param {Object} params The props passed to the TextField component.
         * @returns {ReactElement} The rendered input field.
         */
        const renderInputField = (params) => {
            const wordArray = inputValue.split(" ");
            const filteredOptions = !inputValue
                ? []
                : Object.keys(optionMap)
                      .sort(
                          (a, b) =>
                              (DISPLAY_PRIORITY_MAP[
                                  optionMap[a]["blockType"]
                              ] || Infinity) -
                              (DISPLAY_PRIORITY_MAP[
                                  optionMap[b]["blockType"]
                              ] || Infinity),
                      )
                      .filter((option) =>
                          option.includes(
                              wordArray[wordArray.length - 1]
                                  .replace("{{", "")
                                  .replace("}}", ""),
                          ),
                      );

            const suggestion = filteredOptions.length ? filteredOptions[0] : "";

            const cursorIndex = inputRef?.current?.selectionStart ?? null;
            const textBeforeCursor = value.substring(0, cursorIndex);
            const textAfterCursor = value.substring(cursorIndex);

            const calculateTextWidth = () => {
                if (!measureRef.current) return 0;
                measureRef.current.textContent = textBeforeCursor;
                return measureRef.current.offsetWidth;
            };

            const textWidth = calculateTextWidth();
            const containerWidth = inputRef.current?.offsetWidth || 0;
            const suggestionScrollLeft = Math.max(
                0,
                textWidth - containerWidth + 20,
            );

            const incompleteWordArray = textBeforeCursor
                .split(" ")
                .map((word) => word.replace("{{", "").replace("}}", ""));
            const suggestionToDisplay =
                suggestion && inputValue.length
                    ? suggestion.replace(
                          incompleteWordArray[incompleteWordArray.length - 1],
                          "",
                      )
                    : "";

            return (
                <div style={{ position: "relative", overflow: "hidden" }}>
                    <TextField
                        {...params}
                        inputRef={inputRef}
                        fullWidth
                        placeholder="Enter text or select query"
                        onChange={(e) => {
                            const updatedValue = e.target.value;
                            setInputValue(updatedValue);
                            onChange(updatedValue);
                        }}
                        onScroll={(e) => {
                            if (suggestionRef.current)
                                suggestionRef.current.scrollLeft =
                                    e.currentTarget.scrollLeft;
                        }}
                        inputProps={{
                            ...params.inputProps,
                            style: {
                                whiteSpace: "nowrap",
                                overflowX: "auto",
                                scrollBehavior: "smooth",
                            },
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Tab" && suggestionToDisplay) {
                                e.preventDefault();
                                const textArr = textBeforeCursor.split(" ");
                                textArr.splice(-1, 1, `{{${suggestion}}}`);
                                const completeValue = textArr.join(" ");
                                onChange(completeValue);
                                setInputValue(completeValue);
                            }
                        }}
                    />
                    {suggestionToDisplay && !textAfterCursor && (
                        <div
                            ref={suggestionRef}
                            style={{
                                position: "absolute",
                                left: 0,
                                top: "37%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                color: "#999",
                                padding: "14px",
                                height: "100%",
                                width: "100%",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    position: "relative",
                                    whiteSpace: "nowrap",
                                    transform: `translateX(-${suggestionScrollLeft}px)`,
                                }}
                            >
                                <span style={{ visibility: "hidden" }}>
                                    {textBeforeCursor}
                                </span>
                                <span style={{ color: "#999" }}>
                                    {suggestionToDisplay}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        };
        console.log("show", value, "inputvalue", inputValue);
        return (
            <>
                <Stack>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="body2">{label}</Typography>
                        <Stack direction="row" alignItems="center">
                            {/* Neel pointed this out 3/31 */}
                            {/* <Typography variant="body1" color="primary">
                                Open text view
                            </Typography> */}
                            <IconButton
                                size="small"
                                onClick={() => setOpen(true)}
                            >
                                <OpenInNew color="primary" />
                            </IconButton>
                        </Stack>
                    </Stack>
                    <Autocomplete
                        fullWidth
                        disableClearable={value === ""}
                        size="small"
                        freeSolo
                        value={value}
                        inputValue={inputValue}
                        onInputChange={handleInputChange}
                        options={Object.keys(optionMap)}
                        getOptionLabel={(o: string) => {
                            return optionMap?.[o]?.path as string;
                        }}
                        onChange={(e, val) => {
                            // Reset
                            if (!val) {
                                onChange("");
                            } else {
                                // current cursor
                                const cursorPosition = inputRef?.current
                                    ? inputRef.current?.selectionStart
                                    : null;
                                // text to left of cursor
                                const leftText = value.substring(
                                    0,
                                    cursorPosition,
                                );
                                //text to right of cursor
                                const rightText =
                                    value.substring(cursorPosition);
                                const option = optionMap?.[val];
                                const valf =
                                    option.blockType === "cell"
                                        ? option?.path?.split(".")[1] ??
                                          option?.path
                                        : option?.path || "";
                                if (option?.path === undefined) {
                                    console.log(
                                        optionMap?.[val]?.id
                                            ? optionMap?.[val]?.id
                                            : valf.toString(),
                                        typeof optionMap?.[val]?.id,
                                        optionMap?.[val]?.id,
                                        valf.toString(),
                                    );
                                    onChange(
                                        leftText +
                                            (optionMap?.[val]?.id
                                                ? optionMap?.[val]?.id
                                                : valf.toString()) +
                                            rightText,
                                    );
                                } else {
                                    // reform and submit
                                    onChange(
                                        leftText +
                                            " {{" +
                                            valf +
                                            "}} " +
                                            rightText,
                                    );
                                }
                                // if variablizable and not already variabilized, variablize the option
                                if (!optionMap?.[val]?.variabilized) {
                                    handleVariablize(optionMap?.[val]);
                                }
                            }
                        }}
                        filterOptions={(options, state) => {
                            const words = state.inputValue
                                .toLowerCase()
                                .split(" ");
                            let res = options
                                .sort(
                                    (a, b) =>
                                        (DISPLAY_PRIORITY_MAP[
                                            optionMap[a]["blockType"]
                                        ] || Infinity) -
                                        (DISPLAY_PRIORITY_MAP[
                                            optionMap[b]["blockType"]
                                        ] || Infinity),
                                )
                                .filter((option) => {
                                    const lowerCase = option.toLowerCase();
                                    return words.some((word) =>
                                        lowerCase.includes(word.toLowerCase()),
                                    );
                                });
                            return res.length ? res : [];
                        }}
                        renderOption={(props, o) => {
                            const option = optionMap[o];
                            return (
                                <li {...props} key={option.path}>
                                    <Stack
                                        direction="row"
                                        justifyContent="space-between"
                                        alignItems="center"
                                        sx={{
                                            width: "100%",
                                            // pl: getIndent(option.blockType),
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {option.display}
                                        </Typography>
                                        {/* TODO: Icon should actually reflect value data type */}
                                        <Stack
                                            direction="row"
                                            alignItems={"center"}
                                        >
                                            {!option.variabilized && (
                                                <IconButton
                                                    size="small"
                                                    title="Add as variable"
                                                >
                                                    <AddVariable />
                                                </IconButton>
                                            )}
                                            {option.groupAlias === "Others" && (
                                                <Icon>
                                                    {getIcon(option.blockType)}
                                                </Icon>
                                            )}
                                        </Stack>
                                    </Stack>
                                </li>
                            );
                        }}
                        renderInput={(params) => renderInputField(params)}
                        groupBy={(option) => optionMap[option]?.groupAlias}
                        renderGroup={(params) => {
                            return (
                                <li key={params.key}>
                                    <StyledMenuSection
                                        onChange={() => {
                                            if (
                                                params.group ===
                                                expandedQueryInputGroup
                                            )
                                                setExpandedQueryInputGroup(
                                                    null,
                                                );
                                            else
                                                setExpandedQueryInputGroup(
                                                    params.group,
                                                );
                                        }}
                                        expanded={
                                            expandedQueryInputGroup ===
                                            params.group
                                        }
                                    >
                                        <StyledMenuSectionTitle
                                            expandIcon={<ExpandMore />}
                                            aria-controls="panel1a-content"
                                        >
                                            <Typography variant="body2">
                                                {params.group}
                                            </Typography>
                                        </StyledMenuSectionTitle>
                                        <Accordion.Content>
                                            <List disablePadding>
                                                {params.children}
                                            </List>
                                        </Accordion.Content>
                                    </StyledMenuSection>
                                </li>
                            );
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    "& .MuiAutocomplete-listbox": {
                                        padding: 0,
                                    },
                                },
                            },
                        }}
                    />
                </Stack>
                <Modal
                    open={open}
                    fullWidth
                    maxWidth={
                        data.hasOwnProperty("type") && data.type === "date"
                            ? "sm"
                            : "lg"
                    }
                >
                    <StyledModalHeader>
                        <Typography variant="h5">{`Edit ${label}`}</Typography>
                        <IconButton onClick={() => setOpen(false)}>
                            <Close />
                        </IconButton>
                    </StyledModalHeader>
                    <Divider />
                    <Modal.Content>
                        <TextField
                            fullWidth
                            placeholder="Enter Text..."
                            multiline
                            rows={
                                data.hasOwnProperty("type") &&
                                data.type === "date"
                                    ? 1
                                    : 15
                            }
                            value={value}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value);
                            }}
                            type={
                                data.hasOwnProperty("type") && path === "value"
                                    ? (data.type as string)
                                    : undefined
                            }
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                        />
                    </Modal.Content>
                </Modal>
            </>
        );
    },
);
