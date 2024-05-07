import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    IconButton,
    List,
    Typography,
    Stack,
    Tooltip,
    Search,
} from '@semoss/ui';
import { useBlocks } from '@/hooks';
import { AddTokenModal } from './AddTokenModal';
import { NotebookToken } from './NotebookToken';
import { Add } from '@mui/icons-material';

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

/**
 * Render the tokens menu of the notebook
 */
export const NotebookTokensMenu = observer((): JSX.Element => {
    const { state } = useBlocks();
    const [addTokenModal, setAddTokenModal] = useState(false);
    const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    );

    // track if the popover is open
    const isPopoverOpen = Boolean(popoverAnchorEle);

    const tokens = useMemo(() => {
        return Object.entries(state.tokens);
    }, [Object.entries(state.tokens).length]);

    return (
        <Stack direction={'column'} sx={{ maxHeight: '80%' }} spacing={0}>
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
                    <Search size={'small'} placeholder="Search" />
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
