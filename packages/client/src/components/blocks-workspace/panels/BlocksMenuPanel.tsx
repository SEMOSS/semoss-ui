import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import {
    styled,
    Grid,
    IconButton,
    Stack,
    TextField,
    Typography,
    Divider,
} from '@semoss/ui';

import { AddBlocksMenuCard, DesignerMenuItem } from '@/components/designer';
import { Panel } from '@/components/workspace';

const StyledTitle = styled('div')(({ theme }) => ({
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.action.focus,
    width: '100%',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    height: '100%',
    overflowY: 'auto',
}));

const StyledSection = styled('div')(({ theme }) => ({
    ...theme.typography.caption,
}));

export interface AddBlocksMenuProps {
    /** Title to render in the menu */
    title: string;

    /** Items to add to show in the menu.  */
    items: DesignerMenuItem[];
}

/**
 * Add Blocks to the UI
 */
export const BlocksMenuPanel = observer((props: AddBlocksMenuProps) => {
    const { title, items } = props;

    const [search, setSearch] = useState('');
    // TODO: filters
    // const [showFilters, setShowFilters] = useState<boolean>(false);

    // TODO: Move to backend + lazyload
    // sort by section so we can show the keys when they are different
    const sortedItems: DesignerMenuItem[][] = useMemo(() => {
        const sectionRecord: Record<string, DesignerMenuItem[]> = {};

        items.forEach((item) => {
            if (!sectionRecord[item.section]) sectionRecord[item.section] = [];
            sectionRecord[item.section].push(item);
        });

        return Object.keys(sectionRecord)
            .sort()
            .map((section) =>
                sectionRecord[section].sort((a, b) =>
                    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
                ),
            );
    }, [items]);

    // get the rendered items
    const renderedItems: DesignerMenuItem[][] = useMemo(() => {
        if (!search) {
            return sortedItems;
        }

        const s = search.replace(/[^a-z0-9]/gi, '').toLowerCase();

        return sortedItems
            .map((sectionItems) =>
                sectionItems.filter((item) =>
                    item.name
                        .replace(/[^a-z0-9]/gi, '')
                        .toLowerCase()
                        .includes(s),
                ),
            )
            .filter((sectionItems) => sectionItems.length);
    }, [sortedItems, search]);

    return (
        <Panel>
            <Stack spacing={0}>
                <StyledTitle>
                    <Typography variant={'h6'} color="primary">
                        {title}
                    </Typography>
                </StyledTitle>
                <Stack padding={2}>
                    <TextField
                        // TODO: start + end icons
                        placeholder="Search Components"
                        size="small"
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </Stack>
                <Divider orientation="horizontal" variant="fullWidth" />
                {renderedItems.length ? (
                    // <StyledMenu>
                    // <Grid container spacing={2}>
                    //     {renderedItems.map((item, idx) => {
                    //         // get the previous + next item
                    //         const prev = renderedItems[idx - 1] || null;
                    //         const next = renderedItems[idx + 1] || null;

                    //         return (
                    //             <React.Fragment key={idx}>
                    //                 {/* Why does width extend Designer screen */}
                    //                 {!prev || prev.section !== item.section ? (
                    //                     <Grid
                    //                         item
                    //                         xs={12}
                    //                         sx={{ width: '50px' }}
                    //                     >
                    //                         <StyledSection>
                    //                             {item.section}
                    //                         </StyledSection>
                    //                     </Grid>
                    //                 ) : null}

                    //                 <Grid item xs={6} sx={{ width: '50px' }}>
                    //                     <AddBlocksMenuCard item={item} />
                    //                 </Grid>
                    //                 {next && next.section !== item.section ? (
                    //                     <Grid
                    //                         item
                    //                         xs={12}
                    //                         sx={{ width: '50px' }}
                    //                     >
                    //                         <Divider
                    //                             orientation="horizontal"
                    //                             variant="fullWidth"
                    //                             flexItem={true}
                    //                         />
                    //                     </Grid>
                    //                 ) : null}
                    //             </React.Fragment>
                    //         );
                    //     })}
                    // </Grid>
                    // </StyledMenu>
                    <Typography variant="caption">No items found</Typography>
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
            </Stack>
        </Panel>
    );
});
