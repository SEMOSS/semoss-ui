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
import { AddTokenModal } from './AddTokenModal';
import { NotebookToken } from './NotebookToken';
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
 * Render the tokens menu of the notebook
 */
export const NotebookTokensMenu = observer((): JSX.Element => {
    const { state } = useBlocks();
    const [addTokenModal, setAddTokenModal] = useState(false);

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

    const tokens = useMemo(() => {
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

    // const filterList = useMemo(() => {
    //     console.log(selectedFilter);
    //     return VARIABLE_TYPES.map((type, i) => {
    //         return (
    //             <List key={i}>
    //                 <List.Item>
    //                     <Checkbox
    //                         // checked={selectedValues.includes(item.value)} onChange={() => handleCheckboxChange(item.value)}
    //                         checked={selectedFilter.indexOf(type) > -1}
    //                         onChange={(e) => {
    //                             const index = selectedFilter.indexOf(type);
    //                             let copy = selectedFilter;
    //                             if (index > -1) {
    //                                 copy = copy.splice(index, 1);
    //                             } else {
    //                                 copy.push(type);
    //                             }

    //                             setSelectedFilter(copy);
    //                         }}
    //                     />
    //                     {type}
    //                 </List.Item>
    //             </List>
    //         );
    //     });
    // }, [selectedFilter.length]);

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
                        {tokens.map((t, index) => {
                            const token = t[1];
                            return (
                                <NotebookToken
                                    key={token.alias}
                                    id={t[0]}
                                    token={token}
                                />
                            );
                        })}
                    </List>
                </StyledMenuScroll>
                <AddTokenModal
                    open={isPopoverOpen}
                    anchorEl={popoverAnchorEle}
                    onClose={() => {
                        setAddTokenModal(false);

                        setPopoverAnchorEl(null);
                    }}
                />
            </StyledMenu>
        </Stack>
    );
});
