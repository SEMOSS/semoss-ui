import React, { createElement } from 'react';
import { observer } from 'mobx-react-lite';
import { BorderColor, ExpandMore } from '@mui/icons-material';

import { Accordion, Stack, Typography, styled } from '@semoss/ui';

const StyledMenuSectionHeader = styled('div')(({ theme }) => ({
    alignItems: 'center',
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
}));

const StyledMenuSection = styled(Accordion)<{ expansion: boolean }>(
    ({ theme, expansion }) => ({
        boxShadow: 'none',
        borderRadius: '0 !important',
        border: '0px',
        borderBottom: `1px solid ${theme.palette.divider}`,
        ':hover': {
            backgroundColor: expansion ? 'transparent' : '#F5F5F5',
        },
        '&:before': {
            display: 'none',
        },
        '&.Mui-expanded': {
            margin: '0',
            '&:last-child': {
                borderBottom: '0px',
            },
        },
    }),
);

const StyledTypography = styled(Typography)(() => ({}));

const StyledMenuSectionTitle = styled(Accordion.Trigger)<{
    expansion?: boolean;
}>(({ theme, expansion }) => ({
    minHeight: 'auto !important',
    borderLeft: expansion ? '3px solid #1976d2' : '3px solid transparent',
    height: theme.spacing(3),
    paddingLeft: '12px',
    paddingTop: '8px',
    paddingBottom: '8px',
    ':hover': {
        backgroundColor: expansion ? 'transparent' : '#F5F5F5',
    },
    marginTop: expansion ? '8px' : '0px',
    marginBottom: expansion ? '8px' : '0px',
}));

const StyledStack = styled(Stack)(() => ({
    '>.MuiAccordion-root': {
        paddingTop: '8px',
        paddingBottom: '8px',
        marginTop: '0px',
        marginBottom: '8px',
    },
}));

export const SelectedMenuSection = observer(
    (props: {
        id: string;
        sectionTitle: string;
        menu: {
            name: string;
            children: {
                description: string;
                render: (props: { id: string }) => JSX.Element;
            }[];
        }[];
        accordion: object;
        setAccordion: (accordion: object) => void;
    }) => {
        return (
            <StyledStack>
                {props.sectionTitle != '' && (
                    <StyledMenuSectionHeader>
                        <StyledTypography variant="subtitle1">
                            {props.sectionTitle}
                        </StyledTypography>
                    </StyledMenuSectionHeader>
                )}
                {props.menu.map((s, sIdx) => {
                    const key = `section--${sIdx}`;

                    return (
                        <React.Fragment key={key}>
                            <StyledMenuSection
                                expanded={props.accordion[key]}
                                expansion={props.accordion[key]}
                                onChange={() =>
                                    props.setAccordion({
                                        ...props.accordion,
                                        [key]: !props.accordion[key],
                                    })
                                }
                            >
                                <StyledMenuSectionTitle
                                    expandIcon={''}
                                    expansion={props.accordion[key]}
                                >
                                    <StyledTypography variant="body1">
                                        {s.name}
                                    </StyledTypography>
                                </StyledMenuSectionTitle>

                                <Accordion.Content>
                                    {s.children.length > 0 ? (
                                        <Stack direction="column" spacing={1}>
                                            {s.children.map((c, cIdx) => {
                                                return createElement(c.render, {
                                                    key: cIdx,
                                                    id: props.id,
                                                });
                                            })}
                                        </Stack>
                                    ) : null}
                                </Accordion.Content>
                            </StyledMenuSection>
                        </React.Fragment>
                    );
                })}
            </StyledStack>
        );
    },
);
