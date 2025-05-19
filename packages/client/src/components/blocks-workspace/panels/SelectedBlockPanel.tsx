import { createElement, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    ContentCopy,
    LibraryAdd,
    Search,
    SearchOff,
} from '@mui/icons-material';

import { useBlocks, INPUT_BLOCK_TYPES } from '@semoss/renderer';
import {
    styled,
    Stack,
    Typography,
    IconButton,
    Divider,
    TextField,
    Collapse,
    useNotification,
    Modal,
    Tabs,
    Tab,
    ToggleTabsGroup,
} from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { BlockAvatar, SelectedMenuSection } from '@/components/designer';
import { AddVariableModal } from '@/components/notebook';
import { Panel } from '@/components/workspace';

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
    '>.MuiBox-root': {
        width: '100%',
        backgroundColor: 'transparent',
    },
}));

const StyledMessage = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
}));
//Tab group with custom style with width and margin
const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    minHeight: '42px',
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    '.MuiTabs-scroller': {
        display: 'flex',
        justifyContent: 'space-around',
        '.MuiTabs-flexContainer': {
            flex: 1,
            padding: '3px',
            backgroundColor: 'rgb(0, 0, 0, 0.04)',
            borderRadius: '12px',
            '.MuiButtonBase-root': {
                padding: '6px 8px',
            },
        },
    },
}));
//toggle group item styling
const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 16px',

    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
}));
const StyledCustomTabPanel = styled('div')(({ theme }) => ({}));

export const SelectedBlockPanel = observer(() => {
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
    const [settingSection, setSettingSection] = useState<string | number>(0); //state to maintain the selected tab in setting appearance tab

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

    // get the icon
    const icon = useMemo(() => {
        if (!registry || !block || !registry[block.widget]) {
            return null;
        }

        const w = registry[block.widget];
        if (!w) {
            return null;
        }

        return w.icon;
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
            <Panel>
                <StyledMessage>
                    <Typography variant="caption">
                        Select a block to update
                    </Typography>
                </StyledMessage>
            </Panel>
        );
    }

    return (
        <Panel>
            <StyledMenu>
                <StyledMenuHeader>
                    <Stack
                        flex={1}
                        spacing={2}
                        direction="row"
                        alignItems="center"
                    >
                        <BlockAvatar icon={icon} />
                        <Stack
                            direction={'row'}
                            spacing={0.5}
                            alignItems="center"
                        >
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
                                <Collapse
                                    orientation="horizontal"
                                    in={showSearch}
                                >
                                    <TextField
                                        placeholder="Search"
                                        size="small"
                                        value={search}
                                        variant="outlined"
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
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
                {/* <Divider /> */}
                <StyledMenuScroll>
                    {!!menu &&
                        createElement(menu, {
                            id: block.id,
                        })}

                    {
                        /**
                         * This section will show Setting and Appearance tabs if there are any content or style menus
                         * If there are no content or style menus, it will not show the tabs
                         */
                        (contentMenu.length > 0 || styleMenu.length > 0) && (
                            <StyledToggleTabsGroup
                                variant="fullWidth"
                                value={settingSection}
                                sx={{
                                    display: 'flex',
                                    padding: '8px 16px',
                                    alignItems: 'center',
                                    alignSelf: 'stretch',
                                }}
                                onChange={(
                                    e: React.SyntheticEvent,
                                    val: string,
                                ) => {
                                    setSettingSection(val);
                                }}
                            >
                                <StyledToggleTabsGroupItem
                                    label="Settings"
                                    value={0}
                                />
                                <StyledToggleTabsGroupItem
                                    label="Appearance"
                                    value={1}
                                />
                            </StyledToggleTabsGroup>
                        )
                    }

                    {
                        /**
                         * This section will show the content menu when setting tab is selected
                         */
                        contentMenu.length > 0 && (
                            <StyledCustomTabPanel
                                role="tabpanel"
                                id={`simple-tabpanel-0`}
                                aria-labelledby={`simple-tab-0`}
                                hidden={settingSection !== 0 ? true : false}
                            >
                                {contentMenu.length ? (
                                    <SelectedMenuSection
                                        id={block.id}
                                        sectionTitle=""
                                        menu={contentMenu}
                                        accordion={contentAccordion}
                                        setAccordion={setContentAccordion}
                                    />
                                ) : (
                                    <></>
                                )}
                            </StyledCustomTabPanel>
                        )
                    }
                    {
                        /**
                         * This section will show the style menu when appearance tab is selected
                         */
                        styleMenu.length > 0 && (
                            <StyledCustomTabPanel
                                role="tabpanel"
                                id={`simple-tabpanel-1`}
                                aria-labelledby={`simple-tab-1`}
                                hidden={settingSection !== 1 ? true : false}
                            >
                                {styleMenu.length ? (
                                    <SelectedMenuSection
                                        id={block.id}
                                        sectionTitle=""
                                        menu={styleMenu}
                                        accordion={styleAccordion}
                                        setAccordion={setStyleAccordion}
                                    />
                                ) : (
                                    <></>
                                )}
                            </StyledCustomTabPanel>
                        )
                    }
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
        </Panel>
    );
});
