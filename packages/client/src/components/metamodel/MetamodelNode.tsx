import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';

import { styled, Icon, Button, Typography } from '@semoss/ui';
import {
    TableChartOutlined,
    TableViewRounded,
    ViewColumn,
    EditRounded,
    Delete,
} from '@mui/icons-material';

import { useMetamodel } from '@/hooks';

import { EditColumnModal } from '@/components/physicalDatabase';

// one-off custom icon from figma
const TableIcon = () => {
    return (
        <svg
            width="30"
            height="30"
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="0.5"
                y="0.5"
                width="29"
                height="29"
                rx="7.5"
                fill="white"
            />
            <path
                d="M8 7H22C22.5304 7 23.0391 7.21071 23.4142 7.58579C23.7893 7.96086 24 8.46957 24 9V21C24 21.5304 23.7893 22.0391 23.4142 22.4142C23.0391 22.7893 22.5304 23 22 23H8C7.46957 23 6.96086 22.7893 6.58579 22.4142C6.21071 22.0391 6 21.5304 6 21V9C6 8.46957 6.21071 7.96086 6.58579 7.58579C6.96086 7.21071 7.46957 7 8 7ZM8 11V15H14V11H8ZM16 11V15H22V11H16ZM8 17V21H14V17H8ZM16 17V21H22V17H16Z"
                fill="#975FE4"
            />
            <rect
                x="0.5"
                y="0.5"
                width="29"
                height="29"
                rx="7.5"
                stroke="#975FE4"
            />
        </svg>
    );
};

const StyledMetamodelCard = styled('div')(({ theme }) => ({
    alignItems: 'flex-start',
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0px 5px 22px #0000000f',
    display: 'inline-flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
    width: '354px',
}));
const StyledMetamodelHeaderFrame = styled('div')(({ theme }) => ({
    alignItems: 'center',
    alignSelf: 'stetch',
    backgroundColor: 'rgba(241, 233, 251, 1)',
    borderRadius: '12px 12px 0px 0px',
    boxShadow: '0px 5px 22px #0000000f',
    display: 'flex',
    gap: '10px',
    height: '54px',
    padding: '10px',
    position: 'relative',
    width: '100%',
}));
const StyledMetamodelIconButton = styled(Button)(({ theme }) => ({
    alignItems: 'center',
    borderColor: 'rgba(151, 95, 228, 1) !important',
    borderRadius: theme.shape.borderRadius,
    justifyContent: 'center !important',
    marginBottom: '-9px !important',
    marginTop: '-9px !important',
}));

const StyledInstanceNode = styled('div')(({ theme }) => ({
    alignItems: 'center !important',
    flex: '0 0 auto !important',
    justifyContent: 'center !important',
    marginBottom: '-1px !important',
    marginLeft: '-1px !important',
    marginRight: '-1px !important',
    marginTop: '-1px !important',
}));
const StyledButtonSecondary = styled(Button)(({ theme }) => ({
    alignSelf: 'stretch !important',
    display: 'flex !important',
    flex: '1 !important',
    flexGrow: '1 !important',
    justifyContent: 'center !important',
    width: '100%',
}));
const StyledFrameWrapper = styled('div')(({ theme }) => ({
    alignItems: 'flex-start',
    display: 'flex',
    flex: '1',
    flexDirection: 'column',
    flexGrow: '1',
    gap: '4px',
    marginBottom: '-10px',
    marginTop: '-10px',
    position: 'relative',
}));
const StyledMetamodelCardDiv = styled('div')(({ theme }) => ({
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    display: 'flex',
    flex: '0 0 auto',
    position: 'relative',
    width: '100%',
}));

const StyledHeaderFont = styled(Typography)(() => ({
    alignItems: 'center',
    alignSelf: 'stretch',
    color: '#000000de',
    flex: 1,
    fontFamily: 'Inter Hevetica',
    fontSize: '16px',
    fontWeight: 500,
    letterSpacing: '.15px',
    lineHeight: '24px',
    marginTop: '-1px',
    marginLeft: '6px',
    position: 'relative',
}));
const StyledValueFont = styled(Typography)(() => ({
    alignSelf: 'stretch',
    color: 'rgba(34, 164, 255, 1)',
    flex: 1,
    fontFamily: 'Inter-Medium, Helvetica',
    fontSize: '16px',
    fontWeight: 500,
    letterSpacing: '.15px',
    lineHeight: '24px',
    marginTop: '-1px',
    position: 'relative',
}));

const StyledColumnNameCell = styled('div')(() => ({
    flex: '0 0 auto !important',
}));

const StyledTableHeader = styled('div')(() => ({
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: '0px 12px 12px 12px',
    display: 'inline-flex',
    flex: '0 0 auto',
    flexDirection: 'column',
    padding: '0px 0px 16px',
    position: 'relative',
}));

const StyledTableRow = styled('div')(() => ({
    display: 'flex',
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    padding: '8px 0px',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff01',
    // flex: '0 0 auto',
    gap: '4',
    position: 'relative',
    width: '100%',
}));

const StyledTableCell = styled('div')(() => ({
    height: '44px !important',
    width: '114.67px !important',
}));

const StyledDivider = styled('div')(() => ({
    height: '2px',
    alignSelf: 'stretch !important',
    borderColor: '#000000',
    position: 'relative',
    width: '100%',
}));
const StyledIconWrapper = styled('div')(() => ({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
    opacity: 0,
    padding: '10px 16px',
    position: 'relative',
    width: '114.67px',
}));

const StyledIconKeyWrapper = styled('div')(() => ({
    alignItems: 'flex-start',
    display: 'inline-flex',
    flex: '0 0 auto',
    position: 'relative',
}));
const StyledRoundedKeyWrapper = styled('div')(() => ({
    height: '24px',
    position: 'relative',
    width: '24px',
}));

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

/**
 * node container
 * sub container
 *
 * table header row
 *  table header icon cell
 *  table header name cell
 *      header name font styling
 *  table header edit icon cell
 *      edit table icon button
 *  table header delete icon cell
 *      delete table icon button
 *
 * divider
 *
 * table body container
 *  table row container
 *    table row
 *      table cell container: column name
 *      table cell container: column type
 *      table cell container: column icon forKey/primKey
 *      table cell container: edit column icon button
 *
 * relationship styling
 *
 */

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

    return (
        <StyledMetamodelCard
            isSelected={selectedNodeId === id}
            onClick={() => {
                onSelectNodeId(id);
            }}
        >
            <StyledHandle type="target" position={Position.Left} />
            <StyledMetamodelHeaderFrame>
                <StyledTableRow>
                    {/* <StyledMetamodelIconButton>
                        <TableIcon />
                    </StyledMetamodelIconButton> */}
                    <StyledMetamodelIconButton
                        variant={'text'}
                        color={'primary'}
                        disabled={!isInteractive}
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
                        <TableIcon />
                    </StyledMetamodelIconButton>
                    {isInteractive ? (
                        <StyledTableRow>
                            <StyledTitleContainer>
                                {/* <Button
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
                                    <EditRounded />
                                </Button> */}
                                <StyledHeaderFont variant="body1">
                                    {data.name.toLowerCase()}
                                </StyledHeaderFont>
                            </StyledTitleContainer>
                            <StyledButtonSecondary
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
                            </StyledButtonSecondary>
                        </StyledTableRow>
                    ) : (
                        <StyledHeaderFont variant="body1">
                            {data.name.toLowerCase()}
                        </StyledHeaderFont>
                    )}
                </StyledTableRow>
            </StyledMetamodelHeaderFrame>
            <StyledDivider />
            {data.properties.map((p) => (
                <StyledTableRow key={p.id}>
                    {isInteractive ? (
                        <StyledTableRow>
                            {/* <StyledTitleContainer> */}
                            {/* <Button
                                    variant={'text'}
                                    color={'primary'}
                                    onClick={() => {
                                        setColumnToEdit({
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
                                        setOpenEditColumnModal(true);
                                    }}
                                > */}
                            {/* <Icon
                                        path={mdiPencil}
                                        color="primary"
                                    ></Icon> */}
                            {/* <EditRounded /> */}
                            {/* </Button> */}
                            <StyledHeaderFont variant="body2">
                                {p.name.toLowerCase()}
                            </StyledHeaderFont>
                            {/* </StyledTitleContainer> */}
                            <StyledValueFont variant="body2">
                                {p.type.toLowerCase()}
                            </StyledValueFont>
                            <StyledButtonSecondary
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
                                <Delete />
                            </StyledButtonSecondary>
                        </StyledTableRow>
                    ) : (
                        <>
                            {/* <StyledIcon>
                                <ViewColumn />
                            </StyledIcon> */}
                            <StyledHeaderFont variant="body2">
                                {p.name.toLowerCase()}
                            </StyledHeaderFont>
                            <StyledValueFont variant="body2">
                                {p.type.toLowerCase()}
                            </StyledValueFont>
                        </>
                    )}
                </StyledTableRow>
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
        </StyledMetamodelCard>
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
