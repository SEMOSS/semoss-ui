import React from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';
import { styled, Icon } from '@semoss/components';
import { mdiTableLarge, mdiPencil } from '@mdi/js';

import { theme } from '@/theme';
import { useMetamodel } from '@/hooks';

const StyledNode = styled('div', {
    backgroundColor: theme.colors.base,
    borderColor: theme.colors['grey-4'],
    borderWidth: theme.borderWidths.default,
    borderRadius: theme.radii.default,
    color: theme.colors['grey-1'],
    minWidth: theme.space['32'],
    maxWidth: theme.space['64'],
    variants: {
        selected: {
            true: {
                borderWidth: '2px',
                borderColor: theme.colors['primary-1'],
            },
        },
    },
});

const StyledHandle = styled(Handle, {
    display: 'none',
});

const StyledRow = styled('div', {
    display: 'flex',
    alignItems: 'center',
    height: theme.space['8'],
    width: '100%',
    paddingLeft: theme.space['2'],
    paddingRight: theme.space['2'],
    gap: theme.space['2'],
    variants: {
        header: {
            true: {
                backgroundColor: theme.colors['grey-5'],
                fontWeight: theme.fontWeights.semibold,
            },
        },
    },
});

const StyledIcon = styled(Icon, {
    flexShrink: '0',
    fontSize: theme.fontSizes.sm,
    color: theme.colors['grey-2'],
});

const StyledTitle = styled('div', {
    fontSize: theme.fontSizes.sm,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

type MetamodelNodeProps = NodeProps<{
    /** Name of the node */
    name: string;

    /** Array of properties associated with the node */
    properties: {
        /** Unique id of the property */
        id: string;
        /** Name of the property */
        name: string;
        /** Data type of the property */
        type: string;
    }[];
}>;

const _MetamodelNode = (props: MetamodelNodeProps) => {
    const { id, data } = props;

    const { selectedNodeId, onSelectNodeId } = useMetamodel();

    return (
        <StyledNode
            selected={selectedNodeId === id}
            onClick={() => {
                onSelectNodeId(id);
            }}
        >
            <StyledHandle type="target" position={Position.Left} />
            <StyledRow header={true}>
                <StyledIcon path={mdiTableLarge}></StyledIcon>
                <StyledTitle>{data.name}</StyledTitle>
            </StyledRow>
            {data.properties.map((p) => (
                <StyledRow key={p.id}>
                    <StyledIcon path={mdiPencil}></StyledIcon>
                    <StyledTitle>{p.name}</StyledTitle>
                </StyledRow>
            ))}
            <StyledHandle type="source" position={Position.Right} />
        </StyledNode>
    );
};

export const MetamodelNode = React.memo(_MetamodelNode);
