import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { DefaultBlocks } from '../block-defaults';

import {
    styled,
    Collapse,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@/component-library';
import { Search, SearchOff } from '@mui/icons-material';
import {
    BLOCK_TYPES,
    BLOCK_TYPE_INPUT,
} from '../block-defaults/block-defaults.constants';
import { BlocksMenuBlockTypeSection } from './BlocksMenuBlockTypeSection';

const StyledMenuHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: `0 ${theme.spacing(2)}`,
    gap: theme.spacing(1),
}));

const StyledBlockSectionContainer = styled('div')(({ theme }) => ({
    height: '100%',
    overflowY: 'auto',
    padding: `0 ${theme.spacing(2)}`,
}));

const StyledHeader = styled('div')(({ theme }) => ({
    minWidth: '118px',
}));

export const BlocksMenu = observer(() => {
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState<boolean>(false);

    const menuBlocks = Object.values(DefaultBlocks).filter(
        (block) => block.isBlocksMenuEnabled,
    );

    const getBlocksForType = (blockType: string) => {
        return menuBlocks.filter((block) => block.type === blockType);
    };

    const getBlocksForSearch = () => {
        if (!!search) {
            return menuBlocks.filter((block) => {
                return block.widget
                    .replaceAll('-', ' ')
                    .includes(search.toLowerCase());
            });
        } else {
            return menuBlocks;
        }
    };

    const getTitleForBlockType = (blockType: string) => {
        switch (blockType) {
            case BLOCK_TYPE_INPUT:
                return 'User Input';
            default:
                return blockType;
        }
    };

    return (
        <Stack height="100%" pt={2}>
            <StyledMenuHeader>
                <StyledHeader>
                    <Typography variant={'h6'}>Build Blocks</Typography>
                </StyledHeader>
                <Stack
                    flex={1}
                    spacing={1}
                    direction="row"
                    alignItems="center"
                    justifyContent="end"
                >
                    <Collapse orientation="horizontal" in={showSearch}>
                        <TextField
                            placeholder="Search"
                            size="small"
                            sx={{
                                width: '200px',
                            }}
                            value={search}
                            variant="outlined"
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </Collapse>
                    <IconButton
                        color="default"
                        size="small"
                        onClick={() => {
                            setShowSearch(!showSearch);
                            setSearch('');
                        }}
                    >
                        {showSearch ? (
                            <SearchOff fontSize="medium" />
                        ) : (
                            <Search fontSize="medium" />
                        )}
                    </IconButton>
                </Stack>
            </StyledMenuHeader>

            <StyledBlockSectionContainer>
                {!!search ? (
                    <BlocksMenuBlockTypeSection blocks={getBlocksForSearch()} />
                ) : (
                    Array.from(BLOCK_TYPES, (blockType, i) => {
                        return (
                            <BlocksMenuBlockTypeSection
                                key={`${blockType}-${i}`}
                                title={getTitleForBlockType(blockType)}
                                blocks={getBlocksForType(blockType)}
                            />
                        );
                    })
                )}
            </StyledBlockSectionContainer>
        </Stack>
    );
});
