import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    IconButton,
    List,
    Menu,
    Typography,
    Stack,
    useNotification,
    Tooltip,
    TextField,
} from '@semoss/ui';
import { useBlocks } from '@/hooks';
import { CheckCircle, MoreVert, VisibilityRounded } from '@mui/icons-material';
import { AddTokenModal } from './AddTokenModal';
import { ActionMessages, SerializedState } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';
import { NotebookToken } from './NotebookToken';

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

    const tokens = useMemo(() => {
        return Object.entries(state.tokens);
    }, [Object.entries(state.tokens).length]);

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Variables</StyledMenuTitle>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            setAddTokenModal(true);
                        }}
                    >
                        Add Variable
                    </Button>
                </Stack>
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
                open={addTokenModal}
                onClose={() => {
                    setAddTokenModal(false);
                }}
            />
        </StyledMenu>
    );
});
