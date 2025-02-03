import { FC, useEffect, useState, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockComponent, BlockDef } from '@/stores';
import { useBlock } from '@/hooks';
import { Box, CircularProgress, Typography } from '@mui/material';

export interface DynamicComponentBlockDef
    extends BlockDef<'dynamic-component'> {
    widget: 'dynamic-component';
    data: {
        style: CSSProperties;
        componentPath: string;
        componentProps: Record<string, any>;
    };
    slots: {
        content: true;
    };
}

export const DynamicComponentBlock: BlockComponent = observer(({ id }) => {
    const block = useBlock<DynamicComponentBlockDef>(id);
    const { attrs, data } = block;
    const [Component, setComponent] = useState<React.ComponentType<any> | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!data.componentPath) return;

        const loadComponent = async () => {
            setLoading(true);
            setError(null);
            try {
                // Assuming components are in custom-components folder
                const module = await import(
                    `../../custom-components/${data.componentPath}`
                );
                setComponent(() => module.default);
            } catch (err) {
                console.error('Failed to load component:', err);
                setError('Failed to load component');
            } finally {
                setLoading(false);
            }
        };

        loadComponent();
    }, [data.componentPath]);

    if (loading) {
        return (
            <Box
                {...attrs}
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={2}
            >
                <CircularProgress size={20} />
                <Typography ml={1}>Loading component...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box {...attrs} p={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    if (!Component) {
        return (
            <Box {...attrs} p={2}>
                <Typography color="textSecondary">
                    Select a component from settings
                </Typography>
            </Box>
        );
    }

    let props = {};
    try {
        props =
            typeof data.componentProps === 'string'
                ? JSON.parse(data.componentProps)
                : data.componentProps;
    } catch (e) {
        console.error('Invalid props JSON:', e);
    }

    return (
        <Box {...attrs}>
            <Component {...props} />
        </Box>
    );
});
