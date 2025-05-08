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

const calculateItemWidth = (containerWidth, numItems, gap): string => {
    const totalGapSpace = (numItems - 1) * gap;
    const availableSpace = containerWidth - totalGapSpace;
    const itemWidth = availableSpace / numItems;
    return `${itemWidth}`;
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
        let gap = getValueByPath(data, "style.gap") as unknown as string;
        let rowSpacing = getValueByPath(
            data,
            "rowSpacing",
        ) as unknown as string;

        if (rowSpacing) rowSpacing = rowSpacing.slice(0, -2);
        if (gap) gap = gap.slice(0, -1);

        /**
         * Sync the data on change
         */
        const changeRowSpacing = (amount: string) => {
            setData("rowSpacing", `${amount}px`);

            const b = state.getBlock(id);

            if (b.slots.children.children.length) {
                b.slots.children.children.forEach(async (cId) => {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: cId,
                            path: "style.marginBottom",
                            value: `${amount}px`,
                        },
                    });
                });
            }
        };

        const modifyGrid = (val: string, g?: string) => {
            const b = state.getBlock(id);
            const width = calculateItemWidth(100, val, g ? g : gap) as string;

            const elsCount = parseInt(val as string);
            // Modify width of existing blocks in container
            if (b.slots.children.children.length) {
                b.slots.children.children.forEach(async (cId) => {
                    state.dispatch({
                        message: ActionMessages.SET_BLOCK_DATA,
                        payload: {
                            id: cId,
                            path: "style.width",
                            value: `${width}%`,
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
                                            width: `${width}%`,
                                            border: "solid blue",
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
                                        width: `${width}%`,
                                        border: "solid blue",
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

        // console.log(layoutType);
        // console.log("gd", gridDimension);
        // console.log("fd", flexDirection);
        // console.log("gap", gap);
        // console.log("rs", rowSpacing);
        // console.log(data);

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
                                value={rowSpacing}
                                onChange={(e) => {
                                    // sync the data on change
                                    changeRowSpacing(e.target.value);
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
                                value={"px"}
                                exclusive
                                size="small"
                            >
                                <ToggleButton
                                    key={"em"}
                                    value={"em"}
                                    disabled
                                    color={undefined}
                                >
                                    em
                                </ToggleButton>
                                <ToggleButton
                                    key={"px"}
                                    value={"px"}
                                    color={"primary"}
                                >
                                    px
                                </ToggleButton>
                                <ToggleButton
                                    key={"%"}
                                    value={"%"}
                                    disabled
                                    color={undefined}
                                >
                                    %
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </BaseSettingSection>
                        <BaseSettingSection label={"Gap"} wide>
                            <TextField
                                fullWidth
                                value={gap}
                                onChange={(e) => {
                                    // sync the data on change
                                    setData(
                                        "style.gap",
                                        `${e.target.value}%` as never,
                                    );

                                    modifyGrid(gridDimension, e.target.value);
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
                                value={"%"}
                                exclusive
                                size="small"
                            >
                                <ToggleButton
                                    key={"em"}
                                    value={"em"}
                                    disabled
                                    color={undefined}
                                >
                                    em
                                </ToggleButton>
                                <ToggleButton
                                    key={"px"}
                                    value={"px"}
                                    disabled
                                    color={undefined}
                                >
                                    px
                                </ToggleButton>
                                <ToggleButton
                                    key={"%"}
                                    value={"%"}
                                    color={"primary"}
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
