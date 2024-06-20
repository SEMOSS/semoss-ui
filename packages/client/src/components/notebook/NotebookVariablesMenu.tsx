import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Box,
    Checklist,
    styled,
    IconButton,
    List,
    Typography,
    Stack,
    Tooltip,
    Search,
    Popover,
} from '@semoss/ui';
import { useBlocks, usePixel } from '@/hooks';
import { AddVariableModal } from './AddVariableModal';
import { NotebookVariable } from './NotebookVariable';
import { Add, FilterListRounded } from '@mui/icons-material';
import { VARIABLE_TYPES } from '@/stores';

const StyledStack = styled(Stack)(() => ({
    maxHeight: '100%',
}));

const StyledButton = styled(Button)(() => ({
    width: '100px',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    overflowY: 'scroll',
}));

const StyledMenuTitle = styled(Typography)(() => ({
    fontWeight: 'bold',
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledBox = styled(Box)(({ theme }) => ({
    height: '300px',
    overflow: 'scroll',
    marginLeft: theme.spacing(2),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    paddingRight: theme.spacing(2),
}));

/**
 * Render the variables menu of the notebook
 */
export const NotebookVariablesMenu = observer((): JSX.Element => {
    const { state } = useBlocks();

    /**
     * State
     */
    const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    );
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
        null,
    );
    const [engines, setEngines] = useState<{
        models: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        databases: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        storages: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        functions: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        vectors: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
    }>({
        models: [],
        databases: [],
        storages: [],
        functions: [],
        vectors: [],
    });
    const [filterWord, setFilterWord] = useState('');
    const [selectedFilter, setSelectedFilter] = useState(VARIABLE_TYPES);

    /**
     * API
     */
    const getEngines =
        usePixel<
            {
                app_id: string;
                app_name: string;
                app_type: string;
                app_subtype: string;
            }[]
        >(`MyEngines();`);

    /**
     * Computed
     */
    const isFilterPopoverOpen = Boolean(filterAnchorEl);
    const isPopoverOpen = Boolean(popoverAnchorEle);

    /**
     * Effects/Memos
     */
    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }
        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
            app_subtype: d.app_subtype,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
            functions: cleanedEngines.filter((e) => e.app_type === 'FUNCTION'),
            vectors: cleanedEngines.filter((e) => e.app_type === 'VECTOR'),
        };

        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);
    const variables = useMemo(() => {
        return Object.entries(state.variables).filter((kv) => {
            const val = kv[1];

            if (
                val.alias.includes(filterWord) &&
                selectedFilter.indexOf(val.type) > -1
            )
                return kv;
        });
    }, [
        Object.entries(state.variables).length,
        filterWord,
        selectedFilter.length,
        Object.values(state.variables),
    ]);

    return (
        <StyledStack
            direction={'column'}
            spacing={0}
            className="notebook-variables-menu"
        >
            <StyledMenu>
                <Stack spacing={2} padding={2}>
                    <Stack direction="row" justifyContent="space-between">
                        <StyledMenuTitle variant="h6">
                            Variables
                        </StyledMenuTitle>
                        <IconButton
                            className="notebook-variable-menu__add-variable-button"
                            onClick={(e) => {
                                setPopoverAnchorEl(e.currentTarget);
                            }}
                        >
                            <Add />
                        </IconButton>
                    </Stack>
                </Stack>
                <Stack
                    spacing={2}
                    paddingLeft={2}
                    paddingBottom={1}
                    paddingRight={2}
                >
                    <Search
                        size={'small'}
                        placeholder="Search"
                        onChange={(e) => {
                            setFilterWord(e.target.value);
                        }}
                    />
                </Stack>
                <Stack spacing={2} paddingLeft={2} paddingBottom={1}>
                    <StyledButton
                        color={'secondary'}
                        onClick={(e) => {
                            setFilterAnchorEl(e.currentTarget);
                        }}
                    >
                        <Stack direction={'row'} gap={1}>
                            <FilterListRounded />
                            Types
                        </Stack>
                    </StyledButton>
                    <Popover
                        id={'filter-variable-popover'}
                        open={isFilterPopoverOpen}
                        anchorEl={filterAnchorEl}
                        onClose={() => {
                            setFilterAnchorEl(null);
                        }}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'center',
                        }}
                    >
                        <StyledBox>
                            <Checklist
                                direction={'column'}
                                options={VARIABLE_TYPES}
                                checked={selectedFilter}
                                onChange={(selected) => {
                                    setSelectedFilter(selected);
                                }}
                            />
                        </StyledBox>
                    </Popover>
                </Stack>
                <StyledMenuScroll>
                    <List disablePadding>
                        {variables.map((t, index) => {
                            const variable = t[1];
                            return (
                                <NotebookVariable
                                    key={variable.alias}
                                    id={t[0]}
                                    variable={variable}
                                    engines={engines}
                                />
                            );
                        })}
                    </List>
                </StyledMenuScroll>
                {isPopoverOpen && (
                    <AddVariableModal
                        open={isPopoverOpen}
                        anchorEl={popoverAnchorEle}
                        onClose={() => {
                            setPopoverAnchorEl(null);
                        }}
                        engines={engines}
                    />
                )}
            </StyledMenu>
        </StyledStack>
    );
});
