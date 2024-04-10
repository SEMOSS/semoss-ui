import { createElement, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    Typography,
    IconButton,
    Divider,
    TextField,
    Collapse,
    useNotification,
} from '@semoss/ui';
import { useBlocks, useDesigner } from '@/hooks';
import { ContentCopy, Search, SearchOff } from '@mui/icons-material';
import { BlockAvatar } from './BlockAvatar';
import { SelectedMenuSection } from './SelectedMenuSection';
// import { getIconForMenuItemByKey } from './designer.constants';
import { getIconForBlock } from '../block-defaults';

const StyledTitle = styled(Typography)(() => ({
    textTransform: 'capitalize',
    fontWeight: 'bold',
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
}));

export const SelectedMenu = observer(() => {
    const { designer } = useDesigner();
    const { state, registry } = useBlocks();
    const notification = useNotification();

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

        let m = registry[block.widget]?.contentMenu ?? [];

        // clear out the accordion
        const acc = {};
        for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
            const key = `section--${sIdx}`;

            acc[key] = true;
        }
        setContentAccordion(acc);

        // set the menu with search filter
        if (search) {
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

        let m = registry[block.widget]?.styleMenu ?? [];

        // clear out the accordion
        const acc = {};
        for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
            const key = `section--${sIdx}`;

            acc[key] = true;
        }
        setStyleAccordion(acc);

        // set the menu with search filter
        if (search) {
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

    // new custom righthand menu content
    const menu = useMemo(() => {
        if (!registry || !block || !registry[block.widget]) {
            return null;
        }

        return registry[block.widget]?.menu ?? null;
    }, [registry, block ? block.widget : '']);

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied id',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy id',
            });
        }
    };

    // clear search on blocks no longer selected
    useMemo(() => {
        if (!block) {
            setSearch('');
            setShowSearch(false);
        }
    }, [block]);

    const getBlockDisplay = () => {
        if (block) {
            return block.data?.variation
                ? (block.data.variation as string).replaceAll('-', ' ')
                : block.widget.replaceAll('-', ' ');
        } else {
            return '';
        }
    };

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
                <Stack flex={1} spacing={2} direction="row" alignItems="center">
                    <BlockAvatar icon={getIconForBlock(block.widget)} />
                    <Stack direction={'row'} spacing={0.5} alignItems="center">
                        <StyledTitle variant="h6">
                            {getBlockDisplay()}
                        </StyledTitle>
                        <IconButton
                            aria-label="copy"
                            color="default"
                            size="small"
                            title={`{{${block.id}}}`}
                            onClick={() => copy(`{{${block.id}}}`)}
                        >
                            <ContentCopy fontSize="small" />
                        </IconButton>
                    </Stack>

                    {!menu && (
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
                                    value={search}
                                    variant="outlined"
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </Collapse>
                            <IconButton
                                aria-label="toggle-search"
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
                    )}
                </Stack>
            </StyledMenuHeader>
            <Divider />
            <StyledMenuScroll>
                {!!menu &&
                    createElement(menu, {
                        id: block.id,
                    })}

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
                {styleMenu.length ? (
                    <SelectedMenuSection
                        id={block.id}
                        sectionTitle="Appearance"
                        menu={styleMenu}
                        accordion={styleAccordion}
                        setAccordion={setStyleAccordion}
                    />
                ) : (
                    <></>
                )}
            </StyledMenuScroll>
        </StyledMenu>
    );
});
