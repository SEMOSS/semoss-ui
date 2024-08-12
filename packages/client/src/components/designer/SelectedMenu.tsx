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
import {
    ContentCopy,
    LibraryAdd,
    Search,
    SearchOff,
} from '@mui/icons-material';
import { BlockAvatar } from './BlockAvatar';
import { SelectedMenuSection } from './SelectedMenuSection';
// import { getIconForMenuItemByKey } from './designer.constants';
import { getIconForBlock } from '../block-defaults';
import { AddVariableModal } from '../notebook/AddVariableModal';
import { INPUT_BLOCK_TYPES } from '@/stores';

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
    overflowY: 'auto',
}));

const StyledMessage = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
    const [addVariableModal, setAddVariableModal] = useState(false);

    // get the selected block
    const block = designer.selected ? state.getBlock(designer.selected) : null;

    const variableName = state.getAlias(designer.selected);
    const canVariabilize = block
        ? INPUT_BLOCK_TYPES.indexOf(block.widget) > -1
        : false;

    // get the content menu
    const contentMenu = useMemo(() => {
        if (!registry || !block || !registry[block.widget]) {
            return [];
        }

        const m = registry[block.widget]?.contentMenu ?? [];

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

        const m = registry[block.widget]?.styleMenu ?? [];

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
                message: 'Successfully copied ID',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy ID',
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
            <StyledMessage>
                <Typography variant="caption">
                    Select a block to update
                </Typography>
            </StyledMessage>
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
                        {variableName ? (
                            <IconButton
                                aria-label="copy"
                                color="default"
                                size="small"
                                title={`{{${variableName}}}`}
                                onClick={() => copy(`{{${variableName}}}`)}
                            >
                                <ContentCopy fontSize="small" />
                            </IconButton>
                        ) : canVariabilize ? (
                            <IconButton
                                aria-label="copy"
                                color="default"
                                size="small"
                                title={'Add variable'}
                                onClick={() => {
                                    setAddVariableModal(true);
                                }}
                            >
                                <LibraryAdd fontSize="small" />
                            </IconButton>
                        ) : null}
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
            {addVariableModal ? (
                <AddVariableModal
                    open={true}
                    type="block"
                    to={designer.selected}
                    onClose={() => setAddVariableModal(false)}
                />
            ) : null}
        </StyledMenu>
    );
});
