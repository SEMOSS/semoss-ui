import React, { useState } from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';

import {
    styled,
    Icon,
    Button,
    Typography,
    Card,
    List,
    Table,
} from '@semoss/ui';
import {
    TableChartOutlined,
    TableViewRounded,
    ViewColumn,
    EditRounded,
    Delete,
    AddCircleOutlineRounded,
    KeyRounded,
} from '@mui/icons-material';

import { useMetamodel } from '@/hooks';

import { EditColumnModal, EditTableModal } from '@/components/physicalDatabase';

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

const TableIconBlue = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="16"
        viewBox="0 0 18 16"
        fill="none"
    >
        <path
            d="M2 0H16C16.5304 0 17.0391 0.210714 17.4142 0.585786C17.7893 0.960859 18 1.46957 18 2V14C18 14.5304 17.7893 15.0391 17.4142 15.4142C17.0391 15.7893 16.5304 16 16 16H2C1.46957 16 0.960859 15.7893 0.585786 15.4142C0.210714 15.0391 0 14.5304 0 14V2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0ZM2 4V8H8V4H2ZM10 4V8H16V4H10ZM2 10V14H8V10H2ZM10 10V14H16V10H10Z"
            fill="#0471F0"
        />
    </svg>
);

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
    const { id, data } = props;

    const { selectedNodeId, onSelectNodeId, isInteractive, updateData } =
        useMetamodel();
    const [openEditColumnModal, setOpenEditColumnModal] = useState(false);
    const [editTable, setEditTable] = useState(false);

    /** STYLES */
    const StyledMetamodelCard = styled('div', {
        shouldForwardProp: (prop) => prop !== 'isSelected',
    })<{ isSelected: boolean }>(({ isSelected }) => ({
        display: 'inline-flex',
        flexDirection: 'column',
        // height: isSelected ? '355px' : '',
        padding: isSelected ? '4px' : '',
        alignItems: 'flex-start',
        flexShrink: isSelected ? 0 : '',
        borderRadius: '16px',
        boxShadow: '0 8px 16px 0 #BDC9D7',
        // borderRadius: 'var(--border-radius-radius-large, 12px)',
        // boxShadow: isSelected
        //     ? '0px 5px 22px 0px #D6EAFF'
        //     : '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
        border: editTable
            ? '0px 5px 22px 0px rgba(0, 0, 0, 0.06)'
            : isSelected
            ? '1px solid var(--light-primary-shades-30-p, rgba(4, 113, 240, 0.30))'
            : '',
    }));
    const StyledMetamodelCardHeader = styled('div')(() => {
        return {
            display: 'flex',
            // maxWidth: '215px',
            width: editTable ? '373px' : '325px',
            height: '44px !important',
            padding: '16px',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '12px 12px 0px 0px',
            background: 'var(--semoss-blue-blue-50, #E2F2FF)',
        };
    });
    const StyledMetamodelCardContent = styled('div')(() => ({
        display: 'flex',
        width: editTable ? '373px' : '325px',
        paddingBottom: '0px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '0px 12px 12px 12px',
        background: '#FFF',
    }));
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
                height: '44px',
                width: '114.667px',
                padding: '12px 16px',
                alignItems: 'center',
            };
        }
        if (cellPosition === 'second') {
            return {
                display: 'flex',
                width: '114.667px',
                padding: '12px 16px',
                alignItems: 'center',
            };
        }
        if (cellPosition === 'third') {
            return {
                display: 'flex',
                padding: '10px 16px',
                justifyContent: 'flex-end',
                alignItems: 'center',
                flex: '1 0 0',
            };
        }
    });
    const StyledMetamodelCardItemCellText = styled(Typography)(() => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
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
            float: 'var(--alt-dark-blue-alt-dark-blue-700, #3A188E)',
        };

        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            color: columnDataType ? colorKey[columnDataType] : '',
        };
    });

    // contains table icon
    const StyledTableIconContainer = styled('div')(() => ({
        display: 'flex',
        width: '30px',
        height: '30px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        borderRadius: '8px',
        // border: '1px solid var(--alt-purple-alt-purple-400, #975FE4)',
        border: '1px solid var(--light-primary-main, #0471F0)',
        background: '#FFF',
    }));

    const StyledTableIcon = styled(TableIconBlue)(() => ({
        display: 'flex',
        padding: '4px',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        flex: '1 0 0',
        alignSelf: 'stretch',
        borderRadius: '48px',
    }));

    // contains header cell and aligns it with a gap
    const StyledHeaderCellContainer = styled('div')(() => ({
        display: 'flex',
        width: '143px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        flex: '1 0 0',
    }));

    // contains header text and icon
    const StyledHeaderCell = styled('div')(() => ({
        display: 'flex',
        width: '143px',
        alignItems: 'flex-start',
        // alignItems: 'center',
        alignSelf: 'stretch',
    }));

    const StyledHeaderText = styled(Typography)(() => ({
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        flex: '1 0 0',
        alignSelf: 'stretch',
        color: 'var(--light-text-primary, rgba(0, 0, 0, 0.87))',
    }));

    // contains edit icon
    const StyledEditIconContainer = styled('div')(() => ({
        display: 'flex',
        width: '24px',
        height: '24px',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
    }));
    const StyledEditIcon = styled(EditRounded)(() => ({
        display: 'flex',
        padding: '4px',
        alignItems: 'center',
        borderRadius: '48px',
        cursor: 'pointer',
    }));

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

    const StyledTableFooterRow = styled('div')(() => ({
        display: 'flex',
        height: '44px',
        width: '325px',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--light-background-default, #FAFAFA)',
    }));

    const StyledHandle = styled(Handle)(() => ({
        // opacity: 0,
    }));

    // return (
    //     <StyledMetamodelCard
    //         isSelected={selectedNodeId === id}
    //         onClick={() => {
    //             onSelectNodeId(id);
    //         }}
    //     >
    //         <StyledHandle type="target" position={Position.Left} />
    //         <StyledMetamodelHeaderFrame>
    //             <StyledTableRow>
    //                 {/* <StyledMetamodelIconButton>
    //                     <TableIcon />
    //                 </StyledMetamodelIconButton> */}
    //                 <StyledMetamodelIconButton
    //                     variant={'text'}
    //                     color={'primary'}
    //                     disabled={!isInteractive}
    //                     onClick={() => {
    //                         // setTableToEdit({
    //                         //     tableId: id,
    //                         //     tableName: data.name,
    //                         //     tableDescription: '',
    //                         //     columns: data.properties,
    //                         // });
    //                         // setOpenEditTableModal(true);
    //                     }}
    //                 >
    //                     <TableIcon />
    //                 </StyledMetamodelIconButton>
    //                 {isInteractive ? (
    //                     <StyledTableRow>
    //                         <StyledTitleContainer>
    //                             {/* <Button
    //                                 variant={'text'}
    //                                 color={'primary'}
    //                                 onClick={() => {
    //                                     setTableToEdit({
    //                                         tableId: id,
    //                                         tableName: data.name,
    //                                         tableDescription: '',
    //                                         columns: data.properties,
    //                                     });
    //                                     setOpenEditTableModal(true);
    //                                 }}
    //                             >
    //                                 <EditRounded />
    //                             </Button> */}
    //                             <StyledHeaderFont variant="body1">
    //                                 {data.name.toLowerCase()}
    //                             </StyledHeaderFont>
    //                         </StyledTitleContainer>
    //                         <StyledButtonSecondary
    //                             variant={'text'}
    //                             color={'error'}
    //                             onClick={() => {
    //                                 setDataToDelete({
    //                                     structureId: id,
    //                                     structureName: data.name,
    //                                     structureType: 'table',
    //                                 });
    //                                 setOpenDeleteConfirmationModal(true);
    //                             }}
    //                         >
    //                             {/* <Icon size="md" color="red" path={mdiDelete}></Icon> */}
    //                             <Delete />
    //                         </StyledButtonSecondary>
    //                     </StyledTableRow>
    //                 ) : (
    //                     <StyledHeaderFont variant="body1">
    //                         {data.name.toLowerCase()}
    //                     </StyledHeaderFont>
    //                 )}
    //             </StyledTableRow>
    //         </StyledMetamodelHeaderFrame>
    //         <StyledDivider />
    //         {data.properties.map((p) => (
    //             <StyledTableRow key={p.id}>
    //                 {isInteractive ? (
    //                     <StyledTableRow>
    //                         {/* <StyledTitleContainer> */}
    //                         {/* <Button
    //                                 variant={'text'}
    //                                 color={'primary'}
    //                                 onClick={() => {
    //                                     setColumnToEdit({
    //                                         table: {
    //                                             id: id,
    //                                             name: data.name,
    //                                         },
    //                                         columnName: p.name,
    //                                         columnDescription: 'test',
    //                                         columnType: p.type,
    //                                         columnDefaultValue: 'empty',
    //                                         columnNotNull: false,
    //                                         columnIsPrimary: false,
    //                                     });
    //                                     setOpenEditColumnModal(true);
    //                                 }}
    //                             > */}
    //                         {/* <Icon
    //                                     path={mdiPencil}
    //                                     color="primary"
    //                                 ></Icon> */}
    //                         {/* <EditRounded /> */}
    //                         {/* </Button> */}
    //                         <StyledHeaderFont variant="body2">
    //                             {p.name.toLowerCase()}
    //                         </StyledHeaderFont>
    //                         {/* </StyledTitleContainer> */}
    //                         <StyledValueFont variant="body2">
    //                             {p.type.toLowerCase()}
    //                         </StyledValueFont>
    //                         <StyledButtonSecondary
    //                             variant={'text'}
    //                             color={'error'}
    //                             onClick={() => {
    //                                 setDataToDelete({
    //                                     structureId: p.id,
    //                                     structureName: p.name,
    //                                     structureType: 'column',
    //                                 });
    //                                 setOpenDeleteConfirmationModal(true);
    //                             }}
    //                         >
    //                             <Delete />
    //                         </StyledButtonSecondary>
    //                     </StyledTableRow>
    //                 ) : (
    //                     <>
    //                         {/* <StyledIcon>
    //                             <ViewColumn />
    //                         </StyledIcon> */}
    //                         <StyledHeaderFont variant="body2">
    //                             {p.name.toLowerCase()}
    //                         </StyledHeaderFont>
    //                         <StyledValueFont variant="body2">
    //                             {p.type.toLowerCase()}
    //                         </StyledValueFont>
    //                     </>
    //                 )}
    //             </StyledTableRow>
    //         ))}
    //         <StyledHandle type="source" position={Position.Right} />
    //         {openEditColumnModal && (
    //             <EditColumnModal
    //                 openEditColumnModal={openEditColumnModal}
    //                 setOpenEditColumnModal={setOpenEditColumnModal}
    //                 id={id}
    //                 column={columnToEdit}
    //                 updateState={updateData}
    //             />
    //         )}
    //     </StyledMetamodelCard>
    // );
    return (
        <>
            <StyledHandle type="target" position={Position.Left} />
            <StyledMetamodelCard
                isSelected={selectedNodeId === id}
                onClick={() => {
                    onSelectNodeId(id);
                }}
            >
                <StyledMetamodelCardHeader>
                    <StyledTableIconContainer>
                        <StyledTableIcon />
                    </StyledTableIconContainer>
                    <StyledHeaderCellContainer>
                        <StyledHeaderCell>
                            {/* <StyledHeaderTextContainer> */}
                            <StyledHeaderText variant="body1">
                                {data.name.toLowerCase().replaceAll(' ', '_')}
                            </StyledHeaderText>
                            {/* </StyledHeaderTextContainer> */}
                            <StyledEditIconContainer>
                                <StyledEditIcon
                                    onClick={() => setEditTable(!editTable)}
                                />
                            </StyledEditIconContainer>
                        </StyledHeaderCell>
                    </StyledHeaderCellContainer>
                </StyledMetamodelCardHeader>
                <StyledMetamodelCardContent>
                    {data.properties.map((p, idx) => (
                        <StyledMetamodelCardItem
                            key={p.id}
                            isPrimary={idx === 0 ? true : false}
                        >
                            <StyledMetamodelCardItemCell cellPosition="first">
                                <StyledMetamodelCardItemCellText variant="body2">
                                    {p.name.toLowerCase().replaceAll(' ', '_')}
                                </StyledMetamodelCardItemCellText>
                            </StyledMetamodelCardItemCell>
                            <StyledMetamodelCardItemCell cellPosition="second">
                                <StyledColumnTypeText
                                    variant="body2"
                                    columnDataType={p.type ? p.type : ''}
                                >
                                    {p.type ? p.type.toLowerCase() : ''}
                                </StyledColumnTypeText>
                            </StyledMetamodelCardItemCell>
                            {idx === 0 || idx === 1 ? (
                                <StyledMetamodelCardItemCell cellPosition="third">
                                    <StyledKeyIconContainer>
                                        <StyledKeyIcon isPrimary={idx === 0} />
                                    </StyledKeyIconContainer>
                                </StyledMetamodelCardItemCell>
                            ) : null}
                        </StyledMetamodelCardItem>
                    ))}
                    <StyledHandle type="source" position={Position.Right} />
                    <StyledTableFooterRow>
                        <AddCircleOutlineRounded
                            sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                        />
                    </StyledTableFooterRow>
                </StyledMetamodelCardContent>
            </StyledMetamodelCard>
            {editTable && (
                <EditTableModal
                    id={id}
                    openEditTableModal={editTable}
                    setOpenEditTableModal={setEditTable}
                    tableData={data}
                />
            )}
        </>
    );
};

export const MetamodelNode = React.memo(_MetamodelNode);
