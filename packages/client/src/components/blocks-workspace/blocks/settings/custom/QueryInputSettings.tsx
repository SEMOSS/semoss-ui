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
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionMessages,
  type Block,
  type BlockDef,
  type CellState,
  getValueByPath,
  INPUT_BLOCK_TYPES,
  type Paths,
  type PathValue,
  type QueryState,
  useBlocks,
  type Variable,
  type VariableType,
} from "@semoss/renderer";
import {
  Accordion,
  Autocomplete,
  Divider,
  Icon,
  IconButton,
  List,
  Modal,
  Popper,
  Stack,
  styled,
  TextField,
  Typography,
  useNotification,
} from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
import { AddVariable } from "../../../../../assets/AddVariable";
import { Database } from "../../../../../assets/Database";
import { ModelBrain } from "../../../../../assets/ModelBrain";

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
        let value = "";
        if (v !== undefined && v !== null) {
          const sanitizedValues = v
            ?.toString()
            ?.split(" ")
            .map((val) => val.replace(/{{|}}/g, "").trim());
          const match = Object.values(state.variables);
          const matchedVariable = match.find(
            (variable) =>
              variable?.type === "block" && variable?.to === sanitizedValues[0]
          );
          const blockData = state.getBlock(
            sanitizedValues[1] ? sanitizedValues[1] : sanitizedValues[0]
          );
          const trimmedValue = v.toString()?.trim();
          if (
            !(
              trimmedValue?.toString()?.startsWith("{{") &&
              trimmedValue?.toString()?.endsWith("}}")
            )
          ) {
            value = v.toString();
          } else if (matchedVariable) {
            let matched =
              matchedVariable?.type === "block" && matchedVariable?.rename
                ? matchedVariable?.rename
                : matchedVariable?.to;
            value = " {{" + matched + "}} ".toString();
          } else if (blockData && blockData.data && blockData.data.id) {
            value = " {{" + blockData.data.id + "}} ".toString();
          }
        }
        if (typeof v === "undefined") {
          return "";
        } else if (typeof v === "string") {
          return value ? value : v;
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
    const onChange = (
      value: string,
      fromDropdowwn?: string,
      fromType?: boolean,
      fromSuggestion?: boolean
    ) => {
      const sanitizedValues = value
        .split(" ")
        .map((val) => val.replace(/{{|}}/g, "").trim());

      let updatedValue = value;
      let filteredValue = sanitizedValues.filter((val) => val !== "");
      const match = Object.values(state.variables);
        const matchBlock = Object.values(state.blocks);
        const matchedVariable = match.find(
          (variable) =>
            variable?.type === "block" && variable?.rename === filteredValue[0]
        );
      if (filteredValue.length > 1) {
        updatedValue = value;
      } 
      else if (fromDropdowwn !== undefined && fromDropdowwn !== null && fromDropdowwn !== "") {
        updatedValue = fromDropdowwn;
      } 
      else if (fromType === true || fromSuggestion === true) {

        if (fromType && !(value.startsWith("{{") && value.endsWith("}}"))) {
          updatedValue = value;
        } 
        else if (state.variables.hasOwnProperty(matchedVariable?.to)) {
          updatedValue = `{{${
            matchedVariable?.to ? matchedVariable?.to : filteredValue[0]
          }}}`;
        } 
        else if (state.variables.hasOwnProperty(filteredValue[0])) {
          updatedValue = `{{${
            matchedVariable?.rename ? matchedVariable?.rename : filteredValue[0]
          }}}`;
        } 
        else if (state.blocks.hasOwnProperty(filteredValue[0])) {
          const matchedBlock = matchBlock.find(
            (block) => block?.id === filteredValue[0]
          );
          updatedValue = matchedBlock?.id ? `{{${matchedBlock.id}}}` : value;
        } 
        else if (
          state?.blocks &&
          Object.values(state.blocks).some(
            (block: any) => block?.data?.id === filteredValue[0]
          )
        ) {
          const matchedBlock = Object.values(state.blocks).find(
            (block: any) => block?.data?.id === filteredValue[0]
          );
          updatedValue = matchedBlock?.data?.id
            ? `{{${matchedBlock?.data?.id}}}`
            : value;
        } 
      } else {
        const match = Object.values(state.blocks);
        const matchedBlock = match.find(
          (block) => block?.data?.id === filteredValue[0]
        );
        updatedValue = matchedBlock?.data?.id
          ? `{{${matchedBlock.id}}}`
          : value;
      }
     // set the value
      setValue(value);

      // clear out the old timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      timeoutRef.current = setTimeout(() => {
        try {
          setData(path, updatedValue as PathValue<D["data"], typeof path>);
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
            display:
              variable.type === "block"
                ? variable.rename && variable.rename != ""
                  ? variable.rename
                  : alias
                : alias,
            blockType: variable.type,
            variabilized: true,
            groupAlias: groupAliasMapper(variable.type),
          };

          if (variable.type === "query") {
            const q = state.getQuery(variable.to);
            if (q) {
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
          }

          if (variable.type === "cell") {
            const q = state.getQuery(variable.to);

            if (q) {
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
          }
        }
      );

      // iterate over the blocks
      Object.entries(state.blocks).forEach((keyValue: [string, Block]) => {
        let aliasRename = "";
        const variableName = state.getAlias(keyValue[0]);
        if (variableName !== "") {
          aliasRename = variableName;
        }
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
            display:
              aliasRename != "" && aliasRename != undefined
                ? aliasRename
                : block.data.id
                ? block.data.id
                : alias,
            blockType: "block",
            variabilized: Object.keys(state.variables).includes(alias),
            groupAlias: groupAliasMapper("block"),
          };
        }
      });

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
              variabilized: Object.keys(state.variables).includes(alias),
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
                    pathMap[`${alias}.${cellAlias}.${f}`] = {
                      id: `${alias}.${cellAlias}.${f}`,
                      path: `${alias}.${cellAlias}.${f}`,
                      type: typeof c[f], // TODO: get value
                      display: `${alias}.${cellAlias}.${f}`,
                      blockType: "cell-prop",
                      variabilized: true,
                      groupAlias: groupAliasMapper("cell-prop"),
                    };
                  }
                }
              }
            );
          }
        }
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
      let blockName = "";
      if (option.blockType === "block") {
        const block = state.getBlock(option.id);
        if (block && block?.data?.id) {
          blockName = block.data.id as string;
        }
      }
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
            option.blockType === "cell" ? option?.path?.split(".")[1] : null,
          type: option.blockType as VariableType,
          ...(option.blockType === "block" && { rename: blockName }),
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
                (DISPLAY_PRIORITY_MAP[optionMap[a]["blockType"]] || Infinity) -
                (DISPLAY_PRIORITY_MAP[optionMap[b]["blockType"]] || Infinity)
            )
            .map((option) => ({
              value: option,
              label: optionMap[option].display || option, // show displayName if present
            }))
            .filter((option) =>
              option.value.includes(
                wordArray[wordArray.length - 1]
                  .replace("{{", "")
                  .replace("}}", "")
              )
            );

      const suggestion = filteredOptions.length ? filteredOptions[0].label : "";

      const cursorIndex = inputRef?.current?.selectionStart ?? null;
      const textBeforeCursor = value?.substring(0, cursorIndex);
      const textAfterCursor = value?.substring(cursorIndex);

      const calculateTextWidth = () => {
        if (!measureRef.current) return 0;
        measureRef.current.textContent = textBeforeCursor;
        return measureRef.current.offsetWidth;
      };

      const textWidth = calculateTextWidth();
      const containerWidth = inputRef.current?.offsetWidth || 0;
      const suggestionScrollLeft = Math.max(0, textWidth - containerWidth + 20);

      const incompleteWordArray = textBeforeCursor
        .split(" ")
        .map((word) => word.replace("{{", "").replace("}}", ""));
      const suggestionToDisplay =
        suggestion && inputValue.length
          ? suggestion.replace(
              incompleteWordArray[incompleteWordArray.length - 1],
              ""
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
              onChange(updatedValue, "", true);
            }}
            onScroll={(e) => {
              if (suggestionRef.current)
                suggestionRef.current.scrollLeft = e.currentTarget.scrollLeft;
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
                onChange(completeValue, "", false, true);
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
                <span style={{ visibility: "hidden" }}>{textBeforeCursor}</span>
                <span style={{ color: "#999" }}>{suggestionToDisplay}</span>
              </div>
            </div>
          )}
        </div>
      );
    };

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
              <IconButton size="small" onClick={() => setOpen(true)}>
                <OpenInNew color="primary" />
              </IconButton>
            </Stack>
          </Stack>
          <Autocomplete
            fullWidth
            disableClearable={value === ""}
            size="small"
            freeSolo
            style={{ marginTop: "10px" }}
            multiple={false}
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
                const leftText = value.substring(0, cursorPosition);
                //text to right of cursor
                const rightText = value.substring(cursorPosition);
                const option = optionMap?.[val];
                const valf =
                  option.blockType === "cell"
                    ? option?.path?.split(".")[1] ?? option?.path
                    : option.blockType === "block"
                    ? option?.display
                      ? option?.display
                      : option?.path
                    : option?.path || "";
                const blockPath = " {{" + option?.path + "}} ";
                if (option?.path === undefined) {
                  onChange(
                    leftText +
                      (optionMap?.[val]?.id
                        ? optionMap?.[val]?.id
                        : valf.toString()) +
                      rightText
                  );
                } else {
                  // reform and submit
                  onChange(
                    leftText + " {{" + valf + "}} " + rightText,
                    blockPath
                  );
                }
                // if variablizable and not already variabilized, variablize the option
                if (!optionMap?.[val]?.variabilized) {
                  handleVariablize(optionMap?.[val]);
                }
              }
            }}
            filterOptions={(options, state) => {
              const words = state.inputValue.toLowerCase().split(" ");
              const res = options
                .sort(
                  (a, b) =>
                    (DISPLAY_PRIORITY_MAP[optionMap[a]["blockType"]] ||
                      Infinity) -
                    (DISPLAY_PRIORITY_MAP[optionMap[b]["blockType"]] ||
                      Infinity)
                )
                .filter((option) => {
                  const lowerCase = option.toLowerCase();
                  return words.some((word) =>
                    lowerCase.includes(word.toLowerCase())
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
                    <Typography variant="body2">{option.display}</Typography>
                    {/* TODO: Icon should actually reflect value data type */}
                    <Stack direction="row" alignItems={"center"}>
                      {!option.variabilized && (
                        <IconButton size="small" title="Add as variable">
                          <AddVariable />
                        </IconButton>
                      )}
                      {option.groupAlias === "Others" && (
                        <Icon>{getIcon(option.blockType)}</Icon>
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
                      if (params.group === expandedQueryInputGroup)
                        setExpandedQueryInputGroup(null);
                      else setExpandedQueryInputGroup(params.group);
                    }}
                    expanded={expandedQueryInputGroup === params.group}
                  >
                    <StyledMenuSectionTitle
                      expandIcon={<ExpandMore />}
                      aria-controls="panel1a-content"
                    >
                      <Typography variant="body2">{params.group}</Typography>
                    </StyledMenuSectionTitle>
                    <Accordion.Content>
                      <List disablePadding>{params.children}</List>
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
            Object.hasOwn(data, "type") && data.type === "date" ? "sm" : "lg"
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
                Object.hasOwn(data, "type") && data.type === "date" ? 1 : 15
              }
              value={value}
              onChange={(e) => {
                // sync the data on change
                onChange(e.target.value);
              }}
              type={
                Object.hasOwn(data, "type") && path === "value"
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
