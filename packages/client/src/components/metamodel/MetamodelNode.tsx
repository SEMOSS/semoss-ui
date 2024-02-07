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
} from '@/component-library';
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

import { EditColumnModal } from '@/components/physical-database';

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

const StyledMetamodelCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'isSelected',
})<{ isSelected: boolean }>(({ isSelected }) => ({
    display: 'inline-flex',
    paddingBottom: 'var(--spacing-spacing-05, 0px)',
    flexDirection: 'column',
    alignItems: 'flex-start',
    borderRadius: 'var(--border-radius-radius-large, 12px)',
    backgroundColor: 'var(--light-background-paper, #FFF)',
    boxShadow: isSelected
        ? '0px 5px 22px 0px #D6EAFF'
        : '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    border: isSelected
        ? '1px solid var(--light-primary-shades-30-p, rgba(4, 113, 240, 0.30))'
        : '',
}));
const StyledMetamodelContent = styled(Card.Content)(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flexStart',
    // backgroundColor: 'rgba(250, 250, 250, 1)',
}));

const StyledKeyCell = styled('div')(() => ({
    display: 'flex',
    padding: '6px 16px',
    alignItems: 'center',
    gap: '6px',
    flex: '1 0 0',
    alignSelf: 'stretch',
}));

const StyledKeyIconContainer = styled('div')(() => ({
    display: 'flex',
    alignItems: 'flex-start',
}));

const StyledPrimaryKeyIcon = styled(KeyRounded)(() => ({
    width: '24px',
    height: '24px',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'rgba(4, 113, 240, 1)',
}));
const StyledForeignKeyIcon = styled(KeyRounded)(() => ({
    width: '24px',
    height: '24px',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'rgba(181, 181, 181, 1)',
}));

const StyledTableCellRow = styled('div')(() => ({
    display: 'flex',
    width: '344px',
    alignItems: 'flex-start',
    background: 'rgba(255, 255, 255, 0)',
}));
const StyledColumnNameCell = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '12px 16px',
    flex: '1 0 0',
}));
const StyledColumnTypeCell = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '12px 16px',
    justifyContent: 'flex-end',
    alignItems: 'center',
    flex: '1 0 0',
    color: 'rgba(34, 164, 255, 1)',
}));
const StyledTypeFont = styled(Typography)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    color: 'rgba(34, 164, 255, 1)',
}));
const StyledNameFont = styled(Typography)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
}));
const StyledTableHeaderRow = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '16px',
    alignItems: 'center',
    gap: '10px',
    alignSelf: 'stretch',
    color: 'rgba(0, 0, 0, 0.87)',
}));
const StyledIconContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '30px',
    height: '30px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '8px',
    border: '1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))',
}));
const StyledDivider = styled('div')(() => ({
    height: '1px',
    alignSelf: 'stretch',
    border: '1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))',
}));
const StyledTableFooterRow = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '44px',
    width: '344px',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'var(--light-background-default, #FAFAFA)',
    marginBottom: '-11px',
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
const StyledTitleCell = styled(Typography)(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 0 0',
    alignSelf: 'stretch',
}));
// const StyledTitle = styled('div')(() => ({
//     fontSize: '.875rem',
//     whiteSpace: 'nowrap',
//     overflow: 'hidden',
//     textOverflow: 'ellipsis',
// }));
// const StyledTitleContainer = styled('div')(() => ({
//     display: 'flex',
//     alignItems: 'center',
//     overflow: 'hidden',
// }));

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
    isInteractive?: boolean;

    /** Hook to set data for edit column modal */
    setColumnToEdit?: React.Dispatch<
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
    setOpenDeleteConfirmationModal?: React.Dispatch<
        React.SetStateAction<boolean>
    >;
    /** Hook to open/close edit table modal */
    setOpenEditTableModal?: React.Dispatch<React.SetStateAction<boolean>>;

    /** Hook to set the data describing the structure to delete confirmation modal */
    setDataToDelete?: React.Dispatch<
        React.SetStateAction<{
            structureId: string;
            structureName: string;
            structureType: string;
        }>
    >;
    /** Hook to set data for edit modal */
    setTableToEdit?: React.Dispatch<
        React.SetStateAction<{
            tableId: string;
            tableName: string;
            tableDescription: string;
            columns: object[];
        }>
    >;
    /** Hook to open/close edit column modal */
    setOpenEditColumnModal?: React.Dispatch<React.SetStateAction<boolean>>;
}>;

const _MetamodelNode = (props: MetamodelNodeProps) => {
    const { id, data } = props;

    const { selectedNodeId, onSelectNodeId, isInteractive, updateData } =
        useMetamodel();
    const [openEditColumnModal, setOpenEditColumnModal] = useState(false);

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
        <StyledMetamodelCard
            isSelected={selectedNodeId === id}
            onClick={() => {
                onSelectNodeId(id);
            }}
        >
            <StyledHandle type="target" position={Position.Left} />
            <StyledTableHeaderRow>
                <StyledIconContainer>
                    <TableIcon />
                </StyledIconContainer>
                <StyledTitleCell variant="body1">
                    {data.name.toLowerCase().replaceAll(' ', '_')}
                </StyledTitleCell>
            </StyledTableHeaderRow>
            <StyledDivider />
            <StyledMetamodelContent>
                {data.properties.map((p, idx) => {
                    return (
                        <StyledTableCellRow key={p.id}>
                            {/* {idx === 0 ? ( // demo purposes... will update when we have primary key and foreign key properties
                                <StyledKeyCell>
                                    <StyledKeyIconContainer>
                                        <StyledPrimaryKeyIcon />
                                    </StyledKeyIconContainer>
                                    <StyledColumnNameCell variant="body2">
                                        {p.name
                                            .toLowerCase()
                                            .replaceAll(' ', '_')}
                                    </StyledColumnNameCell>
                                </StyledKeyCell>
                            ) : idx === 1 ? (
                                <StyledKeyCell>
                                    <StyledKeyIconContainer>
                                        <StyledForeignKeyIcon />
                                    </StyledKeyIconContainer>
                                    <StyledColumnNameCell variant="body2">
                                        {p.name
                                            .toLowerCase()
                                            .replaceAll(' ', '_')}
                                    </StyledColumnNameCell>
                                </StyledKeyCell>
                            ) : (
                                <StyledColumnNameCell variant="body2">
                                    {p.name.toLowerCase().replaceAll(' ', '_')}
                                </StyledColumnNameCell>
                            )} */}
                            <StyledColumnNameCell>
                                <StyledNameFont variant="body2">
                                    {p.name.toLowerCase().replaceAll(' ', '_')}
                                </StyledNameFont>
                            </StyledColumnNameCell>
                            <StyledColumnTypeCell>
                                <StyledTypeFont variant="body2">
                                    {p.type ? p.type.toLowerCase() : ''}
                                </StyledTypeFont>
                            </StyledColumnTypeCell>
                        </StyledTableCellRow>
                    );
                })}
                <StyledHandle type="source" position={Position.Right} />
                <StyledTableFooterRow>
                    <AddCircleOutlineRounded
                        sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                    />
                </StyledTableFooterRow>
            </StyledMetamodelContent>
        </StyledMetamodelCard>
    );
};

export const MetamodelNode = React.memo(_MetamodelNode);
