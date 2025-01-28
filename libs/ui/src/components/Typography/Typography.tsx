import {
    Typography as MuiTypography,
    TypographyProps as MuiTypographyProps,
    SxProps,
    Tooltip,
} from "@mui/material";
import { useRef, useState, useEffect } from "react";

export interface TypographyProps {
    /** custom style object */

    /**
     * Set the text-align on the component.
     * @default 'inherit'
     */
    align?: "inherit" | "left" | "center" | "right" | "justify";
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * If `true`, the element will be a paragraph element.
     * @default false
     */
    paragraph?: boolean;
    variant:
        | "h1"
        | "h2"
        | "h3"
        | "h4"
        | "h5"
        | "h6"
        | "subtitle1"
        | "subtitle2"
        | "body1"
        | "body2"
        | "caption"
        | "button"
        | "overline";
    sx?: SxProps;
    fontWeight?: "light" | "regular" | "medium" | "500" | "bold";
    color?:
        | "inherit"
        | "primary"
        | "secondary"
        | "success"
        | "error"
        | "info"
        | "warning";
    noWrap?: MuiTypographyProps["noWrap"];
    title?: MuiTypographyProps["title"];
    id?: string;
}

export const Typography = (props: TypographyProps) => {
    const { sx, color, variant, children, ...otherProps } = props;
    const typographyRef = useRef<HTMLElement>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const checkTruncation = () => {
            const element = typographyRef.current;
            if (!element || typeof children !== "string") return;

            // console.log(`Text: "${children}", Scroll height: ${element.scrollHeight}, Client height: ${element.clientHeight}`)

            setIsTruncated(element.scrollHeight > element.clientHeight);
        };

        checkTruncation();
        window.addEventListener("resize", checkTruncation);

        return () => window.removeEventListener("resize", checkTruncation);
    }, [children]);

    const typographyComponent = (
        <MuiTypography
            ref={typographyRef}
            sx={{
                ...(variant === "body1" && {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: "2",
                    WebkitBoxOrient: "vertical",
                }),
                ...sx,
            }}
            variant={variant}
            color={
                color === "success"
                    ? "success.text"
                    : color === "warning"
                    ? "warning.text"
                    : color === "error"
                    ? "error.text"
                    : color === "primary"
                    ? "primary.main"
                    : color === "secondary"
                    ? "text.secondary"
                    : color
            }
            {...otherProps}
        >
            {children}
        </MuiTypography>
    );

    if (variant === "body1" && typeof children === "string" && isTruncated) {
        return (
            <Tooltip title={children} placement="top-start">
                {typographyComponent}
            </Tooltip>
        );
    }

    return typographyComponent;
};
