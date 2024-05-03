import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Collapse,
    Divider,
    styled,
    IconButton,
    List,
    Tooltip,
    Typography,
    Stack,
    Tabs,
    Search,
    TextField,
    useNotification,
} from '@semoss/ui';
import { useBlocks, useRootStore, usePixel } from '@/hooks';
import { ActionMessages, Token } from '@/stores';
import { VisibilityRounded, FilterListRounded } from '@mui/icons-material';

import { TokenType } from '@/stores';

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
    maxHeight: '45%',
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

    return (
        <StyledMenu>
            <Stack spacing={2} paddingLeft={2} paddingTop={2} paddingBottom={1}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Sources</StyledMenuTitle>
                </Stack>
            </Stack>
            <Stack
                spacing={2}
                paddingLeft={2}
                paddingBottom={1}
                paddingRight={2}
            >
                <Search size={'small'} placeholder="Name, id, etc...." />
            </Stack>
            <Stack spacing={2} paddingLeft={2} paddingBottom={1}>
                <Button color={'secondary'} sx={{ width: '100px' }}>
                    <Stack direction={'row'} gap={1}>
                        <FilterListRounded />
                        Sources
                    </Stack>
                </Button>
            </Stack>
            {/* <Tabs
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
            </Tabs> */}
            <StyledMenuScroll>
                <StyledList disablePadding>
                    {catalogView === 'database' &&
                        engines.databases.map((db, i) => {
                            return (
                                <EngineListItem
                                    key={i}
                                    engine={db}
                                    type={catalogView}
                                />
                            );
                        })}
                    {catalogView === 'model' &&
                        engines.models.map((db, i) => {
                            return (
                                <EngineListItem
                                    key={i}
                                    engine={db}
                                    type={catalogView}
                                />
                            );
                        })}
                    {catalogView === 'storage' &&
                        engines.storages.map((db, i) => {
                            return (
                                <EngineListItem
                                    key={i}
                                    engine={db}
                                    type={catalogView}
                                />
                            );
                        })}
                </StyledList>
            </StyledMenuScroll>
            <Divider />
            <Stack spacing={2} paddingLeft={2} paddingTop={2} paddingBottom={1}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Variables</StyledMenuTitle>
                </Stack>
            </Stack>
            {/* <Stack spacing={2} padding={2}>
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
            </StyledMenuScroll> */}
        </StyledMenu>
    );
});

interface EngineListItemProps {
    engine: any;

    type: TokenType;
}

const EngineListItem = (props: EngineListItemProps) => {
    const { engine, type } = props;
    const [showSecondaryAction, setShowSecondaryAction] = useState(false);

    const { state } = useBlocks();
    const notification = useNotification();

    const [createVariable, setCreateVariable] = useState(false);
    const [variableName, setVariableName] = useState(engine.app_name);

    return (
        <List.Item
            key={engine.app_id}
            disablePadding
            secondaryAction={
                <Collapse in={showSecondaryAction}>
                    <Button
                        color="primary"
                        onClick={async () => {
                            setCreateVariable(true);
                        }}
                    >
                        Create Variable
                    </Button>
                </Collapse>
            }
            onMouseOver={() => {
                setShowSecondaryAction(true);
            }}
            onMouseLeave={() => {
                setShowSecondaryAction(false);
            }}
        >
            <List.ItemButton>
                <List.ItemText
                    disableTypography
                    primary={
                        createVariable ? (
                            <TextField
                                inputRef={(input) => input && input.focus()}
                                focused={true}
                                fullWidth
                                size={'small'}
                                variant="standard"
                                value={variableName}
                                onChange={(e) => {
                                    setVariableName(e.target.value);
                                }}
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        console.log('Save alias');
                                        setCreateVariable(false);

                                        // 1.
                                        // Add to dependencies in state
                                        // Add token for it in state
                                        const id = await state.dispatch({
                                            message:
                                                ActionMessages.ADD_DEPENDENCY,
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
                                                alias: variableName,
                                                type: type,
                                            },
                                        });

                                        notification.add({
                                            color: 'success',
                                            message: `Succesfully added ${engine.app_name} as ${variableName}, remember to save your app.`,
                                        });
                                    }
                                }}
                                onBlur={() => {
                                    setCreateVariable(false);
                                    setVariableName(engine.app_name);

                                    notification.add({
                                        color: 'warning',
                                        message: `Unsuccesfully added ${engine.app_name} as variable`,
                                    });
                                }}
                                InputProps={{
                                    disableUnderline: true,
                                }}
                            />
                        ) : (
                            <Stack
                                direction={'column'}
                                gap={0}
                                sx={{ width: '150px' }}
                            >
                                <Typography variant="subtitle2">
                                    {engine.app_name}
                                </Typography>
                                <Typography variant="caption">
                                    {type}
                                </Typography>
                            </Stack>
                        )
                    }
                />
            </List.ItemButton>
        </List.Item>
    );
};
