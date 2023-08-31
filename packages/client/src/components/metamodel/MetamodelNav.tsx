import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';

import { getDefaultOptions } from './utility';

import {
    styled,
    Typography,
    TextField,
    Select,
    Search,
    Accordion,
} from '@semoss/ui';
import {
    EditRounded,
    AddCircleOutlineRounded,
    KeyRounded,
    DragIndicatorRounded,
} from '@mui/icons-material';

import { useMetamodel } from '@/hooks';

export const MetamodelNav = (props: any) => {
    const searchRef = useRef(null);
    const { id, data } = props;

    const { control, watch, setValue } = useForm<{
        NODES: Node[];

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

    const { selectedNodeId, onSelectNodeId, isInteractive, updateData } =
        useMetamodel();

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

    useEffect(() => {
        console.log('new node data: ', nodeData);
    }, [nodeData]);

    /** Reset Draggable */

    return (
        <>
            <Handle type="target" position={Position.Left} />
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
                    <Accordion.Trigger>
                        <div>Tables</div>
                    </Accordion.Trigger>
                    <Accordion.Content>
                        <div>table1</div>
                        <div>table2</div>
                        <div>table3</div>
                    </Accordion.Content>
                </Accordion>
            </StyledNavContainer>
        </>
    );
};

// export const MetamodelNav = React.memo(_MetamodelNav);
