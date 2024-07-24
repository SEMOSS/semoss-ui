import React from 'react';
import { Typography, Link, Box } from '@mui/material';

import { Components } from 'react-markdown';

export const MARKDOWN_COMPONENTS: Components = {
    h1: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLHeadingElement>}
                component={'h1'}
                variant={'body2'}
                gutterBottom={true}
                {...rest}
            />
        );
    },
    h2: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLHeadingElement>}
                component={'h2'}
                variant={'h6'}
                gutterBottom={true}
                {...rest}
            />
        );
    },
    h3: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLHeadingElement>}
                component={'h3'}
                variant={'subtitle1'}
                gutterBottom={true}
                {...rest}
            />
        );
    },

    h4: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLHeadingElement>}
                component={'h4'}
                variant={'caption'}
                gutterBottom={true}
                {...rest}
            />
        );
    },

    h5: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLHeadingElement>}
                component={'h5'}
                variant={'caption'}
                gutterBottom={true}
                {...rest}
            />
        );
    },

    h6: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLHeadingElement>}
                component={'h6'}
                variant={'caption'}
                gutterBottom={true}
                {...rest}
            />
        );
    },

    p: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLParagraphElement>}
                paragraph={true}
                variant={'body2'}
                {...rest}
            />
        );
    },

    span: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Typography
                ref={ref as React.MutableRefObject<HTMLSpanElement>}
                variant={'body2'}
                {...rest}
            />
        );
    },

    a: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Link
                ref={ref as React.MutableRefObject<HTMLAnchorElement>}
                rel={'noreferrer'}
                target={'_black'}
                {...rest}
            />
        );
    },

    li: (props) => {
        const { node, ref, ...rest } = props;
        return (
            <Box
                ref={ref as React.MutableRefObject<HTMLLIElement>}
                component={'li'}
                sx={{ mt: 1, typography: 'body2' }}
                {...rest}
            />
        );
    },
};
