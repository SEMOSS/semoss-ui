import { useState, useRef } from "react";
import {
    HighlightAlt,
    AlignHorizontalCenter,
    AlignHorizontalLeft,
    AlignHorizontalRight,
    ArrowDownward,
    ArrowForward,
    VerticalAlignBottom,
    VerticalAlignCenter,
    VerticalAlignTop,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";

import {
    buildLayoutSection,
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
    buildPositionSection,
} from "../block-defaults.shared";
import {
    BlockComponent,
    BlockConfig,
    Block,
    BlockDef,
    ActionMessages,
} from "../../../store";
import { useBlocks, useBlockSettings } from "../../../hooks";
import { Paths, PathValue } from "../../../types";
import { MenuItem, Select, Stack, ToggleTabsGroup, styled } from "@semoss/ui";
import { ButtonGroupSettings } from "../../block-settings/shared/ButtonGroupSettings";
import { SizeSettings } from "../../block-settings/shared/SizeSettings";

import { ContainerBlockDef, ContainerBlock } from "./ContainerBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

const StyledContainer = styled("div")(() => ({
    maxHeight: "50vh",
}));
const StyledSubSection = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
}));
const StyledToolsSection = styled("div")(() => ({
    display: "flex",
    justifyContent: "space-around",
    width: "100%",
}));
const StyledStack = styled(Stack)(() => ({
    padding: "12px",
    gap: "8px",
}));
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

interface ContainerGridSectionProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>["data"]>;
}

export const ContainerGridSection = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
    }: ContainerGridSectionProps<D>) => {
        const { data, setData } = useBlockSettings<ContainerBlockDef>(id);
        const { state } = useBlocks();

        //get the parent container of the grouped containers
        const parentContainer: Block = state.getBlock(id);

        // track the value of the layout dropdown
        const [value, setValue] = useState("");

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value of the grid layout dropdown
            setValue(value);

            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            // iterate through each slot of the parent
            Object.entries(parentContainer.slots).forEach((slot) => {
                // set the new width of each child container
                slot[1].children.forEach((child) => {
                    timeoutRef.current = setTimeout(() => {
                        try {
                            // set the value
                            setData("style.flex", value);

                            // emit event to set child block data
                            state.dispatch({
                                message: ActionMessages.SET_BLOCK_DATA,
                                payload: {
                                    id: child,
                                    path: path,
                                    value: value,
                                },
                            });
                        } catch (e) {
                            console.log(e);
                        }
                    }, 300);
                });
            });
        };

        return (
            <Select
                fullWidth
                size="small"
                value={value}
                onChange={(e) => {
                    // sync the data on change
                    onChange(e.target.value);
                }}
                label={"Grid Layout"}
            >
                <MenuItem value={"0 0 33.33%"}>3x3</MenuItem>
                <MenuItem value={"0 0 25%"}>4x4</MenuItem>
                <MenuItem value={"0 0 20%"}>5x5</MenuItem>
                <MenuItem value={"0 0 16.66%"}>6x6</MenuItem>
            </Select>
        );
    },
);

export const ContainerMenu: BlockComponent = observer(({ id }) => {
    const [selectedTab, setSelectedTab] = useState("Custom");

    return (
        <StyledStack>
            <StyledToggleTabsGroup
                value={selectedTab}
                onChange={(e: React.SyntheticEvent, val: string) => {
                    setSelectedTab(val);
                }}
            >
                <StyledToggleTabsGroupItem label="Custom" value={"Custom"} />
                <StyledToggleTabsGroupItem label="Grid" value={"Grid"} />
            </StyledToggleTabsGroup>
            <StyledContainer>
                {selectedTab === "Custom" && (
                    <StyledSubSection>
                        <ButtonGroupSettings
                            id={id}
                            path="style.alignItems"
                            label="Vertical Align"
                            options={[
                                {
                                    value: "start",
                                    icon: VerticalAlignTop,
                                    title: "Top",
                                    isDefault: true,
                                },
                                {
                                    value: "center",
                                    icon: VerticalAlignCenter,
                                    title: "Center",
                                    isDefault: false,
                                },
                                {
                                    value: "end",
                                    icon: VerticalAlignBottom,
                                    title: "Bottom",
                                    isDefault: false,
                                },
                            ]}
                        />
                        <ButtonGroupSettings
                            id={id}
                            path="style.justifyContent"
                            label="Horizontal Align"
                            options={[
                                {
                                    value: "left",
                                    icon: AlignHorizontalLeft,
                                    title: "Top",
                                    isDefault: true,
                                },
                                {
                                    value: "center",
                                    icon: AlignHorizontalCenter,
                                    title: "Center",
                                    isDefault: false,
                                },
                                {
                                    value: "right",
                                    icon: AlignHorizontalRight,
                                    title: "Right",
                                    isDefault: false,
                                },
                            ]}
                        />
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
                        <SizeSettings id={id} label="Gap" path="style.gap" />

                        {/* TODO having an issue rendering these */}
                        {/* {[
                                buildLayoutSection(),
                                buildPositionSection(),
                                buildSpacingSection(),
                                buildDimensionsSection(),
                                buildColorSection(),
                                buildBorderSection(),
                            ]} */}
                    </StyledSubSection>
                )}
                {selectedTab === "Grid" && (
                    <StyledToolsSection>
                        <ContainerGridSection id={id} path={"style.flex"} />
                    </StyledToolsSection>
                )}
            </StyledContainer>
        </StyledStack>
    );
});

// export the config for the block
export const config: BlockConfig<ContainerBlockDef> = {
    widget: "container",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {
            display: "flex",
            flexDirection: "column",
            padding: "4px",
            gap: "8px",
            flexWrap: "wrap",
        },
        show: "true",
    },
    listeners: {},
    slots: {
        children: [],
    },
    render: ContainerBlock,
    icon: HighlightAlt,
    contentMenu: [],
    styleMenu: [],
    menu: ContainerMenu,
};

// const test () => {
//     useEffect (() => {
//     }, [block.data.type])

//     return(
//         <>
//         {
//             if block.data.type == grid ?
//             <CustomSetting/>
//         :
//         buildLayoutSection(),
//         buildPositionSection(),
//         buildSpacingSection(),
//         buildDimensionsSection(),
//         buildColorSection(),
//         buildBorderSection(),
// }
//         </>
//     )
// }

// CustomSetting {
//     const state = useBlocks
//     useEffect(() => (
//         if(3x3){
//             100/3 this is the width,
//             go through each child of the block
//             state.dispatch({
//                 message : updateBlockdata,
//                 payload : {
//                     id: children block id,
//                     value: 33%,
//                     path: "data.style.width"
//                 }

//             })
//         }
//     ), [select.value])
//     return (
//         <>
//         <Select />
//         Menu Item :
//         Menu Item= 3x3, 4x4 ...
//         </>
//     )
// }
