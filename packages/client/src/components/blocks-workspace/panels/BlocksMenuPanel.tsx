import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Grid,
    Stack,
    TextField,
    Typography,
    Divider,
    CircularProgress,
} from '@semoss/ui';
import { AddBlocksMenuCard, DesignerMenuItem } from '@/components/designer';
import { Panel } from '@/components/workspace';
import { usePixel } from '@/hooks';

const StyledTitle = styled('div')(({ theme }) => ({
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.primary.selected,
    color: theme.palette.info.dark,
    width: '100%',
}));

const StyledMenu = styled(Stack)(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: theme.spacing(2),
}));

const StyledGridWrapper = styled('div')({
    width: '100%',
});

export interface AddBlocksMenuProps {
    /** Title to render in the menu */
    title: string;

    /** Items to add to show in the menu.  */
    classification: string;
}

/**
 * Add Blocks to the UI
 */
export const BlocksMenuPanel = observer((props: AddBlocksMenuProps) => {
    const { title, classification } = props;

    const [search, setSearch] = useState('');
    // TODO: filters
    // const [showFilters, setShowFilters] = useState<boolean>(false);
    const { status, data } = usePixel<DesignerMenuItem[]>(
        `ListThemeData ( tableName = "BLOCKS_TEMPLATE" , filters = [ Filter ( BLOCKS_TEMPLATE__CLASSIFICATION == ${JSON.stringify(
            classification,
        )} ) ] ) ;`,
    );

    // sort by section so we can show the keys when they are different
    const sortedItems: DesignerMenuItem[][] = useMemo(() => {
        const sectionRecord: Record<string, DesignerMenuItem[]> = {};

        // sort items by section
        data?.forEach((item) => {
            if (!sectionRecord[item.SECTION]) sectionRecord[item.SECTION] = [];
            sectionRecord[item.SECTION].push(item);
        }) ?? [];

        // sort sections by name
        return Object.keys(sectionRecord)
            .sort()
            .map((section) =>
                // sort items within each section by name
                sectionRecord[section].sort((a, b) =>
                    a.NAME.toLowerCase().localeCompare(b.NAME.toLowerCase()),
                ),
            );
    }, [data]);

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
                        item.NAME.replace(/[^a-z0-9]/gi, '')
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
                            <Stack
                                key={sectionItems[0].SECTION ?? 'Miscellaneous'}
                                width="100%"
                            >
                                {index > 0 && (
                                    <Stack paddingTop={1}>
                                        <Divider variant="fullWidth" flexItem />
                                    </Stack>
                                )}
                                <Stack padding={2}>
                                    <Typography variant="subtitle2" key={index}>
                                        {sectionItems[0].SECTION ??
                                            'Miscellaneous'}
                                    </Typography>
                                </Stack>
                                <StyledGridWrapper>
                                    <Grid
                                        container
                                        spacing={2}
                                        width="100%"
                                        paddingLeft={2}
                                    >
                                        {sectionItems.map((block) => (
                                            <Grid item key={block.ID}>
                                                <AddBlocksMenuCard
                                                    item={block}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </StyledGridWrapper>
                            </Stack>
                        ))}
                    </StyledMenu>
                ) : ['SUCCESS', 'ERROR'].includes(status) ? (
                    <Stack padding={2}>
                        <Typography variant="subtitle2">
                            No items found
                        </Typography>
                    </Stack>
                ) : (
                    <Stack
                        height="100%"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <CircularProgress />
                    </Stack>
                )}
            </Stack>
        </Panel>
    );
});
