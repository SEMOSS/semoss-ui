import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useForm } from 'react-hook-form';
import { MetamodelNode } from './MetamodelNode';
import {
    ExpandMore,
    ExpandMoreRounded,
    Keyboard,
    KeyboardDoubleArrowLeftRounded,
    MyLocationRounded,
} from '@mui/icons-material';

import {
    styled,
    Search,
    Accordion,
    Typography,
    List,
    Button,
    Icon,
    IconButton,
} from '@semoss/ui';

import { useMetamodel } from '@/hooks';
import { MetamodelContext, MetamodelContextType } from '@/contexts';

export const MetamodelNav = ({ nodes }) => {
    console.log('nodes are: ', nodes);
    const { selectedNodeId, onSelectNodeId } = useMetamodel();
    console.log('nodes are: ', nodes);

    const searchRef = useRef(undefined);
    const tablesRef = useRef(undefined);

    const { control, watch, setValue } = useForm<{
        NODES: { tableName: string; tableColumns: unknown[] }[];

        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            // Metamodel tables
            NODES: [],
            // Filters for tables and columns
            SEARCH_FILTER: '',
        },
    });

    const searchFilter = watch('SEARCH_FILTER');

    const [expandTable, setExpandTable] = useState(false);

    // get the metamodel nodes

    // USE EFFECT: set active node

    // create an option for each node

    /** STYLES: METAMODEL NAV*/

    const StyledNavContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            width: '245px',
            height: '100%',
            padding: '16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            gap: '10px',
            borderRadius: shape.borderRadiusNone,
            background: theme.palette.background.paper,
            boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06);',
            // opacity: '100%',
        };
    });
    const StyledSearchContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            padding: shape.borderRadiusNone,
            alignItems: 'center',
            gap: '20px',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledSearch = styled(Search)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            width: '220px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '3px',
        };
    });
    const StyledAccordionTrigger = styled(Accordion.Trigger)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            height: '28px',
            maxHeight: '28px',
            width: '213px',
            display: 'flex',
            // padding: '8px 16px',
            flexDirection: 'column',
            alignItems: 'center',
            alignSelf: 'stretch',
            border: 'none !important',
            boxShadow: 'none !important',
        };
    });
    const StyledAccordionContent = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
        };
    });

    const ApplyNesting = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            padding: 'var(--shape-border-radius-none, 0px) 16px',
            alignItems: 'center',
            gap: 'var(--shape-border-radius-none, 0px)',
            alignSelf: 'stretch',
        };
    });
    const StyledItemContainer = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--shape-border-radius-none, 0px)',
            alignSelf: 'stretch',
            height: '24px',
            maxHeight: '24px',
            borderRadius: 'var(--shape-border-radius-none, 0px);',
            border: 0,
        };
    });
    const StyledItem = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            alignItems: 'center',
            flex: '1 0 0',
            border: 0,
        };
    });
    const StyledItemText = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            height: '24px',
            flexDirection: 'column',
            alignItems: 'center',
        };
    });
    const StyledItemTextTypography = styled(Typography)(({ theme }) => {
        return {
            fontFamily: 'Inter',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '100%',
            letterSpacing: '0.15px%',
            color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
            fontFeatureSettings: 'clig off, liga off',
        };
    });
    const StyledExpandIconContainer = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            paddingRight: '0px',
            alignItems: 'flex-start',
            gap: '10px',
            borderRadius: 'var(--shape-border-radius-none, 0px)',
        };
    });

    const handleTableClick = (table, idx) => {
        console.log('table: ', table);
        // focusTableNode(table);
    };

    /** Reset Draggable */
    console.log('tablesRef: ', tablesRef);

    return (
        <>
            <StyledNavContainer>
                <List.Item>
                    <ApplyNesting />
                    <List.ItemText>
                        <Typography variant="h6">Explorer</Typography>
                    </List.ItemText>
                    <Icon>
                        <KeyboardDoubleArrowLeftRounded />
                    </Icon>
                </List.Item>
                <StyledSearchContainer>
                    <StyledSearch
                        ref={searchRef}
                        placeholder={'Search'}
                        size={'small'}
                        value={searchFilter}
                        onChange={(e) => {
                            setValue('SEARCH_FILTER', e.target.value);
                        }}
                    />
                </StyledSearchContainer>
                <Accordion
                    ref={tablesRef}
                    defaultExpanded={true}
                    disableGutters={true}
                    sx={{
                        width: '235px',
                        border: 'none !important',
                        boxShadow: 'none !important',
                    }}
                >
                    <StyledAccordionTrigger>
                        <StyledItem>
                            <StyledExpandIconContainer>
                                <ExpandMoreRounded />
                            </StyledExpandIconContainer>
                            <StyledItemText>
                                <Typography variant="body1"> Tables</Typography>
                            </StyledItemText>
                        </StyledItem>
                    </StyledAccordionTrigger>
                    <Accordion.Content
                        sx={{
                            display: 'flex',
                            wdith: '100%',
                            flexDirection: 'column',
                            padding: '0px',
                            gap: '10px',
                            alignSelf: 'stretch',
                            alignItems: 'flex-start',
                            border: 0,
                        }}
                    >
                        {nodes.map((table, tableIdx) => {
                            return (
                                <Accordion
                                    key={tableIdx}
                                    defaultExpanded={false}
                                    disableGutters={true}
                                    sx={{
                                        width: '100%',
                                        border: 'none !important',
                                        boxShadow: 'none !important',
                                    }}
                                >
                                    <StyledAccordionTrigger>
                                        <StyledItemContainer
                                            sx={{ width: '213px' }}
                                        >
                                            <StyledItem>
                                                <ApplyNesting />
                                                <StyledExpandIconContainer>
                                                    <ExpandMoreRounded
                                                        sx={{
                                                            color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                                                        }}
                                                    />
                                                </StyledExpandIconContainer>
                                                <StyledItemText>
                                                    <StyledItemTextTypography
                                                        variant="body1"
                                                        sx={{
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        {table.data.name}
                                                    </StyledItemTextTypography>
                                                </StyledItemText>
                                            </StyledItem>
                                            <IconButton
                                                sx={{
                                                    '&:hover': {
                                                        backgroundColor:
                                                            'var(--alt-purple-alt-purple-50, #F1E9FB)',
                                                    },
                                                }}
                                            >
                                                <MyLocationRounded
                                                    sx={{
                                                        color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                                                    }}
                                                />
                                            </IconButton>
                                        </StyledItemContainer>
                                    </StyledAccordionTrigger>
                                    <Accordion.Content>
                                        <StyledAccordionContent>
                                            {table.data.properties.map(
                                                (column, colIdx) => (
                                                    <StyledItemContainer
                                                        key={`${tableIdx}_${colIdx}`}
                                                    >
                                                        <StyledItem>
                                                            <ApplyNesting />
                                                            <StyledItemText>
                                                                <StyledItemTextTypography
                                                                    variant="body1"
                                                                    sx={{
                                                                        fontSize:
                                                                            '11px',
                                                                    }}
                                                                >
                                                                    {
                                                                        column.name
                                                                    }
                                                                </StyledItemTextTypography>
                                                            </StyledItemText>
                                                        </StyledItem>
                                                    </StyledItemContainer>
                                                ),
                                            )}
                                        </StyledAccordionContent>
                                    </Accordion.Content>
                                </Accordion>
                            );
                        })}
                        {/* </StyledAccordionContent> */}
                    </Accordion.Content>
                </Accordion>
            </StyledNavContainer>
        </>
    );
};
