import React from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';

import { styled, Icon, Button } from '@semoss/ui';
import {
    TableBar,
    ViewColumn,
    EditIcon,
    DeleteIcon,
} from '@mui/icons-material';

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

const StyledTitleContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
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

    /** Bool to determine if node is interactive or not */
    isInteractive: boolean;

    /** Hook to open/close delete confirmation modal */
    setOpenDeleteConfirmationModal: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    /** Hook to open/close edit table modal */
    setOpenEditTableModal: React.Dispatch<React.SetStateAction<boolean>>;

    /** Hook to set the data describing the structure to delete confirmation modal */
    setDataToDelete: React.Dispatch<
        React.SetStateAction<{
            structureId: string;
            structureName: string;
            structureType: string;
        }>
    >;
    /** Hook to set data for edit modal */
    setTableToEdit: React.Dispatch<
        React.SetStateAction<{
            tableId: string;
            tableName: string;
            tableDescription: string;
            columns: object[];
        }>
    >;
    /** Hook to open/close edit column modal */
    setOpenEditColumnModal: React.Dispatch<React.SetStateAction<boolean>>;

    /** Hook to set data for edit column modal */
    setColumnToEdit: React.Dispatch<
        React.SetStateAction<{
            table: object;
            columnName: string;
            columnDescription: string;
            columnType: string;
            columnDefaultValue: string;
            columnNotNull: boolean;
            columnIsPrimary: boolean;
        }>
    >;
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
                {data.isInteractive ? (
                    <StyledRow>
                        <StyledTitleContainer>
                            <Button
                                variant={'text'}
                                color={'primary'}
                                onClick={() => {
                                    data.setTableToEdit({
                                        tableId: id,
                                        tableName: data.name,
                                        tableDescription: '',
                                        columns: data.properties,
                                    });
                                    data.setOpenEditTableModal(true);
                                }}
                            >
                                {/* <Icon
                                    size="md"
                                    color="primary"
                                    path={EditIcon}
                                ></Icon> */}
                                <EditIcon />
                            </Button>
                            <StyledTitle>{data.name}</StyledTitle>
                        </StyledTitleContainer>
                        <Button
                            variant={'text'}
                            color={'error'}
                            onClick={() => {
                                data.setDataToDelete({
                                    structureId: id,
                                    structureName: data.name,
                                    structureType: 'table',
                                });
                                data.setOpenDeleteConfirmationModal(true);
                            }}
                        >
                            {/* <Icon size="md" color="red" path={mdiDelete}></Icon> */}
                            <DeleteIcon />
                        </Button>
                    </StyledRow>
                ) : (
                    <StyledTitle>{data.name}</StyledTitle>
                )}
                <StyledTitle>{data.name}</StyledTitle>
            </StyledRow>
            {data.properties.map((p) => (
                <StyledRow isHeader={false} key={p.id}>
                    {data.isInteractive ? (
                        <StyledRow>
                            <StyledTitleContainer>
                                <Button
                                    variant={'text'}
                                    color={'primary'}
                                    onClick={() => {
                                        data.setColumnToEdit({
                                            table: {
                                                id: id,
                                                name: data.name,
                                            },
                                            columnName: p.name,
                                            columnDescription: 'test',
                                            columnType: p.type,
                                            columnDefaultValue: 'empty',
                                            columnNotNull: false,
                                            columnIsPrimary: false,
                                        });
                                        data.setOpenEditColumnModal(true);
                                    }}
                                >
                                    {/* <Icon
                                        path={mdiPencil}
                                        color="primary"
                                    ></Icon> */}
                                    <EditIcon />
                                </Button>
                                <StyledTitle>{p.name}</StyledTitle>
                            </StyledTitleContainer>
                            <Button
                                variant={'text'}
                                color={'error'}
                                onClick={() => {
                                    data.setDataToDelete({
                                        structureId: p.id,
                                        structureName: p.name,
                                        structureType: 'column',
                                    });
                                    data.setOpenDeleteConfirmationModal(true);
                                }}
                            >
                                {/* <Icon
                                    path={mdiDelete}
                                    size="sm"
                                    color="red"
                                ></Icon> */}
                                <DeleteIcon />
                            </Button>
                        </StyledRow>
                    ) : (
                        <>
                            <StyledIcon>
                                <ViewColumn />
                            </StyledIcon>
                            <StyledTitle>{p.name}</StyledTitle>
                        </>
                    )}
                </StyledRow>
            ))}
            <StyledHandle type="source" position={Position.Right} />
        </StyledNode>
    );
};

export const MetamodelNode = React.memo(_MetamodelNode);
