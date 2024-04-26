import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    IconButton,
    List,
    Tooltip,
    Typography,
    Stack,
    Tabs,
} from '@semoss/ui';
import { useBlocks, useRootStore, usePixel } from '@/hooks';
import { ActionMessages, Token } from '@/stores';
import { VisibilityRounded } from '@mui/icons-material';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
}));

const StyledList = styled(List)(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflowY: 'auto',
}));
const StyledMenuTitle = styled(Typography)(() => ({
    fontWeight: 'bold',
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
    height: '35%',
}));

export const NotebookCatalogMenu = observer(() => {
    const { state, notebook } = useBlocks();

    const [catalogView, setCatalogView] = useState('model');

    const getEngines =
        usePixel<{ app_id: string; app_name: string; app_type: string }[]>(
            `MyEngines();`,
        );

    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
    });

    const tokens = useMemo(() => {
        return Object.entries(state.tokens);
    }, [Object.entries(state.tokens).length]);

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }
        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
        };
        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

    const listItem = (engine, type): JSX.Element => {
        return (
            <List.Item key={engine.app_id} disablePadding>
                <List.ItemButton
                    onClick={async () => {
                        // 1.
                        // Add to dependencies in state
                        // Add token for it in state
                        const id = await state.dispatch({
                            message: ActionMessages.ADD_DEPENDENCY,
                            payload: {
                                id: engine.app_id,
                                type: type,
                            },
                        });

                        // Add Token for DATABASE_ENGINE-db.app_id
                        state.dispatch({
                            message: ActionMessages.ADD_TOKEN,
                            payload: {
                                to: id,
                                alias: `test-${engine.app_name}`,
                                type: type,
                            },
                        });
                    }}
                >
                    <List.ItemText
                        disableTypography
                        primary={
                            <Typography variant="subtitle2">
                                {engine.app_name}
                            </Typography>
                        }
                    />
                </List.ItemButton>
            </List.Item>
        );
    };

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Catalog</StyledMenuTitle>
                </Stack>
            </Stack>
            <Tabs
                value={catalogView}
                onChange={(
                    e: React.SyntheticEvent<Element, Event>,
                    value: string,
                ) => {
                    setCatalogView(value);
                }}
            >
                <Tabs.Item label={'Model'} value={'model'} />
                <Tabs.Item label={'Database'} value={'database'} />
                <Tabs.Item label={'Storage'} value={'storage'} />
            </Tabs>
            <StyledMenuScroll>
                <StyledList disablePadding>
                    {catalogView === 'database' &&
                        engines.databases.map((db) => {
                            return listItem(db, catalogView);
                        })}
                    {catalogView === 'model' &&
                        engines.models.map((db) => {
                            return listItem(db, catalogView);
                        })}
                    {catalogView === 'storage' &&
                        engines.storages.map((db) => {
                            return listItem(db, catalogView);
                        })}
                </StyledList>
            </StyledMenuScroll>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Tokens</StyledMenuTitle>
                </Stack>
            </Stack>
            <StyledMenuScroll>
                <StyledList disablePadding>
                    {tokens.map(([key, token]) => {
                        if (key.includes(catalogView)) {
                            return (
                                <List.Item
                                    key={`token--${key}`}
                                    secondaryAction={
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            paddingY="8px"
                                        >
                                            <Tooltip
                                                placement={'top'}
                                                title={state.getToken(
                                                    token.to,
                                                    token.type,
                                                )}
                                                enterDelay={500}
                                                leaveDelay={200}
                                            >
                                                <IconButton>
                                                    <VisibilityRounded />
                                                </IconButton>
                                            </Tooltip>
                                        </Stack>
                                    }
                                >
                                    <List.ItemText
                                        disableTypography
                                        primary={
                                            <Typography variant="subtitle2">
                                                {token.alias}
                                            </Typography>
                                        }
                                    />
                                </List.Item>
                            );
                        }
                    })}
                </StyledList>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
