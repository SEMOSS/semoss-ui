import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    IconButton,
    List,
    Typography,
    Stack,
} from '@semoss/ui';
import { useBlocks, useRootStore } from '@/hooks';
import { Search, ContentCopy } from '@mui/icons-material';
import { AddTokenModal } from './AddTokenModal';

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
export const NotebookTokensMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();

    const { monolithStore, configStore } = useRootStore();

    const [addTokenModal, setAddTokenModal] = useState(false);

    const tokens = useMemo(() => {
        return Object.entries(state.tokens);
    }, [state.tokens]);

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Tokens</StyledMenuTitle>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            setAddTokenModal(true);
                        }}
                    >
                        Add Token
                    </Button>
                </Stack>
            </Stack>
            <StyledMenuScroll>
                <List disablePadding>
                    {tokens.map((t, index) => {
                        const token = t[1];
                        return (
                            <List.Item
                                key={token.alias}
                                disablePadding
                                secondaryAction={
                                    <>
                                        <Stack
                                            direction="row"
                                            spacing={1}
                                            alignItems="center"
                                            paddingY="8px"
                                        >
                                            <IconButton
                                                title="Open Menu"
                                                onClick={() => {
                                                    console.log(
                                                        'Opening Window',
                                                    );
                                                }}
                                            >
                                                <ContentCopy />
                                            </IconButton>
                                        </Stack>
                                    </>
                                }
                            >
                                <List.ItemButton>
                                    <List.ItemText
                                        disableTypography
                                        primary={
                                            <Typography variant="subtitle2">
                                                {token.alias} - {token.type}
                                            </Typography>
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
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
