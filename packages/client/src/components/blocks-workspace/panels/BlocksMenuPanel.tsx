import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Search, SearchOff } from '@mui/icons-material';

import {
    styled,
    Grid,
    Stack,
    TextField,
    ToggleTabsGroup,
    Typography,
    Divider,
} from '@semoss/ui';

import { DesignerMenuItem } from '../menus/menu-types';
import { AddBlocksMenuCard } from '@/components/designer';
import { Panel } from '@/components/workspace';
import { SECTION_ORDER } from '../menus/default-menu';

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

const StyledSection = styled('div')(({ theme }) => ({
    ...theme.typography.caption,
}));

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
    const [mode, setMode] = useState<MODE>('SYSTEM');

    const sortedItems = useMemo(() => {
        const sectionRecord: Record<string, DesignerMenuItem[]> = {};

        // Group items by section
        items.forEach((item) => {
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
    }, [items, SECTION_ORDER]);

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
                <Stack paddingTop={2} paddingLeft={2} paddingRight={2}>
                    <TextField
                        // TODO: start + end icons
                        placeholder="Search Components"
                        size="small"
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {/* <StyledToggleTabsGroup
                        value={mode}
                        onChange={(e: React.SyntheticEvent, val) => {
                            setMode(val as MODE);
                        }}
                    >
                        <StyledToggleTabsGroupItem
                            label="System Blocks"
                            value={'SYSTEM'}
                        />
                        <StyledToggleTabsGroupItem
                            label="Client Blocks"
                            value={'CLIENT'}
                            disabled={true}
                            />
                    </StyledToggleTabsGroup> */}
                    {/* 
                    // TODO: Coming next, asked van buren to
                    // start looking at how to incorporate groupings,
                    // if not done by 2/19/25, will take it over 
                    */}
                </Stack>

                {/* TODO: Two Different Menus: Client and System */}
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
        </Panel>
    );
});
