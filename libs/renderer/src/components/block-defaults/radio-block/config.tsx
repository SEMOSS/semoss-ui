// config.tsx
import { useState, useRef, useEffect } from "react";
import { Block, BlockDef, BlockConfig } from "../../../store";
import { InputSettings } from "../../block-settings";
import { RadioBlock, RadioBlockDef } from "./RadioBlock";
import RadioButtonCheckedOutlinedIcon from "@mui/icons-material/RadioButtonCheckedOutlined";
import { buildListener } from "../block-defaults.shared";
import { BLOCK_TYPE_INPUT } from "../block-defaults.constants";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import {
    Autocomplete,
    Stack,
    Button,
    IconButton,
    Box,
    Typography,
} from "@mui/material";
import { BaseSettingSection } from "../../block-settings/BaseSettingSection";
import { useBlockSettings } from "../../../hooks";
import { TextField } from "@semoss/ui";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { Paths, PathValue } from "../../../types";

// Define options
const SIZE_OPTIONS = [
    { label: "Small", value: "small" },
    { label: "Medium", value: "medium" },
];

const DIRECTION_OPTIONS = [
    { label: "Row", value: "row" },
    { label: "Column", value: "column" },
];

const COLOR_OPTIONS = [
    { label: "Primary", value: "primary" },
    { label: "Secondary", value: "secondary" },
    { label: "Error", value: "error" },
    { label: "Info", value: "info" },
    { label: "Success", value: "success" },
    { label: "Warning", value: "warning" },
    { label: "Default", value: "default" },
];

const LABEL_PLACEMENT_OPTIONS = [
    { label: "Start", value: "start" },
    { label: "End", value: "end" },
    { label: "Top", value: "top" },
    { label: "Bottom", value: "bottom" },
];

const SettingAutocomplete = <D extends BlockDef>({
    id,
    path,
    options,
    initialValue,
}: {
    id: string;
    path: Paths<Block<D>["data"], 4>;
    options: Array<{ label: string; value: string }>;
    label: string;
    initialValue?: string;
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
            disableClearable
        />
    );
};

interface ConfigOption {
    id: string;
    label: string;
    value: string;
}

const OptionRow = ({
    label,
    value,
    onChange,
    onDelete,
}: {
    label: string;
    value: string;
    onChange?: (field: "label" | "value", value: string) => void;
    onDelete?: () => void;
}) => (
    <Box sx={{ width: "100%", mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Box flex={1}>
                <TextField
                    size="small"
                    value={label}
                    onChange={(e) => onChange?.("label", e.target.value)}
                    fullWidth
                />
            </Box>
            <Box flex={1}>
                <TextField
                    size="small"
                    value={value}
                    onChange={(e) => onChange?.("value", e.target.value)}
                    fullWidth
                />
            </Box>

            <IconButton onClick={onDelete} size="small">
                <CloseIcon />
            </IconButton>
        </Stack>
    </Box>
);

export const config: BlockConfig<RadioBlockDef> = {
    widget: "radio",
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: "4px",
        },
        value: "yes",
        label: "Radio Group",
        options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
        ],
        size: "medium",
        direction: "row",
        color: "primary",
        labelPlacement: "end",
        required: false,
        disabled: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: RadioBlock,
    icon: RadioButtonCheckedOutlinedIcon,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Options Management",
                    render: ({ id }) => {
                        const { data, setData } =
                            useBlockSettings<RadioBlockDef>(id);
                        const [nextId, setNextId] = useState(
                            data.options.length,
                        );
                        const [configOptions, setConfigOptions] = useState<
                            ConfigOption[]
                        >(() => {
                            // Initialize with default if no options exist
                            if (!data.options.length) {
                                return [
                                    {
                                        id: "option-0",
                                        label: "Default",
                                        value: "no_value",
                                    },
                                ];
                            }
                            return data.options.map((opt, index) => ({
                                id: `option-${index}`,
                                label: opt.label,
                                value: opt.value,
                            }));
                        });

                        // Ensure we always have at least one complete option
                        useEffect(() => {
                            const completeOptions = configOptions.filter(
                                (opt) => opt.label.trim() && opt.value.trim(),
                            );
                            if (completeOptions.length === 0) {
                                // Reset to default state
                                const defaultOption = {
                                    id: "option-0",
                                    label: "Default",
                                    value: "no_value",
                                };
                                setConfigOptions([defaultOption]);
                                setData("options", [
                                    { label: "Default", value: "no_value" },
                                ]);
                                setData("value", "no_value");
                            }
                        }, [configOptions]);

                        const handleOptionChange = (
                            optionId: string,
                            field: "label" | "value",
                            newValue: string,
                        ) => {
                            const updatedOptions = configOptions.map((opt) =>
                                opt.id === optionId
                                    ? { ...opt, [field]: newValue }
                                    : opt,
                            );
                            setConfigOptions(updatedOptions);

                            // Only update the actual radio options with options that have both label and value
                            const completeOptions = updatedOptions
                                .filter(
                                    (opt) =>
                                        opt.label.trim() && opt.value.trim(),
                                )
                                .map((opt) => ({
                                    label: opt.label,
                                    value: opt.value,
                                }));

                            if (completeOptions.length > 0) {
                                setData("options", completeOptions);
                            }

                            if (
                                field === "value" &&
                                data.value ===
                                    configOptions.find(
                                        (opt) => opt.id === optionId,
                                    )?.value
                            ) {
                                setData("value", newValue);
                            }
                        };

                        const handleAddOption = () => {
                            const newId = `option-${nextId}`;
                            const newOptions = [
                                ...configOptions,
                                { id: newId, label: "", value: "" },
                            ];
                            setConfigOptions(newOptions);
                            setNextId(nextId + 1);
                        };

                        const handleDeleteOption = (optionId: string) => {
                            const remainingOptions = configOptions.filter(
                                (opt) => opt.id !== optionId,
                            );

                            const completeRemainingOptions =
                                remainingOptions.filter(
                                    (opt) =>
                                        opt.label.trim() && opt.value.trim(),
                                );

                            if (completeRemainingOptions.length === 0) {
                                // If deleting would leave us with no complete options,
                                // reset to default state
                                const defaultOption = {
                                    id: "option-0",
                                    label: "Default",
                                    value: "no_value",
                                };
                                setConfigOptions([defaultOption]);
                                setData("options", [
                                    { label: "Default", value: "no_value" },
                                ]);
                                setData("value", "no_value");
                            } else {
                                setConfigOptions(remainingOptions);
                                setData(
                                    "options",
                                    completeRemainingOptions.map((opt) => ({
                                        label: opt.label,
                                        value: opt.value,
                                    })),
                                );

                                const deletedOption = configOptions.find(
                                    (opt) => opt.id === optionId,
                                );
                                if (data.value === deletedOption?.value) {
                                    setData(
                                        "value",
                                        completeRemainingOptions[0].value,
                                    );
                                }
                            }
                        };
                        // Find the current option object for the selected value
                        return (
                            <Box sx={{ width: "100%" }}>
                                {/* Headers */}
                                <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
                                    <Box flex={1}>
                                        <Typography
                                            variant="caption"
                                            fontWeight="medium"
                                        >
                                            Label
                                        </Typography>
                                    </Box>
                                    <Box flex={1}>
                                        <Typography
                                            variant="caption"
                                            fontWeight="medium"
                                        >
                                            Value
                                        </Typography>
                                    </Box>
                                    <Box width={40} />
                                </Box>

                                {/* Options */}
                                {configOptions.map((option) => (
                                    <OptionRow
                                        key={option.id}
                                        label={option.label}
                                        value={option.value}
                                        onChange={(field, value) =>
                                            handleOptionChange(
                                                option.id,
                                                field,
                                                value,
                                            )
                                        }
                                        onDelete={() =>
                                            handleDeleteOption(option.id)
                                        }
                                    />
                                ))}

                                {/* Add Button */}
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleAddOption}
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    sx={{ mb: 2 }}
                                >
                                    Add Option
                                </Button>

                                {/* Current Value Selection */}
                                <BaseSettingSection label="Selected Value">
                                    <Autocomplete
                                        value={
                                            configOptions.find(
                                                (opt) =>
                                                    opt.value === data.value,
                                            ) || null
                                        }
                                        options={configOptions.filter(
                                            (opt) =>
                                                opt.label.trim() &&
                                                opt.value.trim(),
                                        )}
                                        onChange={(_, newValue) => {
                                            if (newValue) {
                                                setData(
                                                    "value",
                                                    newValue.value,
                                                );
                                            }
                                        }}
                                        getOptionLabel={(option) =>
                                            option.label
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            option.value === value.value
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        fullWidth
                                    />
                                </BaseSettingSection>
                            </Box>
                        );
                    },
                },
                {
                    description: "Size",
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Size">
                                <SettingAutocomplete
                                    id={id}
                                    path="size"
                                    options={SIZE_OPTIONS}
                                    label="Size"
                                    initialValue="medium"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: "Direction",
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Direction">
                                <SettingAutocomplete
                                    id={id}
                                    path="direction"
                                    options={DIRECTION_OPTIONS}
                                    label="Direction"
                                    initialValue="row"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: "Color",
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Color">
                                <SettingAutocomplete
                                    id={id}
                                    path="color"
                                    options={COLOR_OPTIONS}
                                    label="Color"
                                    initialValue="primary"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: "Label Placement",
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Label Placement">
                                <SettingAutocomplete
                                    id={id}
                                    path="labelPlacement"
                                    options={LABEL_PLACEMENT_OPTIONS}
                                    label="Label Placement"
                                    initialValue="end"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: "Required",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Required"
                            path="required"
                        />
                    ),
                },
                {
                    description: "Disabled",
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Disabled"
                            path="disabled"
                        />
                    ),
                },
                {
                    description: "Label",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
            ],
        },
        {
            name: "on Change",
            children: [...buildListener("onChange")],
        },
    ],
    styleMenu: [],
};
