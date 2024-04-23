import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    List,
    Divider,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    Stack,
    Menu,
    useNotification,
} from '@semoss/ui';
import { useBlocks, useRootStore, useWorkspace } from '@/hooks';
import {
    Add,
    Search,
    CheckCircle,
    MoreVert,
    Error as ErrorIcon,
    Pending,
    Edit,
    ContentCopy,
    Delete,
    HourglassEmpty,
    Download,
} from '@mui/icons-material';
import { NewQueryOverlay } from './NewQueryOverlay';
import { ActionMessages } from '@/stores';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
}));

// const StyledMenu = styled('div')(({ theme, disabled }) => {
//     const palette = theme.palette as unknown as {
//         background: Record<string, string>;
//     };
//     return {
//         display: 'flex',
//         flexDirection: 'column',
//         height: '100%',
//         width: '100%',
//         paddingTop: theme.spacing(1),
//         backgroundColor: palette.background["paper1"],
//     };
// });

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

const StyledListIcon = styled(List.Icon)(({ theme }) => ({
    width: theme.spacing(4),
    minWidth: 'unset',
}));

/**
 * Render the queries menu of the nodebook
 */
export const NotebookParametersMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();

    const { monolithStore, configStore } = useRootStore();

    const renderedQueries = useMemo(() => {
        debugger;
        return Object.entries(state.parameters);
    }, [state.parameters]);

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Parameters</StyledMenuTitle>
                </Stack>
                {/* <TextField
                    type="text"
                    size="small"
                    placeholder="Search Queries"
                    value={querySearch}
                    onChange={(e) => setQuerySearch(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                /> */}
            </Stack>
            <StyledMenuScroll>
                <List disablePadding>
                    {renderedQueries.map((qu, index) => {
                        const q = qu[1];
                        return (
                            <List.Item
                                key={q.alias}
                                disablePadding
                                secondaryAction={
                                    <>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            paddingY="8px"
                                        >
                                            kjk
                                        </Stack>
                                    </>
                                }
                            >
                                <List.ItemButton>
                                    <List.ItemText
                                        disableTypography
                                        primary={
                                            <Typography variant="subtitle2">
                                                {q.alias}
                                            </Typography>
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
