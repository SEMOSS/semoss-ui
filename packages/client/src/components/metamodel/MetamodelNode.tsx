import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';

import { styled, Icon, Button } from '@semoss/ui';
import { TableBar, ViewColumn, EditRounded, Delete } from '@mui/icons-material';

import { useMetamodel } from '@/hooks';

import { EditColumnModal, EditTableModal } from '@/components/physicalDatabase';

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
const StyledTitleContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
}));

type MetamodelNodeProps = NodeProps<{
    /** Name of the node */
    name: string; // table

    /** Array of properties associated with the node */
    properties: {
        /** Unique id of the property */
        id: string;
        /** Name of the property */
        name: string; // column
        /** Data type of the property */
        type: string; // column type
    }[];

    /** Bool to determine if node is interactive or not */
    isInteractive: boolean;

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
}>;

const _MetamodelNode = (props: MetamodelNodeProps) => {
    console.log('metamodel props: ', props);
    const { id, data } = props;

    const { selectedNodeId, onSelectNodeId, isInteractive, updateData } =
        useMetamodel();

    const [originalData, setOriginalData] = useState(data);
    const [newData, setNewData] = useState(data);

    const [finalData, setFinalData] = useState({
        newTables: [
            {
                id: '',
                prevName: '',
                newName: '',
                columns: [{ name: '', type: '' }],
            },
        ],
        newColumns: [
            {
                table: { id: '', name: '' },
                prevName: '',
                newName: '',
                type: '',
            },
        ],
    });
    const [nodeData, setNodeData] = useState({
        table: { id: '', prevName: '', newName: '' },
        columns: [
            {
                table: { id: '', name: '' },
                prevName: '',
                newName: '',
                type: '',
            },
        ],
    });
    const [relations, setRelations] = useState([{ source: '', target: '' }]);

    const [tableOptions, setTableOptions] = useState([]);
    const [openAddTableModal, setOpenAddTableModal] = useState(false);
    const [openDeleteTableModal, setOpenDeleteTableModal] = useState(false);
    const [openEditTableModal, setOpenEditTableModal] = useState(false);
    const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] =
        useState(false);
    const [dataToDelete, setDataToDelete] = useState({
        structureId: '',
        structureName: '',
        structureType: '',
    });
    const [tableToEdit, setTableToEdit] = useState({
        tableId: '',
        tableName: '',
        tableDescription: '',
        columns: [],
    });
    const [columnToEdit, setColumnToEdit] = useState({
        table: { id: '', name: '' },
        columnName: '',
        columnDescription: '',
        columnType: '',
        columnDefaultValue: '',
        columnNotNull: false,
        columnIsPrimary: false,
    });
    const [openEditColumnModal, setOpenEditColumnModal] = useState(false);
    const [databaseUpdated, setDatabaseUpdated] = useState(false);

    console.log('onSelectNodeId in mmnode: ', onSelectNodeId);
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
                {isInteractive ? (
                    <StyledRow isHeader={true}>
                        <StyledTitleContainer>
                            <Button
                                variant={'text'}
                                color={'primary'}
                                onClick={() => {
                                    setTableToEdit({
                                        tableId: id,
                                        tableName: data.name,
                                        tableDescription: '',
                                        columns: data.properties,
                                    });
                                    setOpenEditTableModal(true);
                                }}
                            >
                                {/* <Icon
                                    size="md"
                                    color="primary"
                                    path={EditIcon}
                                ></Icon> */}
                                <EditRounded />
                            </Button>
                            <StyledTitle>{data.name}</StyledTitle>
                        </StyledTitleContainer>
                        <Button
                            variant={'text'}
                            color={'error'}
                            onClick={() => {
                                setDataToDelete({
                                    structureId: id,
                                    structureName: data.name,
                                    structureType: 'table',
                                });
                                setOpenDeleteConfirmationModal(true);
                            }}
                        >
                            {/* <Icon size="md" color="red" path={mdiDelete}></Icon> */}
                            <Delete />
                        </Button>
                    </StyledRow>
                ) : (
                    <StyledTitle>{data.name}</StyledTitle>
                )}
                <StyledTitle>{data.name}</StyledTitle>
            </StyledRow>
            {data.properties.map((p) => (
                <StyledRow isHeader={true} key={p.id}>
                    {isInteractive ? (
                        <StyledRow isHeader={true}>
                            <StyledTitleContainer>
                                <Button
                                    variant={'text'}
                                    color={'primary'}
                                    onClick={() => {
                                        setColumnToEdit({
                                            table: { id: id, name: data.name },
                                            columnName: p.name,
                                            columnDescription: 'test',
                                            columnType: p.type,
                                            columnDefaultValue: 'empty',
                                            columnNotNull: false,
                                            columnIsPrimary: false,
                                        });
                                        setOpenEditColumnModal(true);
                                    }}
                                >
                                    {/* <Icon
                                        path={mdiPencil}
                                        color="primary"
                                    ></Icon> */}
                                    <EditRounded />
                                </Button>
                                <StyledTitle>{p.name}</StyledTitle>
                            </StyledTitleContainer>
                            <Button
                                variant={'text'}
                                color={'error'}
                                onClick={() => {
                                    setDataToDelete({
                                        structureId: p.id,
                                        structureName: p.name,
                                        structureType: 'column',
                                    });
                                    setOpenDeleteConfirmationModal(true);
                                }}
                            >
                                {/* <Icon
                                    path={mdiDelete}
                                    size="sm"
                                    color="red"
                                ></Icon> */}
                                <Delete />
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
            {openEditColumnModal && (
                <EditColumnModal
                    openEditColumnModal={openEditColumnModal}
                    setOpenEditColumnModal={setOpenEditColumnModal}
                    id={id}
                    column={columnToEdit}
                    updateState={updateData}
                />
            )}
        </StyledNode>
    );
    // return (
    //     <StyledNode
    //         isSelected={selectedNodeId === id}
    //         onClick={() => {
    //             onSelectNodeId(id);
    //         }}
    //     >
    //         <StyledHandle type="target" position={Position.Left} />
    //         <StyledRow isHeader={true}>
    //             <StyledIcon>
    //                 <TableBar />
    //             </StyledIcon>
    //             <StyledTitle>{data.name}</StyledTitle>
    //         </StyledRow>
    //         {data.properties.map((p) => (
    //             <StyledRow isHeader={false} key={p.id}>
    //                 <StyledIcon>
    //                     <ViewColumn />
    //                 </StyledIcon>
    //                 <StyledTitle>{p.name}</StyledTitle>
    //             </StyledRow>
    //         ))}
    //         <StyledHandle type="source" position={Position.Right} />
    //     </StyledNode>
    // );
};

export const MetamodelNode = React.memo(_MetamodelNode);
