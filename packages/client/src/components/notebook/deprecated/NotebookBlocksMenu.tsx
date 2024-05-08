import { createElement, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    List,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    Stack,
    useNotification,
    Icon,
} from '@semoss/ui';
import { useBlocks } from '@/hooks';
import { Search, ContentCopy } from '@mui/icons-material';
import { computed } from 'mobx';
import { DefaultBlocks, getIconForBlock } from '../../block-defaults';
import { BLOCK_TYPE_INPUT } from '../../block-defaults/block-defaults.constants';

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
 * Render the queries menu of the nodebook
 */
export const NotebookBlocksMenu = observer((): JSX.Element => {
    const { state, notebook } = useBlocks();
    const notification = useNotification();

    const [blockSearch, setBlockSearch] = useState('');

    // get the input type blocks as an array
    const inputBlocks = computed(() => {
        return Object.values(state.blocks)
            .filter(
                (block) =>
                    DefaultBlocks[block.widget].type === BLOCK_TYPE_INPUT,
            )
            .sort((a, b) => {
                const aId = a.id.toLowerCase(),
                    bId = b.id.toLowerCase();

                if (aId < bId) {
                    return -1;
                }
                if (aId > bId) {
                    return 1;
                }
                return 0;
            });
    }).get();

    // get the rendered input blocks that can be used in queries
    const renderedBlocks = useMemo(() => {
        if (!blockSearch) {
            return inputBlocks;
        }

        const cleaned = blockSearch.toUpperCase();

        return inputBlocks.filter(
            (q) => q.id.toUpperCase().indexOf(cleaned) > -1,
        );
    }, [inputBlocks, blockSearch]);

    const copyBlockValue = (blockId: string) => {
        try {
            navigator.clipboard.writeText(`{{block.${blockId}.value}}`);

            notification.add({
                color: 'success',
                message: 'Succesfully copied to clipboard',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Blocks</StyledMenuTitle>
                </Stack>
                <TextField
                    type="text"
                    size="small"
                    placeholder="Search User Input Blocks"
                    value={blockSearch}
                    onChange={(e) => setBlockSearch(e.target.value)}
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search />
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>
            <StyledMenuScroll>
                <List disablePadding dense>
                    {renderedBlocks.map((b) => {
                        return (
                            <List.Item
                                key={b.id}
                                secondaryAction={
                                    <>
                                        <Stack
                                            direction="row"
                                            alignItems="center"
                                            paddingY="8px"
                                        >
                                            <IconButton
                                                title="Copy query formatted value"
                                                onClick={() =>
                                                    copyBlockValue(b.id)
                                                }
                                            >
                                                <ContentCopy />
                                            </IconButton>
                                        </Stack>
                                    </>
                                }
                            >
                                <List.ItemText
                                    disableTypography
                                    primary={
                                        <Stack direction="row" spacing={1}>
                                            <Icon color="primary">
                                                {createElement(
                                                    getIconForBlock(b.widget),
                                                )}
                                            </Icon>
                                            <Typography variant="subtitle2">
                                                {b.id}
                                            </Typography>
                                        </Stack>
                                    }
                                />
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
