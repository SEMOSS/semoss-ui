import { useRef, useEffect, useState } from "react";
import { Typography, Tooltip, TypographyProps, SxProps } from "@mui/material";

interface TruncatedTextProps {
    children: string;
    variant?: TypographyProps["variant"];
    sx?: SxProps;
}

export const TruncatedText = ({
    children,
    variant = "body1",
    sx,
}: TruncatedTextProps) => {
    const textRef = useRef<HTMLElement>(null);
    const [isTextTruncated, setIsTextTruncated] = useState(false);

    useEffect(() => {
        const element = textRef.current;
        if (!element || typeof children !== "string") return;

        setIsTextTruncated(element.scrollHeight > element.clientHeight);
    }, [children, variant]);

    const truncatedTypography = (
        <Typography
            ref={textRef}
            variant={variant}
            sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2, // Truncates after two lines
                WebkitBoxOrient: "vertical",
                ...sx,
            }}
        >
            {children}
        </Typography>
    );

    return isTextTruncated && typeof children === "string" ? (
        <Tooltip title={children} placement="top-start">
            {truncatedTypography}
        </Tooltip>
    ) : (
        truncatedTypography
    );
};
