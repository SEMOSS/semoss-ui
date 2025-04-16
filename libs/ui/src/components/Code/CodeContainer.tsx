import { styled, SxProps } from "@mui/material";

const StyledCodeContainer = styled("pre")(({ theme }) => ({
    whiteSpace: "pre-wrap",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    background: theme.palette.background.default,

    "& > code": {
        background: "transparent",
    },
}));

export interface CodeContainerProps {
    /** Content to wrap */
    children: React.ReactNode;

    /** custom style object */
    sx?: SxProps;
}

export const CodeContainer: React.FC<CodeContainerProps> = ({
    children,
    sx,
}) => {
    return <StyledCodeContainer sx={sx}>{children}</StyledCodeContainer>;
};
