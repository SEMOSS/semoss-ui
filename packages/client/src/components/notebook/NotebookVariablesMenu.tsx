import { useMemo, useState } from 'react';
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
import { useBlocks } from '@/hooks';
import { AddVariableModal } from './AddVariableModal';
import { NotebookVariable } from './NotebookVariable';
import { Add, FilterListRounded } from '@mui/icons-material';
import { VARIABLE_TYPES } from '@/stores';

const StyledTooltip = styled(Tooltip)(() => ({
    fontWeight: 'bold',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
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
}));

/**
 * Render the variables menu of the notebook
 */
export const NotebookVariablesMenu = observer((): JSX.Element => {
    const { state } = useBlocks();

    const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    );
    const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
        null,
    );

    const [filterWord, setFilterWord] = useState('');
    const [selectedFilter, setSelectedFilter] = useState(VARIABLE_TYPES);

    const isFilterPopoverOpen = Boolean(filterAnchorEl);
    const isPopoverOpen = Boolean(popoverAnchorEle);

    const variables = useMemo(() => {
        console.log(selectedFilter);
        return Object.entries(state.tokens).filter((kv) => {
            const val = kv[1];

            if (
                val.alias.includes(filterWord) &&
                selectedFilter.indexOf(val.type) > -1
            )
                return kv;
        });
    }, [
        Object.entries(state.tokens).length,
        filterWord,
        selectedFilter.length,
    ]);

    return (
        <Stack direction={'column'} sx={{ maxHeight: '100%' }} spacing={0}>
            <StyledMenu>
                <Stack spacing={2} padding={2}>
                    <Stack direction="row" justifyContent="space-between">
                        <StyledMenuTitle variant="h6">
                            Variables
                        </StyledMenuTitle>
                        <IconButton
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
                    <Button
                        color={'secondary'}
                        sx={{ width: '100px' }}
                        onClick={(e) => {
                            setFilterAnchorEl(e.currentTarget);
                        }}
                    >
                        <Stack direction={'row'} gap={1}>
                            <FilterListRounded />
                            Types
                        </Stack>
                    </Button>
                    <Popover
                        id={'filter-variable-popover'}
                        open={isFilterPopoverOpen}
                        anchorEl={filterAnchorEl}
                        onClose={() => {
                            setFilterAnchorEl(null);
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
                                sx={{}}
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
                                />
                            );
                        })}
                    </List>
                </StyledMenuScroll>
                <AddVariableModal
                    open={isPopoverOpen}
                    anchorEl={popoverAnchorEle}
                    onClose={() => {
                        setPopoverAnchorEl(null);
                    }}
                />
            </StyledMenu>
        </Stack>
    );
});
