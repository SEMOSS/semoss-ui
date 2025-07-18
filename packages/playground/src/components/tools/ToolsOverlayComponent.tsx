import { Close } from '@mui/icons-material';
import { usePixel } from '@semoss/sdk/react';
import {
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Grid,
    IconButton,
    Link,
    MenuItem,
    Modal, Search,
    Stack,
    styled,
    TextField,
    Typography
} from '@semoss/ui';
import React, { useEffect, useMemo, useState } from 'react';
import LOGO from '@/assets/img/logo.svg';
import { useDebounceValue } from '@/hooks';
import { App, Engine, Tool } from '@/types';

const ENDPOINT = import.meta.env.ENDPOINT;
const MODULE = import.meta.env.MODULE;

const StyledHolder = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '422px',
    maxHeight: '40vh',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    overflow: 'auto',
}));

const StyledItem = styled('div', {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled: boolean }>(({ theme, disabled }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    width: '100%',
    height: '130px',
    backgroundColor: theme.palette.background.default,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: theme.shape.borderRadius,
    cursor: disabled ? undefined : 'pointer',
    pointerEvents: disabled ? 'none' : undefined,
}));

const StyledItemImageHolder = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '48px',
    width: '48px',
    overflow: 'hidden',
    '& img': {
        height: '100%',
    },
}));

const StyledItemDescription = styled(Typography)(({ theme }) => ({
    display: '-webkit-box',
    height: '60px',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
}));

// TODO: Remove
/**
 * Generate a temp unique identifier for the tool because we are merging two lists on the frontend
 * @param tool
 * @returns
 */
const getToolKey = (tool: Tool) => {
    return `${tool.id}--${tool.type}`;
};

interface AvailbleTools {
    type: Tool['type'];
    id: string;
    name: string;
    description: string;
    image: string;
}

interface ToolsOverlayComponentProps {
    /** Knowledge loaded into the room */
    tools: Tool[];

    /** Callback triggered when the tool model is closed */
    onClose: (success: boolean, tools?: Tool[]) => void;
}

export const ToolsOverlayComponent: React.FC<ToolsOverlayComponentProps> = (
    props,
) => {
    const { tools, onClose } = props;

    const [updatedTools, setUpdatedTools] = useState<Record<string, Tool>>(
        () => {
            return tools.reduce((acc, val) => {
                acc[getToolKey(val)] = val;

                return acc;
            }, {});
        },
    );

    const updatedToolsArray = Object.values(updatedTools);

    // update when tools change
    useEffect(() => {
        const toolsMap = tools.reduce((acc, val) => {
            acc[getToolKey(val)] = val;

            return acc;
        }, {});

        setUpdatedTools(toolsMap);
    }, [tools]);

    const [search, setSearch] = useState<string>('');
    const [filter, setFilter] = useState<'ALL' | Tool['type']>('ALL');

    // debounce the input
    const debouncedSearch = useDebounceValue(search);

    //TODO: Move to backend and Infinite Load
    let enginePixel = '';
    if (filter === 'ALL') {
        enginePixel = `MyEngines ( engineTypes = [ 'DATABASE', 'FUNCTION' ], metaKeys = ["description"], filterWord=["${debouncedSearch}"])`;
    } else if (filter === 'DATABASE') {
        enginePixel = `MyEngines ( engineTypes = [ 'DATABASE' ], metaKeys = ["description"], filterWord=["${debouncedSearch}"])`;
    } else if (filter === 'FUNCTION') {
        enginePixel = `MyEngines ( engineTypes = [ 'FUNCTION' ], metaKeys = ["description"], filterWord=["${debouncedSearch}"])`;
    }

    /**
     * Get all of the groups
     */
    const getEngines = usePixel<Engine[]>(enginePixel, {
        data: [],
    });
    const getApps = usePixel<App[]>(
        filter === 'ALL' || filter === 'APP'
            ? `MyProjects (metaKeys = ["description"], filterWord=["${debouncedSearch}"])`
            : '',
        {
            data: [],
        },
    );

    const availableTools: AvailbleTools[] = useMemo(() => {
        // merge it
        const merged: AvailbleTools[] = [];

        getEngines.data?.forEach((e) => {
            if (e.app_type !== 'KNOWLEDGE') {
                merged.push({
                    type: e.app_type,
                    id: e.app_id,
                    name: e.app_name,
                    description: e.description || '',
                    image: `${ENDPOINT}${MODULE}/api/app-${e.app_id}/appImage/download`,
                });
            }
        });

        getApps.data?.forEach((a) => {
            merged.push({
                type: 'APP',
                id: a.project_id,
                name: a.project_name,
                description: a.description || '',
                image: `${ENDPOINT}${MODULE}/api/app-${a.project_id}/appImage/download`,
            });
        });

        return merged.sort((a, b) => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });
    }, [getEngines.data, getApps.data]);

    const isLoading =
        getEngines.status === 'LOADING' || getApps.status === 'LOADING';

    /**
     * Track if the tool is selected
     */
    const IsToolSelected = (t: AvailbleTools): boolean => {
        const toolKey = getToolKey(t);
        return Object.prototype.hasOwnProperty.call(updatedTools, toolKey);
    };

    /**
     * Select a tool and update the arraw
     */
    const onToolSelect = (t: AvailbleTools) => {
        if (t.type === 'DATABASE') {
            return;
        }

        // get the key
        const toolKey = getToolKey(t);

        // copy for react
        const updated = { ...updatedTools };
        if (IsToolSelected(t)) {
            // remove it
            delete updated[toolKey];
        } else {
            // add it
            updated[toolKey] = {
                type: t.type,
                id: t.id,
                name: t.name,
            };
        }

        setUpdatedTools(updated);
    };

    /**
     * Select a tool and update the arraw
     */
    const onToolDelete = (t: Tool) => {
        // get the key
        const toolKey = getToolKey(t);

        // copy for react
        const updated = { ...updatedTools };

        // remove it
        delete updated[toolKey];

        setUpdatedTools(updated);
    };

    return (
        <Modal
            open={true}
            onClose={() => onClose(false)}
            aria-labelledby="select tool"
            aria-describedby="select tool"
            maxWidth={'md'}
            fullWidth={true}
            scroll="paper"
        >
            <Modal.Title>
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="h6">Add Tools</Typography>
                    <IconButton size="small" onClick={() => onClose(false)}>
                        <Close />
                    </IconButton>
                </Stack>
            </Modal.Title>
            <Modal.Content>
                <Stack direction={'column'} spacing={2}>
                    <Modal.ContentText>
                        Add existing or create{' '}
                        <Link
                            variant="inherit"
                            target="_blank"
                            href={`../../client/dist/#/engine/function`}
                        >
                            new
                        </Link>{' '}
                        tools for the agent. The agent will use tools to
                        interact with external sources to help perform actions
                        and answer questions.
                    </Modal.ContentText>
                    <Stack direction={'row'} width={'100%'} spacing={3}>
                        <Search
                            label="Search"
                            size="small"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            fullWidth={true}
                            sx={{
                                flex: 1,
                            }}
                        />

                        <TextField
                            label={'Filter'}
                            color="primary"
                            variant={'outlined'}
                            size="small"
                            select
                            value={filter}
                            sx={{
                                width: '194px',
                            }}
                            onChange={(e) =>
                                setFilter(
                                    e.target.value as 'ALL' | Tool['type'],
                                )
                            }
                        >
                            <MenuItem value={'ALL'}>All</MenuItem>
                            <MenuItem value={'APP'}>App</MenuItem>
                            <MenuItem value={'FUNCTION'}>Function</MenuItem>
                            <MenuItem value={'DATABASE'}>Database</MenuItem>
                        </TextField>
                    </Stack>
                    <Typography variant="body1" fontWeight={'medium'}>
                        {search && filter !== 'ALL' ? 'Results' : 'All'}
                    </Typography>
                    <StyledHolder>
                        {isLoading && <CircularProgress color="primary" />}
                        {!isLoading && (
                            <Grid
                                container
                                spacing={2}
                                // alignItems={'center'}
                                // justifyItems={'center'}
                                // overflow={'auto'}
                                height={'100%'}
                            >
                                {availableTools.map((t) => {
                                    let label = '';
                                    if (t.type === 'APP') {
                                        label = 'App';
                                    } else if (t.type === 'FUNCTION') {
                                        label = 'Function';
                                    } else if (t.type === 'DATABASE') {
                                        label = 'Database';
                                    }
                                    return (
                                        <Grid key={t.id} item xs={6}>
                                            <StyledItem
                                                disabled={t.type === 'DATABASE'}
                                                onClick={() => {
                                                    onToolSelect(t);
                                                }}
                                            >
                                                <Stack
                                                    direction={'row'}
                                                    spacing={1}
                                                >
                                                    <StyledItemImageHolder>
                                                        {t.image && (
                                                            <img
                                                                alt=""
                                                                src={t.image}
                                                                onError={({
                                                                    currentTarget,
                                                                }) => {
                                                                    currentTarget.onerror =
                                                                        null; // prevents looping
                                                                    currentTarget.src =
                                                                        LOGO;
                                                                }}
                                                            />
                                                        )}
                                                    </StyledItemImageHolder>
                                                    <Stack
                                                        direction={'column'}
                                                        flex={1}
                                                        spacing={0.25}
                                                    >
                                                        <Typography variant="subtitle2">
                                                            {t.name}
                                                        </Typography>

                                                        <div>
                                                            <Chip
                                                                color="default"
                                                                size="small"
                                                                label={label}
                                                            />
                                                        </div>
                                                    </Stack>
                                                    <Checkbox
                                                        disabled={
                                                            t.type ===
                                                            'DATABASE'
                                                        }
                                                        checked={IsToolSelected(
                                                            t,
                                                        )}
                                                        onChange={() => {
                                                            onToolSelect(t);
                                                        }}
                                                    />
                                                </Stack>
                                                <StyledItemDescription variant="caption">
                                                    {t.description}
                                                </StyledItemDescription>
                                            </StyledItem>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        )}
                    </StyledHolder>
                    {updatedToolsArray.length > 0 && (
                        <>
                            <Typography variant="body1" fontWeight={'medium'}>
                                Selected
                            </Typography>
                            <Stack
                                direction={'row'}
                                spacing={1}
                                flexWrap={'wrap'}
                            >
                                {updatedToolsArray.map((t) => (
                                    <Chip
                                        key={t.id}
                                        label={t.name}
                                        size={'small'}
                                        onDelete={() => {
                                            // should delete since it is selected
                                            onToolDelete(t);
                                        }}
                                    />
                                ))}
                            </Stack>
                        </>
                    )}
                </Stack>
            </Modal.Content>
            <Modal.Actions>
                <Button variant="text" onClick={() => onClose(false)}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={() => {
                        // get the new keys
                        const updated = Object.values(updatedTools);

                        onClose(true, updated);
                    }}
                >
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
