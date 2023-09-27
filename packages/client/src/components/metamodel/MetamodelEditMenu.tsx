import React, { useState, useRef, useEffect } from 'react';
import { Node } from 'react-flow-renderer';
import { MetamodelNode } from './MetamodelNode';
import { Close, ExpandMore, KeyRounded } from '@mui/icons-material';

import {
    styled,
    Accordion,
    Typography,
    IconButton,
    TextField,
} from '@semoss/ui';

import { useMetamodel } from '@/hooks';
import { MetamodelContext, MetamodelContextType } from '@/contexts';

// type MetamodelNode = Node<React.ComponentProps<typeof MetamodelNode>['data']>;

/**
 * TODO:
 * FUNCTIONAL
 * store user edits to table
 * update the node data using metamodelContext
 * handle primary key
 * handle foreign key
 * display relationships
 * enable relationship editing
 *
 * STYLING
 */

export const MetamodelEditMenu = ({ node }) => {
    // const nodeData = watch('NODE');
    const [nodeData, setNodeData] = useState({
        data: {
            name: '',
            properties: [
                {
                    id: '',
                    name: '',
                    physicalType: '',
                    specificFormat: '',
                    type: '',
                },
            ],
        },
    });

    useEffect(() => {
        setNodeData(node);
    }, [node]);

    // get the metamodel nodes

    // USE EFFECT: set active node

    // create an option for each node

    /** STYLES: METAMODEL NAV*/

    const StyledContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            width: '345px',
            height: '100%',
            padding: '16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--spacing-spacing-05, 16px)',
            borderRadius: `${shape.borderRadiusLg}, 12px`,
            background: theme.palette.background.paper,
            boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06);',
        };
    });
    const StyledHeaderContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            padding: '0px 16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: shape.borderRadiusNone,
            alignSelf: 'flex-start',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledMenuItem = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            padding: '0px 16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: shape.borderRadiusNone,
            alignSelf: 'flex-start',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledHeader = styled('div')(() => {
        return {
            display: 'flex',
            padding: '0px 16px',
            alignItems: 'center',
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderText = styled('div')(() => {
        return {
            display: 'flex',
            padding: '4px 0px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
        };
    });
    const StyledHeaderTitle = styled(Typography)(() => {
        return {
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderInstruction = styled(Typography)(() => {
        return {
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderIconContainer = styled('div')(() => {
        return {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderIconButton = styled(IconButton)(() => {
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
        };
    });
    const StyledAccordion = styled(Accordion)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            borderRadius: shape.borderRadiusLg,
            background:
                'var(--light-secondary-shades-30-p, rgba(217, 217, 217, 0.30))',
        };
    });
    const StyledAccordionTrigger = styled(Accordion.Trigger)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            // flexDirection: 'column',
            height: '48px',
            maxHeight: '48px',
            width: '100%',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            borderRadius: shape.borderRadiusLg,
            // background:
            //     'var(--light-secondary-shades-30-p, rgba(217, 217, 217, 0.30))',
        };
    });
    const StyledAccordionTriggerText = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            width: '300px',
            minWidth: '300px',
            paddingLeft: '0px',
            alignItems: 'center',
            gap: shape.borderRadiusNone,
            alignSelf: 'stretch',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledAccordionTriggerLabel = styled('div')(() => {
        return {
            display: 'flex',
            padding: '12px 0px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
        };
    });
    const StyledAccordionTriggerTypography = styled(Typography)(() => {
        return {
            alignSelf: 'stretch',
        };
    });
    const StyledEndIconContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            marginRight: '6px',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: shape.borderRadiusNone,
            flex: '1 0 0',
            borderRadius: shape.borderRadiusNone,
        };
    });

    const StyledMetamodelCardItem = styled('div', {
        shouldForwardProp: (prop) => prop !== 'isPrimary',
    })<{
        /** Track if the column is a primary key */
        isPrimary: boolean;
    }>(({ isPrimary }) => ({
        display: 'flex',
        padding: isPrimary ? '8px 0px' : '',
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        background: 'rgba(255, 255, 255, 0.00)',
    }));

    const StyledMetamodelCardItemCell = styled('div', {
        shouldForwardProp: (prop) => prop !== 'cellPosition',
    })<{
        /** Track the cell position. Can be first, second, or third */
        cellPosition: string;
    }>(({ cellPosition }) => {
        if (cellPosition === 'first') {
            return {
                display: 'flex',
                width: '124.667px',
                overflow: 'hidden',
                padding: '12px 16px',
                alignItems: 'center',
                border: 'none',
            };
        }
        if (cellPosition === 'second') {
            return {
                display: 'flex',
                width: '100.667px',
                padding: '12px 16px',
                alignItems: 'center',
                border: 'none',
                marginLeft: '6px',
            };
        }
        if (cellPosition === 'third') {
            return {
                display: 'flex',
                padding: '10px 16px',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flex: '1 0 0',
                border: 'none',
            };
        }
    });
    const StyledMetamodelCardItemCellText = styled(Typography)(() => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        textOverflow: 'ellipsis',
        color: 'var(--light-text-primary, rgba(0, 0, 0, 0.87))',
    }));
    const StyledColumnTypeText = styled(Typography, {
        shouldForwardProp: (prop) => prop !== 'columnDataType',
    })<{
        // Track column data type. int: red, string: blue, date: purple, boolean: green
        columnDataType: string;
    }>(({ columnDataType }) => {
        columnDataType = columnDataType.toLowerCase();
        const colorKey = {
            integer: 'var(--alt-pink-alt-pink-400, #FF4E90)',
            int: 'var(--alt-pink-alt-pink-400, #FF4E90)',
            double: 'var(--alt-pink-alt-pink-400, #FF4E90)',
            string: 'var(--alt-green-alt-green-400, #00B4A4)',
            char: 'var(--alt-green-alt-green-400, #00B4A4)',
            varchar: 'var(--alt-green-alt-green-400, #00B4A4)',
            boolean: 'var(--light-primary-light, #22A4FF)',
            date: 'var(--alt-purple-alt-purple-400, #975FE4)',
            timestamp: 'var(--alt-purple-alt-purple-400, #975FE4)',
            float: 'var(--alt-dark-blue-alt-dark-blue-700, #3A188E)',
        };

        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            color: columnDataType ? colorKey[columnDataType] : '',
        };
    });

    const StyledKeyIconContainer = styled('div')(() => ({
        display: 'flex',
        alignItems: 'flex-start',
    }));

    const StyledKeyIcon = styled(KeyRounded, {
        shouldForwardProp: (prop) => prop !== 'isPrimary',
    })<{
        /** Track if a column is a primary key or foreign key */
        isPrimary: boolean;
    }>(({ isPrimary }) => ({
        width: '24px',
        height: '24px',
        justifyContent: 'center',
        alignItems: 'center',
        color: isPrimary ? 'rgba(4, 113, 240, 1)' : 'rgba(181, 181, 181, 1)',
    }));

    const StyledDivider = styled('div')(() => ({
        height: '1px',
        alignSelf: 'stretch',
        border: '1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))',
    }));

    /**
     * EDIT LOGIC
     *
     * update the data using context
     */

    /** Reset Draggable */
    return (
        <StyledContainer>
            <StyledHeaderContainer>
                <StyledHeader>
                    <StyledHeaderText>
                        <StyledHeaderTitle variant="body1">
                            Properties
                        </StyledHeaderTitle>
                        <StyledHeaderInstruction variant="body2">
                            Update table and column properties
                        </StyledHeaderInstruction>
                    </StyledHeaderText>
                    <StyledHeaderIconContainer>
                        <StyledHeaderIconButton>
                            <Close />
                        </StyledHeaderIconButton>
                    </StyledHeaderIconContainer>
                </StyledHeader>
            </StyledHeaderContainer>
            <StyledAccordion>
                <StyledAccordionTrigger>
                    <StyledAccordionTriggerText>
                        <StyledAccordionTriggerLabel>
                            <StyledAccordionTriggerTypography variant="subtitle2">
                                Table
                            </StyledAccordionTriggerTypography>
                        </StyledAccordionTriggerLabel>
                        <StyledEndIconContainer>
                            <StyledHeaderIconButton>
                                <ExpandMore />
                            </StyledHeaderIconButton>
                        </StyledEndIconContainer>
                    </StyledAccordionTriggerText>
                </StyledAccordionTrigger>
            </StyledAccordion>
            <StyledMenuItem>
                <TextField variant={'outlined'} value={'Schema'}></TextField>
            </StyledMenuItem>
            <StyledMenuItem>
                <TextField
                    variant={'outlined'}
                    label="Name"
                    value={nodeData && nodeData.data ? nodeData.data.name : ''}
                ></TextField>
            </StyledMenuItem>
            <StyledMenuItem>
                <TextField
                    variant={'outlined'}
                    label="Description"
                    value={'description'}
                ></TextField>
            </StyledMenuItem>
            <StyledAccordion>
                <StyledAccordionTrigger>
                    <StyledAccordionTriggerText>
                        <StyledAccordionTriggerLabel>
                            <StyledAccordionTriggerTypography variant="subtitle2">
                                Columns
                            </StyledAccordionTriggerTypography>
                        </StyledAccordionTriggerLabel>
                        <StyledEndIconContainer>
                            <StyledHeaderIconButton>
                                <ExpandMore />
                            </StyledHeaderIconButton>
                        </StyledEndIconContainer>
                    </StyledAccordionTriggerText>
                </StyledAccordionTrigger>
            </StyledAccordion>
            <StyledMenuItem>
                {nodeData && nodeData.data ? (
                    nodeData.data.properties.map((p, idx) => {
                        return (
                            <>
                                <StyledMetamodelCardItem
                                    key={p.id}
                                    isPrimary={idx === 0 ? true : false}
                                >
                                    <StyledMetamodelCardItemCell cellPosition="first">
                                        <StyledMetamodelCardItemCellText variant="body2">
                                            {p.name
                                                .toLowerCase()
                                                .replaceAll(' ', '_')}
                                        </StyledMetamodelCardItemCellText>
                                    </StyledMetamodelCardItemCell>

                                    <StyledMetamodelCardItemCell cellPosition="second">
                                        <StyledColumnTypeText
                                            variant="body2"
                                            columnDataType={
                                                p.type ? p.type : ''
                                            }
                                        >
                                            {p.type ? p.type.toLowerCase() : ''}
                                        </StyledColumnTypeText>
                                    </StyledMetamodelCardItemCell>

                                    {idx === 0 || idx === 1 ? (
                                        <StyledMetamodelCardItemCell cellPosition="third">
                                            <StyledKeyIconContainer>
                                                <StyledKeyIcon
                                                    isPrimary={idx === 0}
                                                />
                                            </StyledKeyIconContainer>
                                        </StyledMetamodelCardItemCell>
                                    ) : null}
                                </StyledMetamodelCardItem>
                                {idx === 0 ? <StyledDivider /> : null}
                            </>
                        );
                    })
                ) : (
                    <div>Select a table</div>
                )}
            </StyledMenuItem>
            <StyledAccordion>
                <StyledAccordionTrigger>
                    <StyledAccordionTriggerText>
                        <StyledAccordionTriggerLabel>
                            <StyledAccordionTriggerTypography variant="subtitle2">
                                Relationships
                            </StyledAccordionTriggerTypography>
                        </StyledAccordionTriggerLabel>
                        <StyledEndIconContainer>
                            <StyledHeaderIconButton>
                                <ExpandMore />
                            </StyledHeaderIconButton>
                        </StyledEndIconContainer>
                    </StyledAccordionTriggerText>
                </StyledAccordionTrigger>
            </StyledAccordion>
        </StyledContainer>
    );
};
