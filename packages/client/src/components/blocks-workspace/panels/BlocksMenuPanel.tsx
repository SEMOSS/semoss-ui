import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Search, Tune } from '@mui/icons-material';

import {
    styled,
    Badge,
    Grid,
    Stack,
    TextField,
    ToggleTabsGroup,
    Typography,
    Divider,
    InputAdornment,
    IconButton,
} from '@semoss/ui';

import { runPixelTwo } from '../../../runPixelTwo';
import { Panel } from '@/components/workspace';
import { CLIENT_BLOCKS_MENU, SECTION_ORDER } from '../menus/default-menu';
import { AddBlocksMenuCard } from '@/components/designer';
import { BlocksMenuPanelFilterMenu } from './BlocksMenuPanelFilterMenu';
import {
    BlockLocalStorageData,
    DesignerMenuItem,
    FilterCategory,
} from '../menus/menu-types';

const StyledTitle = styled('div')(({ theme }) => ({
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.primary.selected,
    color: theme.palette.info.dark,
    width: '100%',
}));

const StyledHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    lineHeight: theme.spacing(5),
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    border: '1px',
    minHeight: '42px',
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
    width: '100%',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 11px',
    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
}));

const StyledMenu = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: theme.spacing(2),
}));

const StyledGridWrapper = styled('div')({
    width: '100%',
});

const StyledTypography = styled(Typography)({
    userSelect: 'none',
});

type MODE = 'CLIENT' | 'SYSTEM';
export interface AddBlocksMenuProps {
    /** Title to render in the menu */
    title: string;

    /** Items to add to show in the menu.  */
    items: DesignerMenuItem[];
}

const defaultSection = 'Miscellaneous';

/**
 * Add Blocks to the UI
 */
export const BlocksMenuPanel = observer((props: AddBlocksMenuProps) => {
    const { title, items } = props;

    const [search, setSearch] = useState('');
    const [clientBlock, setClientBlock] = useState([]);
    const [mode, setMode] = useState<MODE>('SYSTEM');

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [filterCategoryMap, setFilterCategoryMap] = useState<
        Record<string, FilterCategory>
    >({});

    const anyEnabledFilter = useMemo(
        () =>
            Object.values(filterCategoryMap).some(
                (category) => category.enabled,
            ),
        [filterCategoryMap],
    );

    /**
     * TODO: REPLACE WITH A CALL TO THE BACKEND
     */
    const getClientBlocks = async () => {
        // runPixelTwo('1+1').then((res) => {
        setClientBlock(CLIENT_BLOCKS_MENU);
        // });
    };

    useEffect(() => {
        if (mode === 'CLIENT') {
            getClientBlocks();
        }
    }, [mode]);

    const sortedItems = useMemo(() => {
        // Use Client Block when mode is CLIENT otherwise use items from the props
        const dataToProcess = mode === 'CLIENT' ? clientBlock : items;
        const sectionRecord: Record<string, DesignerMenuItem[]> = {};

        // Group items by section
        dataToProcess.forEach((item) => {
            const currentSection = item.section ?? defaultSection;
            if (!sectionRecord[currentSection])
                sectionRecord[currentSection] = [];
            sectionRecord[currentSection].push(item);
        });

        // Sort sections based on sectionOrder
        return SECTION_ORDER.map((section) => {
            const sectionItems = sectionRecord[section] || [];
            return sectionItems.sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            );
        }).filter((section) => section.length > 0);
    }, [items, mode, clientBlock, SECTION_ORDER]);

    // get the rendered items
    const renderedItems: DesignerMenuItem[][] = useMemo(() => {
        // calculate whether any sections are being filtered
        const anySectionFilter = Object.values(filterCategoryMap).some(
            (filter) => filter.type === 'SECTION' && filter.enabled,
        );

        // room to improve this logic in the future, but for now just keep 6 most used blocks
        const localStorageMap: Record<string, BlockLocalStorageData> =
            JSON.parse(localStorage.getItem('blocks--frequently-used')) ?? {};
        const mostUsedSet = Object.values(localStorageMap)
            .filter((item) => item.use_count)
            .sort((a, b) => a.use_count - b.use_count)
            .slice(0, 6)
            .reduce((acc, curr) => {
                acc.add(curr.widget);
                return acc;
            }, new Set<string>());

        // filter out sections
        const selectSectionItems = (
            sectionItems: DesignerMenuItem[],
        ): DesignerMenuItem[] => {
            if (filterCategoryMap[sectionItems[0].section]?.enabled) {
                // this section is a selected filter; show all of its items
                return sectionItems;
            } else if (filterCategoryMap['Most Used Components']?.enabled) {
                // "Most Used Components" is enabled; return this section's items if they are in most used
                return sectionItems.filter((item) =>
                    mostUsedSet.has(item.json.widget),
                );
            } else if (anySectionFilter) {
                // There are section filters applied, but this section is not selected, return nothing
                return [];
            } else {
                // There are no filters applied, return everything
                return sectionItems;
            }
        };
        const filteredItems = sortedItems
            .map(selectSectionItems)
            .filter((sectionItems) => sectionItems.length);

        if (!search) {
            return filteredItems;
        }

        const s = search.replace(/[^a-z0-9]/gi, '').toLowerCase();

        return (
            filteredItems
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
    }, [sortedItems, search, filterCategoryMap]);

    useEffect(() => {
        setFilterCategoryMap(() => {
            const uniqueSectionMap = items.reduce((acc, curr) => {
                acc[curr.section] = true;
                return acc;
            }, {});
            const sortedSections = Object.keys(uniqueSectionMap).sort();
            return sortedSections.reduce(
                (acc, curr) => {
                    acc[curr] = {
                        id: curr,
                        enabled: false,
                        type: 'SECTION',
                    } satisfies FilterCategory;
                    return acc;
                },
                {
                    'Most Used Components': {
                        id: 'Most Used Components',
                        enabled: false,
                        type: 'MOST_USED_COMPONENTS',
                    } satisfies FilterCategory,
                },
            );
        });
    }, [items]);

    return (
        <Panel>
            <Stack height="100%">
                <StyledTitle>
                    <Typography variant={'h6'}>{title}</Typography>
                </StyledTitle>
                <Stack paddingTop={2} paddingLeft={2} paddingRight={2}>
                    <TextField
                        placeholder="Search Components"
                        size="small"
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={(e) =>
                                            setMenuAnchorEl(e.currentTarget)
                                        }
                                    >
                                        <Badge
                                            variant="dot"
                                            invisible={!anyEnabledFilter}
                                            color="primary"
                                        >
                                            <Tune />
                                        </Badge>
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <StyledToggleTabsGroup
                        value={mode}
                        onChange={(e: React.SyntheticEvent, val) => {
                            setMode(val as MODE);
                            if (val === 'CLIENT') {
                                getClientBlocks();
                            }
                        }}
                    >
                        <StyledToggleTabsGroupItem
                            label="System Blocks"
                            value={'SYSTEM'}
                        />
                        <StyledToggleTabsGroupItem
                            label="Client Blocks"
                            value={'CLIENT'}
                        />
                    </StyledToggleTabsGroup>
                </Stack>

                {renderedItems.length ? (
                    <StyledMenu>
                        {renderedItems.map((sectionItems, index) => (
                            <Stack
                                key={sectionItems[0].section ?? defaultSection}
                                width="100%"
                            >
                                {index > 0 && (
                                    <Stack paddingTop={1}>
                                        <Divider variant="fullWidth" flexItem />
                                    </Stack>
                                )}
                                <Stack padding={2}>
                                    <StyledTypography
                                        variant="subtitle2"
                                        key={index}
                                    >
                                        {sectionItems[0].section ??
                                            defaultSection}
                                    </StyledTypography>
                                </Stack>
                                <StyledGridWrapper>
                                    <Grid
                                        container
                                        spacing={2}
                                        width="100%"
                                        paddingLeft={2}
                                    >
                                        {sectionItems.map((block) => (
                                            <Grid item key={block.name}>
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
                ) : (
                    <Stack padding={2}>
                        <Typography variant="subtitle2">
                            No items found
                        </Typography>
                    </Stack>
                )}
            </Stack>
            <BlocksMenuPanelFilterMenu
                anchorEl={menuAnchorEl}
                onClose={() => setMenuAnchorEl(null)}
                categoryMap={filterCategoryMap}
                setCategoryMap={setFilterCategoryMap}
            />
        </Panel>
    );
});
