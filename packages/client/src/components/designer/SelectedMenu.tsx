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
    justifyContent: 'flex-end',
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

const StyledMenuSection = styled(Accordion)(({ theme }) => ({
    boxShadow: 'none',
    borderRadius: '0 !important',
    border: '0px',
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:before': {
        display: 'none',
    },
    '&.Mui-expanded': {
        margin: '0',
        '&:last-child': {
            borderBottom: '0px',
        },
    },
}));

const StyledMenuSectionTitle = styled(Accordion.Trigger)(({ theme }) => ({
    minHeight: 'auto !important',
    height: theme.spacing(6),
}));

interface DeleteBlockMenuItemProps {
    /**
     * Id of the block that is being worked with
     */
    id: string;
}

const DeleteBlockMenuItem = observer(({ id }: DeleteBlockMenuItemProps) => {
    const { deleteBlock } = useBlock(id);
    const { designer } = useDesigner();
    return (
        <>
            {
                // don't allow deletion of the base rendered element (page)
                designer.rendered === id ? (
                    <></>
                ) : (
                    <Stack direction="row" padding={2}>
                        <Button
                            color="error"
                            fullWidth
                            startIcon={<DeleteOutline />}
                            variant="outlined"
                            onClick={() => {
                                deleteBlock();
                                designer.setSelected('');
                            }}
                        >
                            Delete Block
                        </Button>
                    </Stack>
                )
            }
        </>
    );
});

export const SelectedMenu = observer(() => {
    const { designer } = useDesigner();
    const { state, registry } = useBlocks();

    const [accordion, setAccordion] = useState<Record<string, boolean>>({});
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    // get the selected block
    const block = designer.selected ? state.getBlock(designer.selected) : null;

    // get the menu
    const menu = useMemo(() => {
        if (!registry || !block || !registry[block.widget]) {
            return [];
        }

        const m = registry[block.widget].menu;

        // clear out the accordion
        const acc = {};
        for (let sIdx = 0, sLen = m.length; sIdx < sLen; sIdx++) {
            const key = `section--${sIdx}`;

            acc[key] = true;
        }
        setAccordion(acc);

        // set the menu with search filter
        if (!!search) {
            return m.filter((menuItem) => {
                if (menuItem.name.toLowerCase().includes(search)) {
                    return true;
                } else {
                    menuItem.children.forEach((child) => {
                        if (child.description.toLowerCase().includes(search)) {
                            return true;
                        }
                    });
                }
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
                {menu.map((s, sIdx) => {
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
                                    <Typography variant="subtitle2">
                                        {s.name}
                                    </Typography>
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
                <DeleteBlockMenuItem id={block?.id} />
            </StyledMenuScroll>
        </StyledMenu>
    );
});
