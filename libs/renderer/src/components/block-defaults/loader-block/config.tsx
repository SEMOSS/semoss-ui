import { useEffect, useState } from "react";
import { BlockConfig } from "../../../store";
import { SelectInputSettings } from "../../block-settings/shared/SelectInputSettings";
import {
    BaseSettingSection,
    SizeSettings,
} from "../../../components/block-settings";
import { InputNumberSettings } from "../../../components/block-settings/shared/InputNumberSettings";
import { HighlightAlt } from "@mui/icons-material";
import { Select, MenuItem } from "@semoss/ui";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { LoaderBlock, LoaderBlockDef } from "./LoaderBlock";
import { useBlockSettings } from "../../../hooks/useBlockSettings";
import { buildListener, buildShowField } from "../block-defaults.shared";

// Define options for loader types
const loaderTypeOptions = [
    { value: "circular", display: "Circular" },
    { value: "linear", display: "Linear" },
    { value: "skeleton", display: "Skeleton" },
];

// Define options for loader variants
const variantOptionsMap: Record<string, { value: string; display: string }[]> =
    {
        circular: [{ value: "indeterminate", display: "Indeterminate" }],
        linear: [
            { value: "query", display: "Query" },
            { value: "indeterminate", display: "Indeterminate" },
        ],
        skeleton: [
            { value: "text", display: "Text" },
            { value: "rectangular", display: "Rectangular" },
            { value: "circular", display: "Circular" },
            { value: "rounded", display: "Rounded" },
        ],
    };

// Define options for loader colors
const colorOptions = [
    { value: "primary", display: "Primary" },
    { value: "secondary", display: "Secondary" },
    { value: "error", display: "Error" },
    { value: "info", display: "Info" },
    { value: "success", display: "Success" },
    { value: "warning", display: "Warning" },
    { value: "inherit", display: "Inherit" },
];

// Define options for loader animations
const animationOptions = [
    { value: "pulse", display: "Pulse" },
    { value: "wave", display: "Wave" },
    { value: "false", display: "False" },
];

// export the config for the block
export const config: BlockConfig<LoaderBlockDef> = {
    widget: "loader",
    type: BLOCK_TYPE_LAYOUT,
    data: {
        style: { width: "fit-content", padding: "4px" },
        color: "primary",
        size: 40,
        thickness: 3.6,
        show: "true",
        variant: "indeterminate",
        type: "circular",
        width: "",
        height: "",
        animation: "pulse",
    },
    listeners: { preProcess: { type: "sync", order: [] } },
    slots: {},
    render: LoaderBlock,
    icon: HighlightAlt,
    contentMenu: [
        { name: "Conditional", children: [...buildShowField()] },
        { name: "Pre Process", children: [...buildListener("preProcess")] },
    ],
    styleMenu: [
        {
            name: "Loader",
            children: [
                {
                    description: "Loader Type",
                    render: ({ id }) => {
                        const { data, setData } = useBlockSettings<any>(id);
                        const [loaderType, setLoaderType] = useState<string>(
                            data?.type || "",
                        );
                        const [variant, setVariant] = useState<string>(
                            data?.variant || "",
                        );

                        useEffect(() => {
                            setLoaderType(data?.type || "circular");
                            setVariant(data?.variant || "indeterminate");
                        }, [id, data?.type, data?.variant]);

                        // Helper function to handle type change and reset associated values
                        const onTypeChange = (value: string) => {
                            setLoaderType(value);
                            setData("type", value);
                            const defaultVariant =
                                variantOptionsMap[value]?.[0]?.value || "";
                            setVariant(defaultVariant);
                            setData("variant", defaultVariant);
                            resetLoaderData(setData);
                        };

                        // Reset loader data (thickness, size, etc.) on type change
                        const resetLoaderData = (setData: any) => {
                            setData("thickness", 3.6);
                            setData("size", 40);
                            setData("width", "");
                            setData("height", "");
                            setData("color", "inherit");
                        };

                        // Handle variant change
                        const onVariantChange = (value: string) => {
                            setData("variant", value);
                            setVariant(value);
                        };

                        const currentVariantOptions =
                            variantOptionsMap[loaderType] || [];

                        return (
                            <>
                                <BaseSettingSection label="Loader Type" wide>
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={loaderType}
                                        onChange={(e) =>
                                            onTypeChange(e.target.value)
                                        }
                                    >
                                        {loaderTypeOptions.map((option, i) => (
                                            <MenuItem
                                                key={i}
                                                value={option.value}
                                            >
                                                {option.display}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </BaseSettingSection>
                                <BaseSettingSection label="Variant" wide>
                                    <Select
                                        fullWidth
                                        size="small"
                                        value={variant}
                                        onChange={(e) =>
                                            onVariantChange(e.target.value)
                                        }
                                    >
                                        {currentVariantOptions.map(
                                            (option, i) => (
                                                <MenuItem
                                                    key={i}
                                                    value={option.value}
                                                >
                                                    {option.display}
                                                </MenuItem>
                                            ),
                                        )}
                                    </Select>
                                </BaseSettingSection>
                                {loaderType === "circular" && (
                                    <>
                                        <InputNumberSettings
                                            id={id}
                                            label="Thickness"
                                            path="thickness"
                                        />
                                        <InputNumberSettings
                                            id={id}
                                            label="Size"
                                            path="size"
                                        />
                                        <SelectInputSettings
                                            id={id}
                                            path="color"
                                            label="Color"
                                            options={colorOptions}
                                        />
                                    </>
                                )}
                                {loaderType === "skeleton" && (
                                    <>
                                        <SizeSettings
                                            id={id}
                                            label="Width"
                                            path="width"
                                        />
                                        <SizeSettings
                                            id={id}
                                            label="Height"
                                            path="height"
                                        />
                                        <SelectInputSettings
                                            id={id}
                                            path="animation"
                                            label="Animation"
                                            options={animationOptions}
                                        />
                                    </>
                                )}
                                {loaderType === "linear" && (
                                    <SelectInputSettings
                                        id={id}
                                        path="color"
                                        label="Color"
                                        options={colorOptions}
                                    />
                                )}
                            </>
                        );
                    },
                },
            ],
        },
    ],
};
