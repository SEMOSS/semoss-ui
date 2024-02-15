import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { BlocksMenuItem, MenuBlocks } from './BlocksMenuBlocks';

import {
    styled,
    Collapse,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@semoss/ui';
import { Search, SearchOff } from '@mui/icons-material';
import {
    BLOCK_TYPES,
    BLOCK_TYPE_INPUT,
} from '../block-defaults/block-defaults.constants';
import { BlocksMenuBlockTypeSection } from './BlocksMenuBlockTypeSection';
import { getTypeForBlock } from '../block-defaults';

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

const StyledHeader = styled('div')(() => ({
    minWidth: '118px',
}));

export const BlocksMenu = observer(() => {
    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState<boolean>(false);

    const menuItems: BlocksMenuItem[] = [...MenuBlocks];

    const getMenuItemsForType = (blockType: string) => {
        return menuItems.filter(
            (block) => getTypeForBlock(block.blockJson.widget) === blockType,
        );
    };

    const getMenuItemsForSearch = () => {
        if (search) {
            return menuItems.filter((block) => {
                return block.display
                    .replaceAll('-', ' ')
                    .includes(search.toLowerCase());
            });
        } else {
            return menuItems;
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
                {search ? (
                    <BlocksMenuBlockTypeSection
                        menuItems={getMenuItemsForSearch()}
                    />
                ) : (
                    Array.from(BLOCK_TYPES, (blockType, i) => {
                        return (
                            <BlocksMenuBlockTypeSection
                                key={`${blockType}-${i}`}
                                title={getTitleForBlockType(blockType)}
                                menuItems={getMenuItemsForType(blockType)}
                            />
                        );
                    })
                )}
            </StyledBlockSectionContainer>
        </Stack>
    );
});
