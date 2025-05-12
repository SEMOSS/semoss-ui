import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import {
    styled,
    Switch,
    FormControlLabel,
    FormGroup,
    Typography,
    FormHelperText,
} from "@mui/material";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
    fontSize: "14px",
    fontWeight: 500,
}));

export interface SwitchBlockDef extends BlockDef<"switch"> {
    widget: "switch";
    data: {
        style: CSSProperties;
        label: string;
        value: boolean;
        disabled: boolean;
        color:
            | "primary"
            | "secondary"
            | "default"
            | "error"
            | "info"
            | "success"
            | "warning";
        size: "small" | "medium";
        helperText: string;
        required: boolean;
        labelPlacement: "start" | "end" | "top" | "bottom";
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
        onChange: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const SwitchBlock: BlockComponent = observer(({ id }) => {
    try {
        const { attrs, data, setData, listeners } =
            useBlock<SwitchBlockDef>(id);

        useEffect(() => {
            if (listeners.preProcess) {
                listeners.preProcess();
            }
        }, []);

        const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            setData("value", event.target.checked);

            listeners.onChange();
        };

        const showLabel = data.label && data.label.trim() !== "";
        const showHelperText = data.helperText && data.helperText.trim() !== "";

        return (
            <StyledContainer {...attrs} style={data.style}>
                <FormGroup>
                    {showLabel && !data.labelPlacement && (
                        <StyledLabel>{data.label}</StyledLabel>
                    )}

                    {showLabel && data.labelPlacement ? (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={data.value}
                                    onChange={handleChange}
                                    disabled={data.disabled}
                                    color={data.color}
                                    size={data.size}
                                    required={data.required}
                                />
                            }
                            label={data.label}
                            labelPlacement={data.labelPlacement}
                        />
                    ) : (
                        <Switch
                            checked={data.value}
                            onChange={handleChange}
                            disabled={data.disabled}
                            color={data.color}
                            size={data.size}
                            required={data.required}
                        />
                    )}

                    {showHelperText && (
                        <FormHelperText>{data.helperText}</FormHelperText>
                    )}
                </FormGroup>
            </StyledContainer>
        );
    } catch (error) {
        console.error("Error in SwitchBlock:", error);
        return <div>Error loading Switch component</div>;
    }
});
