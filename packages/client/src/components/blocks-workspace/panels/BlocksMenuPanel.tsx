import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Grid,
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
    backgroundColor: theme.palette.primary.selected,
    color: theme.palette.info.dark,
    width: '100%',
}));

const StyledMenu = styled(Stack)(() => ({
    height: '100%',
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
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

        // sort items by section
        items.forEach((item) => {
            if (!sectionRecord[item.section]) sectionRecord[item.section] = [];
            sectionRecord[item.section].push(item);
        });

        // sort sections by name
        return Object.keys(sectionRecord)
            .sort()
            .map((section) =>
                // sort items within each section by name
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

        return (
            sortedItems
                .map((sectionItems) =>
                    // pattern match on s
                    sectionItems.filter((item) =>
                        item.name
                            .replace(/[^a-z0-9]/gi, '')
                            .toLowerCase()
                            .includes(s),
                    ),
                )
                // only include sections that have remaining blocks
                .filter((sectionItems) => sectionItems.length)
        );
    }, [sortedItems, search]);

    return (
        <Panel>
            <Stack height="100%">
                <StyledTitle>
                    <Typography variant={'h6'}>{title}</Typography>
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
                <Divider />
                {renderedItems.length ? (
                    <StyledMenu>
                        {renderedItems.map((sectionItems, index) => (
                            <Stack key={sectionItems[0].section} width="100%">
                                {index > 0 && (
                                    <Divider variant="fullWidth" flexItem />
                                )}
                                <Stack padding={2}>
                                    <Typography variant="subtitle2" key={index}>
                                        {sectionItems[0].section}
                                    </Typography>
                                </Stack>
                                <Grid container spacing={2} width="100%">
                                    {sectionItems.map((block, index) => (
                                        <Grid
                                            item
                                            key={block.name}
                                            style={{
                                                backgroundColor: 'primary',
                                            }}
                                        >
                                            <AddBlocksMenuCard item={block} />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Stack>
                        ))}
                    </StyledMenu>
                ) : (
                    <Stack padding={2}>
                        <Typography variant="subtitle2">
                            No items found
                        </Typography>
                    </Stack>
                )}
            </Stack>
        </Panel>
    );
});
