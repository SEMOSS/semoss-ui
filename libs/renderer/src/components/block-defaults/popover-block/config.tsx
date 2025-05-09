import { useState, useRef, useEffect } from "react";
import { Schema } from "@mui/icons-material";
import { Autocomplete } from "@mui/material";
import { Typography } from "@mui/material";

import { TextField } from "@semoss/ui";

import { Paths, PathValue } from "../../../types";
import { BaseSettingSection, ColorSettings } from "../../block-settings";
import { useBlocks, useBlockSettings } from "../../../hooks";
import { BlockConfig, Block, BlockDef } from "../../../store";
import { PopoverBlock, PopoverBlockDef } from "./PopoverBlock";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    buildSpacingSection,
    buildDimensionsSection,
    buildBorderSection,
    buildColorSection,
    buildListener,
} from "../block-defaults.shared";

const TRIGGER_OPTIONS = [
    { value: "click", label: "Click" },
    // TODO: Fix hover Trigger
    // { value: "hover", label: "Hover" },
];

const SettingAutocomplete = <D extends BlockDef>({
    id,
    path,
    options,
    initialValue,
    onValueChange,
}: {
    id: string;
    path: Paths<Block<D>["data"], 4>;
    options: Array<{ label: string; value: string }>;
    label: string;
    initialValue?: string;
    onValueChange?: (value: string) => void;
}) => {
    const { data, setData } = useBlockSettings<D>(id);
    const [selectedValue, setSelectedValue] = useState(
        data[path] || initialValue,
    );
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const setBlockData = (newValue: string | undefined) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        timeoutRef.current = setTimeout(() => {
            try {
                setData(path, newValue as PathValue<D["data"], typeof path>);
                setSelectedValue(newValue);
                if (onValueChange) {
                    onValueChange(newValue || "");
                }
            } catch (e) {
                console.log(e);
            }
        }, 300);
    };

    return (
        <Autocomplete
            fullWidth
            options={options}
            value={options.find((opt) => opt.value === selectedValue) || null}
            onChange={(_, newValue) => {
                setBlockData(newValue?.value);
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
            renderInput={(params) => (
                <TextField {...params} size="small" variant="outlined" />
            )}
        />
    );
};

const LayersDropdown = ({ id }) => {
    const { state } = useBlocks();

    // If getAllBlocksOfType isn't available, get all blocks from state
    const allBlocks = Object.values(state.blocks || {});

    const getAllBlock = allBlocks.map((block) => block.id);

    if (getAllBlock.length === 0) {
        return <Typography variant="body2">Layers panel not found</Typography>;
    }

    const options = getAllBlock.map((block) => {
        return {
            label: block,
            value: block,
        };
    });

    return (
        <BaseSettingSection label="Select a layer">
            <SettingAutocomplete
                id={id}
                path={"targetId"}
                options={options}
                label="Select a layer"
            />
        </BaseSettingSection>
    );
};

export default LayersDropdown;

export const config: BlockConfig<PopoverBlockDef> = {
    widget: "popover",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        designMode: true,
        targetId: null,

        open: "",
        openTrigger: "click",
    },
    listeners: {
        onOpen: {
            type: "sync",
            order: [],
        },
        onClose: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        header: [],
        content: [],
    },
    render: PopoverBlock,
    icon: Schema,

    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Design Mode",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Design Mode"
                            path="designMode"
                            description="Enable to edit modal content"
                        />
                    ),
                },

                {
                    description: "Layers",
                    render: ({ id }) => <LayersDropdown id={id} />,
                },
                {
                    description: "Trigger",
                    render: ({ id }) => (
                        <BaseSettingSection label="Trigger">
                            <SettingAutocomplete
                                id={id}
                                path="openTrigger"
                                options={TRIGGER_OPTIONS}
                                label="Trigger"
                            />
                        </BaseSettingSection>
                    ),
                },
            ],
        },
        {
            name: "Pre Process",
            children: [...buildListener("onOpen")],
        },
        {
            name: "Post Process",
            children: [...buildListener("onClose")],
        },
    ],
    styleMenu: [
        buildSpacingSection(),
        buildDimensionsSection(),
        {
            name: "Color",
            children: [
                {
                    description: "Background Color",
                    render: ({ id }) => (
                        <ColorSettings
                            id={id}
                            label="Background Color"
                            path="style.backgroundColor"
                        />
                    ),
                },
            ],
        },
        buildBorderSection(),
    ],
};
