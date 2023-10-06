import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useForm } from 'react-hook-form';
import { MetamodelNode } from './MetamodelNode';
import {
    ChevronRight,
    ExpandMore,
    ExpandMoreRounded,
    Keyboard,
    KeyboardDoubleArrowLeftRounded,
    KeyboardDoubleArrowRightRounded,
    MyLocationRounded,
    LanRounded,
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
    Tooltip,
    TreeView,
    Box,
    Menu,
} from '@semoss/ui';

import { Drawer } from '@mui/material';

import { useMetamodel } from '@/hooks';
import { MetamodelContext, MetamodelContextType } from '@/contexts';
import { table } from 'console';

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
    const [expandedNodes, setExpandedNodes] = useState([]); // track expended nodes
    const [navOpen, setNavOpen] = useState(false);
    // const [navWidth, setNavWidth] = useState('25%');

    const toggleSideNav = (open: boolean) => {
        // if (open) {
        //     setNavWidth('35%');
        // } else {
        //     setNavWidth('5%');
        // }
        setNavOpen(open);
    };

    // const toggleSideNav =
    //     (inOpen: boolean) =>
    //     (event: React.KeyboardEvent | React.MouseEvent) => {
    //         if (
    //             event.type === 'keydown' &&
    //             ((event as React.KeyboardEvent).key === 'Tab' ||
    //                 (event as React.KeyboardEvent).key === 'Shift')
    //         ) {
    //             return;
    //         }
    //         setNavOpen(inOpen);
    //     };
    // handle expand
    const handleExpand = (
        event: React.SyntheticEvent,
        newExpanded: boolean,
        key: string,
    ) => {
        event.preventDefault();
        console.log('event: ', event);
        console.log('newExpand: ', newExpanded);
        console.log('tableName: ', key);
        const temp = expandedNodes;

        if (newExpanded) {
            // add
            temp.push(key);
        } else {
            // remove
            temp.splice(temp.indexOf(key), 1);
        }
        console.log('temp to expand: ', temp);
        setExpandedNodes(temp);
    };

    // get the metamodel nodes

    // USE EFFECT: set active node

    // create an option for each node

    /** STYLES: METAMODEL NAV*/

    const StyledNavWrapper = styled('div')(() => ({
        display: 'flex',
        width: '300px',
        padding: 'var(--shape-border-radius-none, 0px)',
        alignItems: 'flex-start',
        gap: 'var(--shape-border-radius-none, 0px)',
    }));
    const StyledVerticalDivider = styled('div')(() => ({
        display: 'flex',
        width: '300px',
        padding: 'var(--shape-border-radius-none, 0px)',
        alignItems: 'flex-start',
        gap: 'var(--shape-border-radius-none, 0px)',
        borderRadius: 'var(--shape-border-radius-none, 0px)',
    }));
    const StyledLeftBar = styled('div')(() => ({
        width: '55px',
        height: '100%',
        background: 'var(--light-background-paper, #FFF)',
    }));
    const StyledLeftBarIconContainer = styled('div')(() => ({
        display: 'flex',
        width: '55px',
        height: '667px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--spacing-spacing-06, 24px)',
        borderRadius: 'var(--shape-border-radius-none, 0px)',
    }));
    const StyledLeftBarSubContainer = styled('div')(() => ({
        display: 'flex',
        padding: '16px 16px',
        alignItems: 'center',
        alignSelf: 'stretch',
        gap: 'var(--shape-border-radius-none, 0px)',
        borderRadius: 'var(--shape-border-radius-none, 0px)',
    }));
    const LanIconSubContainer = styled('div')(() => ({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 'var(--shape-border-radius-none, 0px)',
        gap: 'var(--shape-border-radius-none, 0px)',
        flex: '1 0 0',
        borderRadius: 'var(--shape-border-radius-none, 0px)',
    }));
    const StyledLanRounded = styled(LanRounded)(() => ({
        display: 'flex',
        height: '24px',
        width: '24px',
        // padding: '2px 3px',
        // paddingLeft: '2px',
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        opacity: 0.54,
        cursor: 'pointer',
    }));
    // {
    // const shape = theme.shape as unknown as {
    //     borderRadiusNone: string;
    // };
    // return {
    //     display: 'flex',
    //     width: '255px',
    //     height: '100%',
    //     padding: '16px',
    //     flexDirection: 'column',
    //     alignItems: 'flex-start',
    //     alignSelf: 'stretch',
    //     gap: '10px',
    //     borderRadius: shape.borderRadiusNone,
    //     background: theme.palette.background.paper,
    //     boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06);',
    // };
    // }
    // );
    const StyledNavContainer = styled(List)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            width: '245px',
            height: '100%',
            paddingLeft: '16px',
            flexDirection: 'column',
            justifyContent: 'left',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            gap: '10px',
            borderRadius: shape.borderRadiusNone,
            background: theme.palette.background.paper,
            boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06);',
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
            // width: navWidth,
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '3px',
            opacity: 0.54,
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
            flexDirection: 'column',
            alignItems: 'center',
            alignSelf: 'stretch',
            border: 'none !important',
            boxShadow: 'none !important',
        };
    });
    const StyledAccordionContent = styled('div')(() => {
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '10px',
        };
    });

    const ApplyNesting = styled('div')(() => {
        return {
            display: 'flex',
            padding: 'var(--shape-border-radius-none, 0px) 12px',
            alignItems: 'center',
            gap: 'var(--shape-border-radius-none, 0px)',
            alignSelf: 'stretch',
        };
    });
    const TableApplyNesting = styled('div')(() => {
        return {
            display: 'flex',
            padding: 'var(--shape-border-radius-none, 0px) 12px',
            alignItems: 'center',
            gap: 'var(--shape-border-radius-none, 0px)',
            alignSelf: 'stretch',
        };
    });
    const StyledItemContainer = styled('div')(() => {
        return {
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--shape-border-radius-none, 0px)',
            alignSelf: 'stretch',
            height: '24px',
            maxHeight: '24px',
            borderRadius: 'var(--shape-border-radius-none, 0px);',
            border: 0,
            '&:hover': {
                backgroundColor: 'var(--alt-purple-alt-purple-50, #F1E9FB)',
                cursor: 'pointer',
            },
            '&.active': {
                backgroundColor: 'var(--alt-purple-alt-purple-50, #F1E9FB)',
            },
        };
    });
    const StyledItem = styled('div')(() => {
        return {
            display: 'flex',
            alignItems: 'center',
            flex: '1 0 0',
            border: 0,
        };
    });
    const StyledItemText = styled('div')(() => {
        return {
            display: 'flex',
            height: '24px',
            maxWidth: '96px',
            alignItems: 'center',
        };
    });
    const StyledItemTextTypography = styled(Typography)(() => {
        return {
            maxWidth: '96px',
            fontFamily: 'Inter',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: '100%',
            letterSpacing: '0.15px',
            color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
            fontFeatureSettings: 'clig off, liga off',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        };
    });
    const StyledExpandIconContainer = styled('div')(() => {
        return {
            display: 'flex',
            paddingRight: '0px',
            alignItems: 'flex-start',
            gap: '10px',
            borderRadius: 'var(--shape-border-radius-none, 0px)',
        };
    });

    const handleTableClick = (table) => {
        onSelectNodeId(table.id);
    };

    const handleColumnClick = (column) => {
        // set active column
        // set table
        // set column
        console.log('column: ', column);
    };

    /** Reset Draggable */
    console.log('tablesRef: ', tablesRef);
    useEffect(() => {
        console.log('nodeexpanded: ', expandedNodes);
    }, [expandedNodes]);

    const CustomTargetIcon = (table, tableIdx) => (
        <IconButton
            sx={{
                '&:hover': {
                    backgroundColor: 'var(--alt-purple-alt-purple-50, #F1E9FB)',
                },
            }}
        >
            <MyLocationRounded
                sx={{
                    color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                }}
                onClick={() => handleTableClick(table)}
            />
        </IconButton>
    );

    // const StyledItemLabel = (table) => (
    //     <Tooltip title={table.data.name} placement="top-end">
    //         <StyledItemText>
    //             <StyledItemTextTypography variant="body1">
    //                 {table.data.name}
    //             </StyledItemTextTypography>
    //         </StyledItemText>
    //     </Tooltip>
    // );
    console.log('nodes for table items are: ', nodes);

    const TableItems = nodes.map((table, tableIdx) => {
        return (
            <TreeView.Item
                key={table.data.name}
                nodeId={`${1 + tableIdx}`}
                sx={{ width: '213px' }}
                label={
                    <div
                        style={{
                            display: 'flex',
                            width: '178px',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Tooltip title={table.data.name} placement="top-end">
                            <StyledItemText
                                sx={{
                                    '&:selected': {
                                        backgroundColor:
                                            'var(--alt-purple-alt-purple-50, #F1E9FB)',
                                    },
                                    width: '130px',
                                }}
                            >
                                <StyledItemTextTypography variant="body1">
                                    {table.data.name}
                                </StyledItemTextTypography>
                            </StyledItemText>
                        </Tooltip>
                        <IconButton
                            sx={{
                                '&:hover': {
                                    backgroundColor:
                                        'var(--alt-purple-alt-purple-50, #F1E9FB)',
                                },
                                width: '48px',
                            }}
                        >
                            <MyLocationRounded
                                sx={{
                                    // color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                                    opacity: 0.6,
                                    width: '28px',
                                }}
                                onClick={() => handleTableClick(table)}
                            />
                        </IconButton>
                    </div>
                }
                // endIcon={
                //     <IconButton
                //         sx={{
                //             '&:hover': {
                //                 backgroundColor:
                //                     'var(--alt-purple-alt-purple-50, #F1E9FB)',
                //             },
                //             width: '48px',
                //         }}
                //     >
                //         <MyLocationRounded
                //             sx={{
                //                 // color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                //                 opacity: 0.6,
                //                 width: '28px',
                //             }}
                //             onClick={() => handleTableClick(table)}
                //         />
                //     </IconButton>
                // }
            >
                {' '}
                {table.data.properties.map((col, colIdx) => (
                    <TreeView.Item
                        key={`${tableIdx}${colIdx}`}
                        nodeId={`${tableIdx}${colIdx}`}
                        label={col.name}
                    />
                ))}
            </TreeView.Item>
        );
    });

    return (
        <StyledNavWrapper className="nodrag">
            <StyledLeftBar>
                <StyledLeftBarIconContainer
                    onClick={() => toggleSideNav(!navOpen)}
                >
                    <StyledLeftBarSubContainer>
                        <LanIconSubContainer>
                            <StyledLanRounded />
                        </LanIconSubContainer>
                    </StyledLeftBarSubContainer>
                </StyledLeftBarIconContainer>
            </StyledLeftBar>
            {/* <StyledVerticalDivider /> */}
            {navOpen && (
                <StyledNavContainer>
                    <List.Item
                        sx={{
                            width: '213px',
                            height: '32px',
                            paddingTop: '0px',
                            paddingLeft: '0px',
                            paddingBottom: '0px',
                        }}
                    >
                        {/* <ApplyNesting /> */}
                        <List.ItemText sx={{ width: '189px' }}>
                            <Typography variant="body1">Explorer</Typography>
                        </List.ItemText>
                        <IconButton onClick={() => toggleSideNav(!navOpen)}>
                            <KeyboardDoubleArrowLeftRounded
                                sx={{ opacity: 0.54 }}
                            />
                        </IconButton>
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
                    <TreeView
                        aria-label="controlled"
                        defaultCollapseIcon={<ExpandMore />}
                        defaultExpandIcon={<ChevronRight />}
                        multiSelect
                    >
                        <TreeView.Item nodeId="0" label="Tables">
                            {TableItems}
                            {/* <TreeView.Item nodeId="2" label="test" />
                        <TreeView.Item nodeId="3" label="testtwo" />
                        <TreeView.Item nodeId="4" label="testthree" /> */}

                            {/* {nodes.map((table, tableIdx) => {
                            return ( */}
                            {/* <TreeView.Item
                                    key={`table_${tableIdx}_${table.data.name}`}
                                    nodeId={`${tableIdx}`}
                                    label={table.data.name}
                                > */}
                            {/* {table.data.properties.map(
                                        (column, colIdx) => (
                                            <TreeView.Item
                                                key={`column_${colIdx}_${column.name}`}
                                                nodeId={`${tableIdx}_${colIdx}`}
                                                label={column.name}
                                            />
                                        ),
                                    )} */}
                            {/* </TreeView.Item> */}
                            {/* //     );
                        // })} */}
                        </TreeView.Item>
                        <TreeView.Item nodeId="2" label="References">
                            {' '}
                        </TreeView.Item>
                    </TreeView>
                </StyledNavContainer>
            )}
        </StyledNavWrapper>
    );
};

/**
 *                 <List.Item>
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
                    className="nodrag"
                    ref={tablesRef}
                    defaultExpanded={true}
                    disableGutters={true}
                    sx={{
                        width: '235px',
                        border: 'none !important',
                        boxShadow: 'none !important',
                        padding: '0px',
                    }}
                >
                    <StyledAccordionTrigger className="nodrag">
                        <TreeView>Tables</TreeView>
                         <StyledItem>
                            <StyledExpandIconContainer>
                                <ExpandMoreRounded />
                            </StyledExpandIconContainer>
                            <StyledItemText>
                                <Typography variant="body1">Tables</Typography>
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
                                        className="nodrag"
                                        key={tableIdx}
                                        defaultExpanded={false}
                                        disableGutters={true}
                                        sx={{
                                            width: '100%',
                                            border: 'none !important',
                                            boxShadow: 'none !important',
                                        }}
                                        onChange={(event, newExpanded) =>
                                            handleExpand(
                                                event,
                                                newExpanded,
                                                table.data.name,
                                            )
                                        }
                                    >
                                        <StyledAccordionTrigger className="nodrag">
                                            <StyledItemContainer
                                                className="nodrag"
                                                sx={{ width: '213px' }}
                                            >
                                                <StyledItem className="nodrag">
                                                    <TableApplyNesting />
                                                    {expandedNodes.indexOf(
                                                        table.data.name,
                                                    ) >= 0 ? (
                                                        <StyledExpandIconContainer>
                                                            <ExpandMoreRounded
                                                                sx={{
                                                                    color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                                                                }}
                                                            />
                                                        </StyledExpandIconContainer>
                                                    ) : (
                                                        <StyledExpandIconContainer>
                                                            <ChevronRight
                                                                sx={{
                                                                    color: 'var(--light-text-secondary, rgba(0, 0, 0, 0.60))',
                                                                }}
                                                            />
                                                        </StyledExpandIconContainer>
                                                    )}
                                                    <Tooltip
                                                        title={table.data.name}
                                                        placement="top-end"
                                                    >
                                                        <StyledItemText>
                                                            <StyledItemTextTypography variant="body1">
                                                                {table.data.name}
                                                            </StyledItemTextTypography>
                                                        </StyledItemText>
                                                    </Tooltip>
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
                                                        onClick={() =>
                                                            handleTableClick(
                                                                table,
                                                                tableIdx,
                                                            )
                                                        }
                                                    />
                                                </IconButton>
                                            </StyledItemContainer>
                                        </StyledAccordionTrigger>
                                        <Accordion.Content>
  
                                            {table.data.properties.map(
                                                (column, colIdx) => (
                                                    <StyledItemContainer
                                                        key={`${tableIdx}_${colIdx}`}
                                                        onClick={() =>
                                                            handleColumnClick(
                                                                column,
                                                                colIdx,
                                                            )
                                                        }
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
                                                                    {column.name}
                                                                </StyledItemTextTypography>
                                                            </StyledItemText>
                                                        </StyledItem>
                                                    </StyledItemContainer>
                                                ),
                                            )}
                                        </Accordion.Content>
                                    </Accordion>
                                );
                            })}
                        </Accordion.Content>
                    </Accordion>
 */
