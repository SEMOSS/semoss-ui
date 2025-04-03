// RadioBlock.tsx
import { CSSProperties } from "react";
import { observer } from "mobx-react-lite";
import {
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Box,
} from "@mui/material";
import { useBlock } from "../../../hooks";
import { BlockComponent, BlockDef } from "../../../store";

export interface RadioBlockDef extends BlockDef<"radio"> {
    widget: "radio";
    data: {
        style: CSSProperties;
        value: string;
        label: string;
        options: Array<{ label: string; value: string }>;
        size: "small" | "medium";
        direction: "row" | "column";
        color:
            | "primary"
            | "secondary"
            | "error"
            | "info"
            | "success"
            | "warning"
            | "default";
        labelPlacement: "start" | "end" | "top" | "bottom";
        required: boolean;
        disabled: boolean;
        show: string;
    };
    listeners: {
        onChange: true;
    };
}

export const RadioBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<RadioBlockDef>(id);

    // Handle radio button change
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setData("value", event.target.value);
        listeners.onChange();
    };

    return (
        <Box padding={1} {...attrs}>
            <FormControl
                component="fieldset"
                required={data.required}
                disabled={data.disabled}
                fullWidth
                style={{ padding: "8px" }}
            >
                {data.label && (
                    <FormLabel component="legend">{data.label}</FormLabel>
                )}
                <RadioGroup
                    value={data.value}
                    onChange={handleChange}
                    row={data.direction === "row"}
                >
                    {(data.options || []).map((option) => (
                        <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={
                                <Radio
                                    size={data.size}
                                    color={data.color}
                                    style={{
                                        ...data.style,
                                    }}
                                />
                            }
                            label={option.label}
                            labelPlacement={data.labelPlacement}
                        />
                    ))}
                </RadioGroup>
            </FormControl>
        </Box>
    );
});
