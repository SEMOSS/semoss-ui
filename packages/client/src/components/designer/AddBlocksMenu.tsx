import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import {
    styled,
    Grid,
    Collapse,
    IconButton,
    Stack,
    TextField,
    Typography,
    Divider,
} from '@semoss/ui';
import { Search, SearchOff } from '@mui/icons-material';

import { AddBlocksMenuItem as AddBlocksMenuItem } from './designer.constants';
import { AddBlocksMenuCard } from './AddBlocksMenuCard';

const StyledHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledMenu = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    height: '100%',
    overflowY: 'auto',
    paddingLeft: theme.spacing(2),
}));

const StyledSection = styled('div')(({ theme }) => ({
    ...theme.typography.caption,
}));

export interface AddBlocksMenuProps {
    /** Title to render in the menu */
    title: string;

    /** Items to add to show in the menu.  */
    items: AddBlocksMenuItem[];
}

/**
 * AddBlocks to the UI
 */
export const AddBlocksMenu = observer((props: AddBlocksMenuProps) => {
    const { title, items } = props;

    const [search, setSearch] = useState('');
    const [showSearch, setShowSearch] = useState<boolean>(false);

    // TODO: Move to backend + lazyload
    // sort by section so we can show the keys when they are different
    const sortedItems = useMemo(() => {
        return items.sort((a, b) => {
            const aSection = a.section.toLowerCase();
            const bSection = b.section.toLowerCase();
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            if (aSection < bSection) {
                return -1;
            }
            if (aSection > bSection) {
                return 1;
            }
            if (aName < bName) {
                return -1;
            }
            if (aName > bName) {
                return 1;
            }
            return 0;
        });
    }, [items]);

    // get the rendered items
    const renderedItems = useMemo(() => {
        if (!search) {
            return items;
        }

        const s = search.toLowerCase();

        return items.filter((block) => {
            return block.name.replaceAll('-', ' ').includes(s);
        });
    }, [sortedItems, search]);

    return (
        <Stack height="100%" pt={2}>
            <StyledHeader>
                <Typography variant={'h6'}>{title}</Typography>
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
            </StyledHeader>
            <StyledMenu>
                {renderedItems.length ? (
                    <Grid container spacing={2}>
                        {renderedItems.map((item, idx) => {
                            // get the previous + next item
                            const prev = renderedItems[idx - 1] || null;
                            const next = renderedItems[idx + 1] || null;

                            return (
                                <React.Fragment key={idx}>
                                    {/* Why does width extend Designer screen */}
                                    {!prev || prev.section !== item.section ? (
                                        <Grid
                                            item
                                            xs={12}
                                            sx={{ width: '50px' }}
                                        >
                                            <StyledSection>
                                                {item.section}
                                            </StyledSection>
                                        </Grid>
                                    ) : null}

                                    <Grid item xs={6} sx={{ width: '50px' }}>
                                        <AddBlocksMenuCard item={item} />
                                    </Grid>
                                    {next && next.section !== item.section ? (
                                        <Grid
                                            item
                                            xs={12}
                                            sx={{ width: '50px' }}
                                        >
                                            <Divider
                                                orientation="horizontal"
                                                variant="fullWidth"
                                                flexItem={true}
                                            />
                                        </Grid>
                                    ) : null}
                                </React.Fragment>
                            );
                        })}
                    </Grid>
                ) : (
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'center'}
                    >
                        <Typography variant="caption">
                            No items found
                        </Typography>
                    </Stack>
                )}
            </StyledMenu>
        </Stack>
    );
});
