import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'react-flow-renderer';
import { useForm } from 'react-hook-form';
import { MetamodelNode } from './MetamodelNode';
import { ExpandMoreRounded } from '@mui/icons-material';

import {
    styled,
    Search,
    Accordion,
    Typography,
    List,
    Button,
} from '@semoss/ui';

// import { useMetamodel } from '@/hooks';
// import { MetamodelContext } from '@/contexts';

export const MetamodelNav = ({ nodes }) => {
    console.log('nodes are: ', nodes);
    // const { selectedNodeId, onSelectNodeId } = useMetamodel();
    console.log('nodes are: ', nodes);

    const searchRef = useRef(undefined);

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
            height: '697px',
            padding: '16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
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
            alignItems: 'flex-start',
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
            display: 'flex',
            padding: '8px 16px',
            flexDirection: 'column',
            alignItems: 'center',
            alignSelf: 'stretch',
        };
    });
    const StyledSubAccordion = styled(Accordion)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            padding: '4px 0px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
            boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06);',
        };
    });
    const StyledAccordionLabel = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            padding: '4px 0px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
        };
    });
    const StyledDropdownIconContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            alignItems: 'flex-start',
        };
    });

    const StyledNestingContainer = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(211, 47, 47, 0.10);',
        };
    });
    const StyledTableNesting = styled('div')(({ theme }) => {
        return {
            width: '32px',
            height: '16px',
            background: 'rgba(255, 255, 255, 0.00);',
        };
    });
    const StyledNesting = styled('div')(({ theme }) => {
        return {
            width: '48px',
            height: '16px',
            background: 'rgba(255, 255, 255, 0.00);',
        };
    });
    const StyledContentContainer = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
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
    const StyledTableItem = styled(Button)(({ theme }) => {
        return {
            display: 'flex',
            textAlign: 'left',
        };
    });

    const handleTableClick = (table, idx) => {
        console.log('table: ', table);
    };

    /** Reset Draggable */

    return (
        <>
            {/* <MetamodelContext.Provider value={MetamodelContext}> */}
            <StyledNavContainer>
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
                <Accordion>
                    <StyledAccordionTrigger>
                        <StyledAccordionLabel>
                            <Typography variant="body1"> Tables</Typography>
                        </StyledAccordionLabel>
                        <StyledDropdownIconContainer>
                            <ExpandMoreRounded />
                        </StyledDropdownIconContainer>
                    </StyledAccordionTrigger>
                    <Accordion.Content>
                        <StyledAccordionContent>
                            {nodes.map((table, tableIdx) => {
                                return (
                                    <StyledTableItem
                                        key={tableIdx}
                                        variant="text"
                                        color="inherit"
                                    >
                                        <Typography variant="body2">
                                            {table.data.name}
                                        </Typography>
                                    </StyledTableItem>
                                );
                            })}
                        </StyledAccordionContent>
                    </Accordion.Content>
                </Accordion>
            </StyledNavContainer>
            {/* </MetamodelContext.Provider> */}
        </>
    );
};

{
    /* // export const MetamodelNav = React.memo(_MetamodelNav); */
}

{
    /* 
// <StyledSubAccordion key={tableIdx}>
    //     <StyledAccordionTrigger>
    //         <StyledNestingContainer>
    //             <StyledTableNesting />
    //         </StyledNestingContainer>
    //         <StyledAccordionLabel>
    //             <Typography variant="caption">
    //                 {table.data.name}
    //             </Typography>
    //         </StyledAccordionLabel>
    //     </StyledAccordionTrigger>
    //     <Accordion.Content>
    //         <StyledAccordionContent>
    //             {table.data.properties.map(
    //                 (column, colIdx) => (
    //                     <StyledContentContainer
    //                         key={`${tableIdx}_${colIdx}`}
    //                     >
    //                         <StyledNestingContainer>
    //                             <StyledNesting />
    //                         </StyledNestingContainer>
    //                         <StyledAccordionLabel>
    //                             <Typography variant="caption">
    //                                 {column.name}
    //                             </Typography>
    //                         </StyledAccordionLabel>
    //                     </StyledContentContainer>
    //                 ),
    //             )}
    //         </StyledAccordionContent>
    //     </Accordion.Content>
    // </StyledSubAccordion> */
}
