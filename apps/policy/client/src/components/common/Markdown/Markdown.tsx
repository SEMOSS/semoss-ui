import ReactMarkdown from 'markdown-to-jsx';
import { Typography, Link, Box } from '@semoss/ui';

const options = {
    overrides: {
        body: {
            component: Typography,
            props: {
                variant: 'body1',
            },
        },
        h1: {
            component: Typography,
            props: {
                gutterBottom: true,
                variant: 'h4',
                component: 'h1',
            },
        },
        h2: {
            component: Typography,
            props: { gutterBottom: true, variant: 'h6', component: 'h2' },
        },
        h3: {
            component: Typography,
            props: { gutterBottom: true, variant: 'subtitle1' },
        },
        h4: {
            component: Typography,
            props: {
                gutterBottom: true,
                variant: 'caption',
                paragraph: true,
            },
        },
        p: {
            component: Typography,
            props: { paragraph: true, variant: 'body1' },
        },
        a: {
            component: Link,
            props: {
                rel: 'noreferrer',
                target: '_blank',
            },
        },
        li: {
            component: (props) => {
                return (
                    <>
                        <Box
                            component="li"
                            sx={{ mt: 1, typography: 'body1' }}
                            {...props}
                        />
                    </>
                );
            },
        },
    },
};

interface MarkdownProps {
    /** Content to render as HTML */
    children: string;
}

export const Markdown = (props: MarkdownProps) => {
    return <ReactMarkdown options={options} {...props} />;
};
