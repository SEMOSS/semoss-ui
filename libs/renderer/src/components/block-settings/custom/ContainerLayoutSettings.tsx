import { useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import {
    AlignHorizontalCenter,
    AlignHorizontalLeft,
    AlignHorizontalRight,
    ArrowDownward,
    ArrowForward,
    FormatAlignCenter,
    FormatAlignJustify,
    FormatAlignLeft,
    FormatAlignRight,
    FormatBold,
    FormatItalic,
    RestartAlt,
    FormatUnderlined,
    VerticalAlignBottom,
    VerticalAlignCenter,
    VerticalAlignTop,
    FormatLineSpacing,
    SpaceBar,
} from "@mui/icons-material";

import {
    MenuItem,
    Select,
    Stack,
    styled,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    ToggleTabsGroup,
    InputAdornment,
} from "@semoss/ui";

import { Paths, PathValue } from "../../../types";
import { useBlock, useBlocks, useBlockSettings } from "../../../hooks";
import { ActionMessages, Block, BlockDef, BlockJSON } from "../../../store";
import { getValueByPath } from "../../../utility";
import { BaseSettingSection } from "../BaseSettingSection";
import { ButtonGroupSettings, SizeSettings } from "../shared";

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    border: "1px",
    minHeight: "42px",
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: "center",
    padding: "0px 3px",
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    ">.MuiTabs-scroller": {
        display: "flex",
        justifyContent: "space-around",
    },
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: "38px",
    padding: "8px 11px",
    "&.MuiTab-root": {
        borderRadius: theme.shape.borderRadius,
    },
    "&.Mui-selected": {
        boxShadow: "0px 4px 4px 0px rgba(0, 0, 0, 0.05)",
    },
}));

const calculateItemWidth = (containerWidth, numItems, gap, unit): string => {
    const totalGapSpace = (numItems - 1) * gap;
    const availableSpace = containerWidth - totalGapSpace;
    const itemWidth = availableSpace / numItems;
    return `${itemWidth + unit}`;
};

interface ContainerLayoutSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
}

export const ContainerLayoutSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
    }: ContainerLayoutSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

        const gridDimension = getValueByPath(
            data,
            "dimension",
        ) as unknown as string;
        const layoutType = getValueByPath(data, "type") as unknown as string;
        const flexDirection = getValueByPath(
            data,
            "style.flexDirection",
        ) as unknown as string;

        // track the gap spacing with unit
        const [gapSpacing, setGapSpacing] = useState<{
            unit: "%" | "px" | "em" | "";
            value: string;
        }>({
            unit: "",
            value: "",
        });

        // track the row spacing with unit
        const [rowSpacing, setRowSpacing] = useState<{
            unit: "%" | "px" | "em" | "";
            value: string;
        }>({
            unit: "",
            value: "",
        });

        //get the row spacing value from the block
        const computedRowValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }

                const v = getValueByPath(data, "rowSpacing");
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data]).get();

        //get the gap spacing value from the block
        const computedGapValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }

                const v = getValueByPath(data, "style.gap");
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data]).get();

        //set the value of the row spacing input
        useEffect(() => {
            const r: typeof rowSpacing = {
                unit: "",
                value: "",
            };

            // get the unit
            if (computedRowValue.includes("%")) {
                r.unit = "%";
            } else if (computedRowValue.includes("px")) {
                r.unit = "px";
            } else if (computedRowValue.includes("em")) {
                r.unit = "em";
            }

            //remove the units from the computed value
            const amount = JSON.stringify(computedRowValue).replace(
                /[^0-9]/g,
                "",
            );

            if (r.unit) {
                r.value = amount;
            } else {
                r.value = computedRowValue;
            }

            setRowSpacing(r);
        }, [computedRowValue]);

        //set the value of the gap spacing input
        useEffect(() => {
            const r: typeof gapSpacing = {
                unit: "",
                value: "",
            };

            // get the unit
            if (computedGapValue.includes("%")) {
                r.unit = "%";
            } else if (computedGapValue.includes("px")) {
                r.unit = "px";
            } else if (computedGapValue.includes("em")) {
                r.unit = "em";
            }

            //remove the units from the computed value
            const amount = JSON.stringify(computedGapValue).replace(
                /[^0-9]/g,
                "",
            );

            if (r.unit) {
                r.value = amount;
            } else {
                r.value = computedGapValue;
            }

            setGapSpacing(r);
        }, [computedGapValue]);

        /**
         * Sync the data on change
         */
        const changeRowSpacing = (
            amount: string,
            unit: "%" | "px" | "em" | "",
        ) => {
            setRowSpacing({
                value: amount,
                unit: unit,
            });

            setData("rowSpacing", amount + unit);

            const b = state.getBlock(id);

            if (b.slots.children.children.length) {
                b.slots.children.children.forEach(async (cId) => {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: cId,
                            path: "style.marginBottom",
                            value: amount + unit,
                        },
                    });
                });
            }
        };

        const changeGapSpacing = (
            amount: string,
            unit: "%" | "px" | "em" | "",
        ) => {
            setGapSpacing({
                value: amount,
                unit: unit,
            });

            setData("style.gap", (amount + unit) as never);

            const b = state.getBlock(id);

            if (b.slots.children.children.length) {
                b.slots.children.children.forEach(async (cId) => {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: cId,
                            path: "style.gap",
                            value: amount + unit,
                        },
                    });
                });
            }
        };

        const modifyGrid = (val: string, gap?: string) => {
            const b: Block = state.getBlock(id);

            const width = calculateItemWidth(
                100,
                val,
                gap ? gap : gapSpacing.value,
                gapSpacing.unit,
            ) as string;

            const elsCount = parseInt(val as string);

            // Modify width of existing blocks in container
            if (b.slots.children.children.length) {
                b.slots.children.children.forEach(async (cId) => {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: cId,
                            path: "style.width",
                            value: `${width}`,
                        },
                    });
                });

                if (b.slots.children.children.length < elsCount) {
                    const leftOver = Array.from({
                        length: elsCount - b.slots.children.children.length,
                    });

                    const position = {
                        parent: b.id,
                        slot: "children",
                        sibling:
                            b.slots.children.children[
                                b.slots.children.children.length - 1
                            ],
                        type: "after",
                    };

                    leftOver.forEach(async () => {
                        // Add some blocks automatically for user
                        const id = await state.dispatch({
                            message: ActionMessages.ADD_BLOCK,
                            payload: {
                                json: {
                                    widget: "container",
                                    data: {
                                        style: {
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "8px",
                                            flexWrap: "wrap",
                                            width: `${width}`,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "12px",
                                            backgroundColor: "#ffffff",
                                            height: "120px",
                                        },
                                    },
                                    listeners: {
                                        preProcess: {
                                            type: "sync",
                                            order: [],
                                        },
                                    },
                                    slots: {
                                        children: [],
                                    },
                                } as BlockJSON,
                                position: position,
                            },
                        });

                        position["sibling"] = id as string;
                    });
                }
            } else {
                const l = Array.from({ length: parseInt(val as string) });
                const position = {
                    parent: b.id,
                    slot: "children",
                    sibling: "",
                    type: "after",
                };

                l.forEach(async () => {
                    // Add some blocks automatically for user
                    const id = await state.dispatch({
                        message: ActionMessages.ADD_BLOCK,
                        payload: {
                            json: {
                                widget: "container",
                                data: {
                                    style: {
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                        flexWrap: "wrap",
                                        width: `${width}`,
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "12px",
                                        backgroundColor: "#ffffff",
                                        height: "120px",
                                    },
                                },
                                listeners: {
                                    preProcess: {
                                        type: "sync",
                                        order: [],
                                    },
                                },
                                slots: {
                                    children: [],
                                },
                            } as BlockJSON,
                            position: position,
                        },
                    });

                    position["sibling"] = id as string;
                });
            }
        };

        return (
            <Stack gap={1}>
                <BaseSettingSection label="">
                    <StyledToggleTabsGroup
                        value={layoutType}
                        onChange={(e: React.SyntheticEvent, val: string) => {
                            setData("type", val);

                            if (val === "custom") {
                                setData("dimension", null);
                                setData(
                                    "style.flexDirection",
                                    "column" as never,
                                );
                                setData(
                                    "style.gap",
                                    "0px" as never,
                                );

                                const b: Block = state.getBlock(id);
                                // Go through each child and put marginBottom to 0px
                                b.slots.children.children.forEach((c) => {
                                    state.dispatch({
                                        message: ActionMessages.SET_BLOCK_DATA,
                                        payload: {
                                            id: c,
                                            path: "style.marginBottom",
                                            value: "0px",
                                        },
                                    });
                                });
                            } else {
                                setData("style.flexDirection", "row" as never);
                                setData("style.gap", "2%" as never);
                            }
                        }}
                    >
                        <StyledToggleTabsGroupItem
                            label="Custom"
                            value={"custom"}
                        />
                        <StyledToggleTabsGroupItem
                            label="Grid"
                            value={"grid"}
                        />
                    </StyledToggleTabsGroup>
                </BaseSettingSection>
                {layoutType === "grid" ? (
                    <Stack>
                        <BaseSettingSection label={"Column Count"}>
                            <Select
                                fullWidth
                                size="small"
                                value={gridDimension}
                                onChange={(e) => {
                                    setData("dimension", e.target.value);
                                    // sync the data on change
                                    modifyGrid(e.target.value);
                                }}
                            >
                                {/* <MenuItem value={"33.33%"}>3 columns</MenuItem>
                                <MenuItem value={"25%"}>4 columns</MenuItem>
                                <MenuItem value={"20%"}>5 columns</MenuItem>
                                <MenuItem value={"16.66%"}>6 columns</MenuItem> */}
                                <MenuItem value={"3"}>3 columns</MenuItem>
                                <MenuItem value={"4"}>4 columns</MenuItem>
                                <MenuItem value={"5"}>5 columns</MenuItem>
                                <MenuItem value={"6"}>6 columns</MenuItem>
                            </Select>
                        </BaseSettingSection>

                        <BaseSettingSection label={"Row Spacing"} wide>
                            <TextField
                                fullWidth
                                value={rowSpacing.value}
                                onChange={(e) => {
                                    // sync the data on change
                                    changeRowSpacing(
                                        e.target.value,
                                        rowSpacing.unit,
                                    );
                                }}
                                size="small"
                                variant="outlined"
                                autoComplete="off"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <FormatLineSpacing />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <ToggleButtonGroup
                                value={rowSpacing.unit}
                                exclusive
                                size="small"
                            >
                                <ToggleButton
                                    key={"em"}
                                    value={"em"}
                                    color={
                                        rowSpacing.unit === "em"
                                            ? "primary"
                                            : undefined
                                    }
                                    onClick={() => {
                                        changeRowSpacing(
                                            rowSpacing.value,
                                            "em",
                                        );
                                    }}
                                >
                                    em
                                </ToggleButton>
                                <ToggleButton
                                    key={"px"}
                                    value={"px"}
                                    color={
                                        rowSpacing.unit === "px"
                                            ? "primary"
                                            : undefined
                                    }
                                    onClick={() => {
                                        changeRowSpacing(
                                            rowSpacing.value,
                                            "px",
                                        );
                                    }}
                                >
                                    px
                                </ToggleButton>
                                <ToggleButton
                                    key={"%"}
                                    value={"%"}
                                    color={
                                        rowSpacing.unit === "%"
                                            ? "primary"
                                            : undefined
                                    }
                                    onClick={() => {
                                        changeRowSpacing(rowSpacing.value, "%");
                                    }}
                                >
                                    %
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </BaseSettingSection>
                        <BaseSettingSection label={"Gap"} wide>
                            <TextField
                                fullWidth
                                value={gapSpacing.value}
                                onChange={(e) => {
                                    // sync the data on change
                                    changeGapSpacing(
                                        e.target.value,
                                        gapSpacing.unit,
                                    );
                                }}
                                size="small"
                                variant="outlined"
                                autoComplete="off"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SpaceBar />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <ToggleButtonGroup
                                value={gapSpacing.unit}
                                exclusive
                                size="small"
                            >
                                <ToggleButton
                                    key={"em"}
                                    value={"em"}
                                    color={
                                        gapSpacing.unit === "em"
                                            ? "primary"
                                            : undefined
                                    }
                                    onClick={() => {
                                        changeGapSpacing(
                                            gapSpacing.value,
                                            "em",
                                        );
                                    }}
                                >
                                    em
                                </ToggleButton>
                                <ToggleButton
                                    key={"px"}
                                    value={"px"}
                                    color={
                                        gapSpacing.unit === "px"
                                            ? "primary"
                                            : undefined
                                    }
                                    onClick={() => {
                                        changeGapSpacing(
                                            gapSpacing.value,
                                            "px",
                                        );
                                    }}
                                >
                                    px
                                </ToggleButton>
                                <ToggleButton
                                    key={"%"}
                                    value={"%"}
                                    color={
                                        gapSpacing.unit === "%"
                                            ? "primary"
                                            : undefined
                                    }
                                    onClick={() => {
                                        changeGapSpacing(gapSpacing.value, "%");
                                    }}
                                >
                                    %
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </BaseSettingSection>
                    </Stack>
                ) : (
                    <Stack gap={1}>
                        <ButtonGroupSettings
                            id={id}
                            path="style.flexDirection"
                            label="Direction"
                            options={[
                                {
                                    value: "column",
                                    icon: ArrowDownward,
                                    title: "Column",
                                    isDefault: true,
                                },
                                {
                                    value: "row",
                                    icon: ArrowForward,
                                    title: "Row",
                                    isDefault: false,
                                },
                            ]}
                        />
                        <ButtonGroupSettings
                            id={id}
                            path="style.alignItems"
                            label={
                                flexDirection === "row"
                                    ? "Vertical Align"
                                    : "Horizontal Align"
                            }
                            options={[
                                {
                                    value: "start",
                                    icon:
                                        flexDirection === "row"
                                            ? VerticalAlignTop
                                            : AlignHorizontalLeft,
                                    title: "Top",
                                    isDefault: true,
                                },
                                {
                                    value: "center",
                                    icon:
                                        flexDirection === "row"
                                            ? VerticalAlignCenter
                                            : AlignHorizontalCenter,
                                    title: "Center",
                                    isDefault: false,
                                },
                                {
                                    value: "end",
                                    icon:
                                        flexDirection === "row"
                                            ? VerticalAlignBottom
                                            : AlignHorizontalRight,
                                    title: "Bottom",
                                    isDefault: false,
                                },
                            ]}
                        />
                        <ButtonGroupSettings
                            id={id}
                            path="style.justifyContent"
                            label={
                                flexDirection === "row"
                                    ? "Horizontal Align"
                                    : "Vertical Align"
                            }
                            options={[
                                {
                                    value: "left",
                                    icon:
                                        flexDirection === "row"
                                            ? AlignHorizontalLeft
                                            : VerticalAlignTop,
                                    title: "Top",
                                    isDefault: true,
                                },
                                {
                                    value: "center",
                                    icon:
                                        flexDirection === "row"
                                            ? AlignHorizontalCenter
                                            : VerticalAlignCenter,
                                    title: "Center",
                                    isDefault: false,
                                },
                                {
                                    value: "right",
                                    icon:
                                        flexDirection === "row"
                                            ? AlignHorizontalRight
                                            : VerticalAlignBottom,
                                    title: "Right",
                                    isDefault: false,
                                },
                            ]}
                        />
                        <SizeSettings id={id} label="Gap" path="style.gap" />
                    </Stack>
                )}
            </Stack>
        );
    },
);
