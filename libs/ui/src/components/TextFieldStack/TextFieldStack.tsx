import { useEffect, useState } from "react";
import {
    TextField as MuiTextField,
    TextFieldProps as MuiTextFieldProps,
    SxProps,
    InputLabel,
    Typography,
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import styled from "@emotion/styled";

export type TextFieldStackProps = MuiTextFieldProps & {
    /** custom style object */
    sx?: SxProps;
};

const StyledInputLabel = styled(InputLabel)(({}) => ({
    display: "flex",
    flexDirection: "row",
    gap: "4px",
    marginBottom: "8px",
}));

const StyledTypography = styled(Typography)(({}) => ({
    color: "#666666",
    fontFamily: "Inter",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "143%" /* 20.02px */,
    letterSpacing: "0.17px",
}));

const StyledMuiTextField = styled(MuiTextField)(({}) => ({
    "&.MuiFormControl-root > .MuiInputBase-root": {
        border: "1px solid #C4C4C4",
        borderRadius: "8px",
    },
    "&.MuiFormControl-root > .MuiInputBase-root > input": {
        padding: "8.5px 12px",
        border: "1px solid #C4C4C4",
        borderRadius: "8px",
    },
    "&.MuiFormControl-root > .MuiInputBase-root :focus": {
        border: "1px solid #0471F0",
        borderRadius: "8px",
    },
}));

export const TextFieldStack = (props: TextFieldStackProps) => {
    const { sx } = props;
    const [componentId, setComponentId] = useState(props.id);

    useEffect(() => {
        if (!componentId) {
            // gets rid of suggestions
            setComponentId(`generated-id-${Date.now()}`);
        }
    }, [componentId]);

    return (
        <>
            <StyledInputLabel shrink={false} htmlFor={componentId}>
                <StyledTypography variant="body2">
                    {props.label ?? "Label"}
                </StyledTypography>
                <InfoOutlined fontSize="small" color="action" />
            </StyledInputLabel>
            {/* Keeping label empty to show labels on top */}
            <StyledMuiTextField
                id={componentId}
                sx={sx}
                {...props}
                label={""}
            />
        </>
    );
};
