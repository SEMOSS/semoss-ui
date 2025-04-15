import { useMemo } from "react";
import MarkdownToJSXComponent, { MarkdownToJSX } from "markdown-to-jsx";
import { styled } from "@mui/material";

import { Link } from "../Link";
import { Typography } from "../Typography";
import { Divider } from "../Divider";
import { Table } from "../Table";

const StyledPre = styled("pre")(({ theme }) => ({
    whiteSpace: "pre-wrap",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    background: theme.palette.background.default,

    "& > code": {
        background: "transparent",
    },
}));

const StyledCode = styled("code")(({ theme }) => ({
    ...theme.typography.body2,
    background: theme.palette.background.default,
}));

const defaultOverrides: MarkdownToJSX.Overrides = {
    body: {
        component: Typography,
        props: { variant: "body2" },
    },
    h1: {
        component: Typography,
        props: { component: "h1", variant: "h4", gutterBottom: true },
    },
    h2: {
        component: Typography,
        props: { component: "h2", variant: "h6", gutterBottom: true },
    },
    h3: {
        component: Typography,
        props: { component: "h3", variant: "subtitle1", gutterBottom: true },
    },
    h4: {
        component: Typography,
        props: { component: "h4", variant: "subtitle2", gutterBottom: true },
    },
    h5: {
        component: Typography,
        props: { component: "h5", variant: "caption", gutterBottom: true },
    },
    h6: {
        component: Typography,
        props: { component: "h6", variant: "caption", gutterBottom: true },
    },
    p: {
        component: Typography,
        props: { component: "p", variant: "body2" },
    },
    span: {
        component: Typography,
        props: { component: "span", variant: "body2" },
    },
    a: {
        component: Link,
        props: { rel: "noreferrer", target: "_blank" },
    },
    ul: {
        component: Typography,
        props: { component: "ul", variant: "body2" },
    },
    ol: {
        component: Typography,
        props: { component: "ol", variant: "body2" },
    },
    hr: {
        component: Divider,
        props: { orientation: "horizontal" },
    },
    pre: {
        component: StyledPre,
    },
    code: {
        component: StyledCode,
    },
    table: {
        component: ({ children, ...otherProps }) => {
            return (
                <Table.Container>
                    <Table {...otherProps}>{children}</Table>
                </Table.Container>
            );
        },
    },
    thead: {
        component: Table.Head,
    },
    th: {
        component: Table.Cell,
    },
    tbody: {
        component: Table.Body,
    },
    tr: {
        component: Table.Row,
    },
    td: {
        component: Table.Cell,
    },
    tfoot: {
        component: Table.Footer,
    },
};

export interface MarkdownProps {
    /** Content to render as HTML */
    content: string;

    /** Content to render as HTML */
    overrides: MarkdownToJSX.Overrides;
}

export const Markdown: React.FC<MarkdownProps> = ({
    content,
    overrides = {},
}) => {
    const options: MarkdownToJSX.Options = useMemo(() => {
        return {
            overrides: {
                ...defaultOverrides,
                ...overrides,
            },
        };
    }, [overrides]);

    return (
        <MarkdownToJSXComponent options={options}>
            {content}
        </MarkdownToJSXComponent>
    );
};
