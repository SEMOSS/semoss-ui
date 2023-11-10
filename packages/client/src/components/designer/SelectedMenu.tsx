import React, { createElement, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Accordion,
    Stack,
    Icon,
    Typography,
    IconButton,
    Divider,
} from '@semoss/ui';

import { useBlocks, useDesigner } from '@/hooks';
import {
    BarChartOutlined,
    SearchOutlined,
    ExpandMore,
} from '@mui/icons-material';

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

export const SelectedMenu = observer(() => {
    const { designer } = useDesigner();
    const { state, registry } = useBlocks();

    const [accordion, setAccordion] = useState<Record<string, boolean>>({});

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

        // set the menu
        return m;
    }, [registry, block ? block.widget : '']);

    // ignore if there is no menu
    if (!block) {
        return <>Select a Block</>;
    }

    return (
        <StyledMenu>
            <StyledMenuHeader>
                <Icon fontSize="medium">
                    <BarChartOutlined />
                </Icon>
                <Stack flex={'1'} direction="row" alignItems={'center'}>
                    <Typography
                        variant="body1"
                        fontWeight="regular"
                        sx={{
                            flex: '1',
                        }}
                    >
                        {block.widget}
                    </Typography>
                    <IconButton size="small" color="default">
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
                            {/* <Divider /> */}
                        </React.Fragment>
                    );
                })}
            </StyledMenuScroll>
        </StyledMenu>
    );
});
