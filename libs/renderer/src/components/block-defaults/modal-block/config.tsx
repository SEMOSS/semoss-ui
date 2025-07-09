import { useState, useRef } from "react";
import { Schema } from "@mui/icons-material";
import { Autocomplete } from "@mui/material";

import { TextField } from "@semoss/ui";

import { BlockConfig, BlockDef, Block } from "../../../store";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ModalBlockDef, ModalBlock } from "./ModalBlock";
import { useBlockSettings } from "../../../hooks";
import { Paths, PathValue } from "../../../types";

// Size options for both min and max width
const WIDTH_OPTIONS = [
    { value: "xs", label: "Extra Small (444px)" },
    { value: "sm", label: "Small (600px)" },
    { value: "md", label: "Medium (900px)" },
    { value: "lg", label: "Large (1200px)" },
    { value: "xl", label: "Extra Large (1536px)" },
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

export const config: BlockConfig<ModalBlockDef> = {
    widget: "modal",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: {},
        title: "Modal Title",
        fullWidth: true,
        maxWidth: "sm",
        minWidth: "sm",
        designMode: true, // Default to design mode when first dropped
        open: "", // Default to closed
    },
    listeners: {
        preProcess: {
            type: "sync",
            order: [],
        },
        onClose: {
            type: "sync",
            order: [],
        },
    },
    slots: {
        content: [],
        footer: [], // New slot for footer content
    },
    render: ModalBlock,
};
