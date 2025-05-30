import { useMemo } from "react";
import { default as ReactMarkdown, Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { Link } from "../Link";
import { Typography } from "../Typography";
import { Divider } from "../Divider";
import { Table } from "../Table";
import { Code, CodeProps } from "../Code";

// components
const defaultComponents: Components = {
    body: ({ children }) => (
        <Typography variant={"body2"}>{children}</Typography>
    ),

    h1: ({ children }) => (
        <Typography component={"h1"} variant={"h4"} gutterBottom={true}>
            {children}
        </Typography>
    ),
    h2: ({ children }) => (
        <Typography component={"h2"} variant={"h6"} gutterBottom={true}>
            {children}
        </Typography>
    ),
    h3: ({ children }) => (
        <Typography component={"h3"} variant={"subtitle1"} gutterBottom={true}>
            {children}
        </Typography>
    ),
    h4: ({ children }) => (
        <Typography component={"h4"} variant={"subtitle2"} gutterBottom={true}>
            {children}
        </Typography>
    ),
    h5: ({ children }) => (
        <Typography component={"h5"} variant={"caption"} gutterBottom={true}>
            {children}
        </Typography>
    ),
    h6: ({ children }) => (
        <Typography component={"h6"} variant={"caption"} gutterBottom={true}>
            {children}
        </Typography>
    ),
    p: ({ children }) => (
        <Typography component={"p"} variant={"body2"}>
            {children}
        </Typography>
    ),
    span: ({ children }) => (
        <Typography component={"span"} variant={"body2"}>
            {children}
        </Typography>
    ),
    a: ({ children, href }) => (
        <Link rel="noreferrer" target={"_blank"} href={href}>
            {children}
        </Link>
    ),
    ul: ({ children }) => (
        <Typography component={"ul"} variant={"body2"}>
            {children}
        </Typography>
    ),
    ol: ({ children }) => (
        <Typography component={"ol"} variant={"body2"}>
            {children}
        </Typography>
    ),
    hr: () => <Divider orientation="horizontal" />,
    pre: ({ children }) => {
        return <Code.Container>{children}</Code.Container>;
    },
    code: ({ children, className }) => {
        const match = /language-(\w+)/.exec(className || "");

        const code = children as string;

        return match ? (
            <Code
                code={code}
                language={
                    match && match[1]
                        ? (match[1] as CodeProps["language"])
                        : null
                }
            />
        ) : (
            <Code code={code} />
        );
    },
    table: ({ children }) => (
        <Table.Container>
            <Table>{children}</Table>
        </Table.Container>
    ),
    thead: ({ children }) => <Table.Head>{children}</Table.Head>,
    th: ({ children }) => <Table.Cell>{children}</Table.Cell>,
    tbody: ({ children }) => <Table.Body>{children}</Table.Body>,
    tr: ({ children }) => <Table.Row>{children}</Table.Row>,
    td: ({ children }) => <Table.Cell>{children}</Table.Cell>,
    tfoot: ({ children }) => <Table.Footer>{children}</Table.Footer>,
    img: (props) => {
        return <img {...props} />;
    },
};

// plugins
const remarkPlugins = [remarkGfm];
const rehypePlugins = [rehypeRaw];

export interface MarkdownProps {
    /** Markdown to render as HTML */
    children: string | null | undefined;

    /** Custom components to override */
    components?: Components;
}

export const Markdown: React.FC<MarkdownProps> = ({ children, components }) => {
    const mergedComponents = useMemo(() => {
        return {
            ...defaultComponents,
            ...(components || {}),
        };
    }, [components]);

    return (
        <ReactMarkdown
            remarkPlugins={remarkPlugins}
            rehypePlugins={rehypePlugins}
            components={mergedComponents}
        >
            {children}
        </ReactMarkdown>
    );
};
