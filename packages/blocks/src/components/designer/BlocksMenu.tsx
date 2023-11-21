import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import { DefaultBlocks } from '../block-defaults';
import { BLOCK_TYPES } from '../block-defaults/block-defaults.constants';
import { styled, Stack, TextField } from '@semoss/ui';
import { Search } from '@mui/icons-material';
import { BlocksMenuBlockTypeSection } from './BlocksMenuBlockTypeSection';

const StyledTextFieldContainer = styled('div')(({ theme }) => ({
    margin: theme.spacing(2),
    padding: `0 ${theme.spacing(2)}`
}));

const StyledBlockSectionContainer = styled('div')(({ theme }) => ({
    height: '100%',
    overflowY: 'auto',
    padding: `0 ${theme.spacing(2)}`
}));

const StyledSearchIcon = styled(Search)(({ theme }) => ({
    color: theme.palette.divider,
    height: '1em',
    width: '1em'
}))

export const BlocksMenu = observer(() => {
    const [search, setSearch] = useState('');

    const getBlocksForType = (blockType: string) => {
        return Object.values(DefaultBlocks).filter(block => block.type === blockType);
    };
    
    const getBlocksForSearch = () => {
        if (!!search) {
            return Object.values(DefaultBlocks).filter(block => {
                return block.widget.replaceAll('-', ' ').includes(search.toLowerCase());
            });
        } else {
            return Object.values(DefaultBlocks);
        }
    }

    return (
        <Stack height="100%">
            <StyledTextFieldContainer>
                <TextField 
                    fullWidth
                    label="Search"
                    size="small"
                    value={search}
                    variant="outlined"
                    InputProps={{
                        endAdornment: <StyledSearchIcon/>
                    }}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </StyledTextFieldContainer>
            <StyledBlockSectionContainer>
                {
                    !!search ? 
                    <BlocksMenuBlockTypeSection
                        blocks={getBlocksForSearch()}
                    /> :
                    Array.from(BLOCK_TYPES, (blockType, i) => {
                        return (
                            <BlocksMenuBlockTypeSection
                                key={`${blockType}-${i}`}
                                title={blockType}
                                blocks={getBlocksForType(blockType)}
                            />
                        )
                    })
                }
            </StyledBlockSectionContainer>
        </Stack>
    );
});
