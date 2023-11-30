import React, { createElement, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Accordion,
    Button,
    Stack,
    Typography,
    IconButton,
    Divider,
    TextField,
    Collapse,
} from '@semoss/ui';
import { useBlock, useBlocks, useDesigner } from '@/hooks';
import { SearchOutlined, ExpandMore, DeleteOutline } from '@mui/icons-material';
import { getIconForBlock } from '../block-defaults';
import { BlockAvatar } from './BlockAvatar';
import { SelectedMenuSection } from './SelectedMenuSection';

const StyledTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
    fontWeight: 'bold',
}));

const Spacer = styled('div')(() => ({
    flex: 1,
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
}));

const StyledMenuHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    height: '100%',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

export const SelectedMenu = observer(() => {
    const { designer } = useDesigner();
    const { state, registry } = useBlocks();

    const [contentAccordion, setContentAccordion] = useState<
        Record<string, boolean>
    >({});
    const [styleAccordion, setStyleAccordion] = useState<
        Record<string, boolean>
    >({});
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    // get the selected block
    const block = designer.selected ? state.getBlock(designer.selected) : null;

    // get the content menu
    const contentMenu = useMemo(() => {
        if (!registry || !block || !registry[block.widget]) {
            return [];
        }

        const m = registry[block.widget].contentMenu;

        // clear out the accordion
        const acc = {};
        for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
            const key = `section--${sIdx}`;

            acc[key] = true;
        }
        setContentAccordion(acc);

        // set the menu with search filter
        if (!!search) {
            // filter section headers that match search
            const filteredSectionMenu = m.filter((menuItem) => {
                if (menuItem.name.toLowerCase().includes(search)) {
                    return true;
                }
                return menuItem.children.some((child) => {
                    return child.description.toLowerCase().includes(search);
                });
            });
            // filter section children that match search
            return filteredSectionMenu.map((menuItem) => {
                return {
                    ...menuItem,
                    children: menuItem.children.filter((child) =>
                        child.description.toLowerCase().includes(search),
                    ),
                };
            });
        }
        return m;
    }, [registry, block ? block.widget : '', search]);

    // get the style menu
    const styleMenu = useMemo(() => {
        if (!registry || !block || !registry[block.widget]) {
            return [];
        }

        const m = registry[block.widget].styleMenu;

        // clear out the accordion
        const acc = {};
        for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
            const key = `section--${sIdx}`;

            acc[key] = true;
        }
        setStyleAccordion(acc);

        // set the menu with search filter
        if (!!search) {
            // filter section headers that match search
            const filteredSectionMenu = m.filter((menuItem) => {
                if (menuItem.name.toLowerCase().includes(search)) {
                    return true;
                }
                return menuItem.children.some((child) => {
                    return child.description.toLowerCase().includes(search);
                });
            });
            // filter section children that match search
            return filteredSectionMenu.map((menuItem) => {
                return {
                    ...menuItem,
                    children: menuItem.children.filter((child) =>
                        child.description.toLowerCase().includes(search),
                    ),
                };
            });
        }
        return m;
    }, [registry, block ? block.widget : '', search]);

    // ignore if there is no menu
    if (!block) {
        return (
            <StyledMenuHeader>
                <Typography variant="body1">
                    <em>Select a component to configure styling</em>
                </Typography>
            </StyledMenuHeader>
        );
    }

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Stack
                    flex={1}
                    spacing={2}
                    direction="row"
                    alignItems={'center'}
                >
                    <BlockAvatar icon={getIconForBlock(block.widget)} />
                    <StyledTypography variant="h6">
                        {block.widget}
                    </StyledTypography>
                    <Spacer />
                    <Collapse orientation="horizontal" in={showSearch}>
                        <TextField
                            placeholder="Search"
                            size="small"
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
                        <SearchOutlined fontSize="medium" />
                    </IconButton>
                </Stack>
            </StyledMenuHeader>
            <Divider />
            <StyledMenuScroll>
                {contentMenu.length ? (
                    <SelectedMenuSection
                        id={block.id}
                        sectionTitle="Content"
                        menu={contentMenu}
                        accordion={contentAccordion}
                        setAccordion={setContentAccordion}
                    />
                ) : (
                    <></>
                )}
                <SelectedMenuSection
                    id={block.id}
                    sectionTitle="Appearance"
                    menu={styleMenu}
                    accordion={styleAccordion}
                    setAccordion={setStyleAccordion}
                />
            </StyledMenuScroll>
            {/* <StyledMenuHeader>
                <Typography variant="subtitle1">Appearance</Typography>
            </StyledMenuHeader>
            <StyledMenuScroll>
                {styleMenu.map((s: {name: string;
                    children: {
                        description: string;
                        render: (props: {
                            id: string;
                        }) => JSX.Element;
                    }[];
                }, sIdx: number) => {
                    const key = `section--${sIdx}`;

                    return (
                        <React.Fragment key={key}>
                            <StyledMenuSection
                                expanded={accordion[key]}
                                onChange={() =>
                                    setAccordion({
                                        ...accordion,
                                        [key]: !accordion[key],
                                    })
                                }
                            >
                                <StyledMenuSectionTitle
                                    expandIcon={<ExpandMore />}
                                >
                                    <StyledMenuSectionTitleTypography variant="body2">
                                        {s.name}
                                    </StyledMenuSectionTitleTypography>
                                </StyledMenuSectionTitle>
                                <Accordion.Content>
                                    {s.children.length > 0 ? (
                                        <Stack direction="column" spacing={1}>
                                            {s.children.map((c, cIdx) => {
                                                return createElement(c.render, {
                                                    key: cIdx,
                                                    id: block.id,
                                                });
                                            })}
                                        </Stack>
                                    ) : null}
                                </Accordion.Content>
                            </StyledMenuSection>
                        </React.Fragment>
                    );
                })}
            </StyledMenuScroll> */}
        </StyledMenu>
    );
});
