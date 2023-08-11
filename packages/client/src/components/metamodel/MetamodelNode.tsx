import React from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';

import { styled, Icon } from '@semoss/ui';
import { TableBar, ViewColumn } from '@mui/icons-material';

import { useMetamodel } from '@/hooks';

const StyledNode = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})<{
    /** Track if the node is isSelected */
    isSelected: boolean;
}>(({ theme, isSelected }) => ({
    borderColor: isSelected
        ? theme.palette.primary.main
        : theme.palette.divider,
    borderStyle: 'solid',
    borderWidth: '1px',
}));

const StyledHandle = styled(Handle)(() => ({
    display: 'none',
}));

const StyledRow = styled('div', {
    shouldForwardProp: (prop) => prop !== 'isHeader',
})<{
    /** Track if the node is isHeader */
    isHeader: boolean;
}>(({ isHeader }) => ({
    display: 'flex',
    alignItems: 'center',
    height: '32ps',
    width: '100%',
    paddingLeft: '4px',
    paddingRight: '4px',
    gap: '4px',
    fontWeight: isHeader ? 'bold' : 'normal',
}));

const StyledIcon = styled(Icon)(() => ({
    flexShrink: '0',
    fontSize: '.750rem',
}));

const StyledTitle = styled('div')(() => ({
    fontSize: '.875rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

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
            isSelected={selectedNodeId === id}
            onClick={() => {
                onSelectNodeId(id);
            }}
        >
            <StyledHandle type="target" position={Position.Left} />
            <StyledRow isHeader={true}>
                <StyledIcon>
                    <TableBar />
                </StyledIcon>
                <StyledTitle>{data.name}</StyledTitle>
            </StyledRow>
            {data.properties.map((p) => (
                <StyledRow isHeader={false} key={p.id}>
                    <StyledIcon>
                        <ViewColumn />
                    </StyledIcon>
                    <StyledTitle>{p.name}</StyledTitle>
                </StyledRow>
            ))}
            <StyledHandle type="source" position={Position.Right} />
        </StyledNode>
    );
};

export const MetamodelNode = React.memo(_MetamodelNode);
