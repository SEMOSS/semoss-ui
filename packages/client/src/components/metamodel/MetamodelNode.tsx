import React, { useState, useRef, useEffect } from 'react';
import { NodeProps, Handle, Position } from 'react-flow-renderer';
import { useForm, Controller, useFieldArray, useWatch } from 'react-hook-form';

import { getDefaultOptions } from './utility';

import { styled, Typography, TextField, Select } from '@semoss/ui';
import {
    EditRounded,
    AddCircleOutlineRounded,
    KeyRounded,
    DragIndicatorRounded,
} from '@mui/icons-material';

import { useMetamodel } from '@/hooks';

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

type MetamodelNodeProps = NodeProps<{
    /** Index of the node */
    nodeIndex: number;
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
        physicalType: string; // physical column type
        specificFormat: string; // specific format for column type
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
    const headerRef = useRef();
    const { id, data } = props;

    const { control, watch, setValue, getValues } = useForm({
        defaultValues: {
            name: data.name,
            COLUMNS: data.properties,
        },
    });
    const { fields } = useFieldArray({
        control,
        name: 'COLUMNS',
    });

    const { selectedNodeId, onSelectNodeId, isInteractive, updateData } =
        useMetamodel();

    const [openEditColumnModal, setOpenEditColumnModal] = useState(false);
    const [editTable, setEditTable] = useState(false);

    const [nodeData, setNodeData] = useState({
        // used to manage node data
        name: data.name,
        properties: data.properties,
    });

    const [metamodelCardWidth, setMetamodelCardWidth] = useState('215px'); // manage metamodel card width
    const [dataTypeOptions, setDataTypeOptions] = useState([]);

    useEffect(() => {
        const temp = getDefaultOptions();
        setDataTypeOptions(temp);
    }, []);

    /** STYLES: VIEW METAMODEL */

    /** Manage metamodel card width */
    useEffect(() => {
        if (!headerRef?.current?.clientWidth) return;
        setMetamodelCardWidth(
            `${Math.floor(1.5 * headerRef.current.clientWidth)}`,
        );
    }, [headerRef?.current]);

    const StyledMetamodelCard = styled('div', {
        shouldForwardProp: (prop) => prop !== 'isSelected',
    })<{ isSelected: boolean }>(({ theme, isSelected }) => ({
        display: 'inline-flex',
        flexDirection: 'column',
        padding: isSelected ? '4px' : '',
        alignItems: 'flex-start',
        flexShrink: isSelected ? 0 : '',
        borderRadius: '16px',
        border: editTable
            ? '0px 5px 22px 0px rgba(0, 0, 0, 0.06)'
            : isSelected
            ? '1px solid var(--light-primary-shades-30-p, rgba(4, 113, 240, 0.30))'
            : '',
    }));
    const StyledMetamodelCardHeader = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            minWidth: '215px',
            height: '44px',
            padding: '16px',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '12px 12px 0px 0px',
            background: theme.palette.purple['50'],
            flexShrink: 0,
            flexGrow: 1,
        };
    });
    const StyledMetamodelCardContent = styled('div')(() => ({
        display: 'flex',
        width: `${metamodelCardWidth}px`,
        paddingBottom: '0px',
        flexDirection: 'column',
        alignItems: 'flex-start',
        borderRadius: '0px 12px 12px 12px',
        background: '#FFF',
        flexGrow: 1,
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

    // contains table icon
    const StyledTableIconContainer = styled('div')(({ theme }) => ({
        display: 'flex',
        width: '30px',
        height: '30px',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
        borderRadius: '8px',
        border: `1px solid ${theme.palette.purple['400']}`,
        background: '#FFF',
    }));

    const StyledTableIcon = styled(TableIcon)(() => ({
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
        maxHeight: editTable ? '40px' : '',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        flex: '1 0 0',
    }));

    // contains header text and icon
    const StyledHeaderCell = styled('div')(() => ({
        display: 'flex',
        alignItems: 'flex-start',
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

    /** STYLES: EDIT METAMODEL */
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

    const StyledTableFooterRow = styled('div')(({ theme }) => ({
        display: 'flex',
        height: '44px',
        width: editTable ? '373px' : `${metamodelCardWidth}px`,
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.palette.secondary.light,
    }));

    const StyledDivider = styled('div')(() => ({
        height: '1px',
        alignSelf: 'stretch',
        border: '1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))',
    }));

    /** Edit State styles */
    const StyledEditRow = styled('div')(() => ({
        display: 'flex',
        padding: '8px 0px 2px 0px',
        alignItems: 'flex-start',
        gap: '0px 0px',
        alignSelf: 'stretch',
        borderRadius: '0px 0px',
        background: 'rgba(255, 255, 255, 0.00)',
    }));

    const StyledDragIconCell = styled('div')(() => ({
        display: 'flex',
        padding: '14px 0px 8px 16px',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: '12px',
    }));
    const StyledDragIconContainer = styled('div')(() => ({
        display: 'flex',
        padding: '2px',
        alignItems: 'center',
        borderRadius: '48px',
        color: 'rgba(0, 0, 0, 0.54)',
    }));
    const StyledDragIconInnerContainer = styled('div')(() => ({
        display: 'flex',
        alignItems: 'flex-start',
    }));
    const StyledDragIcon = styled(DragIndicatorRounded)(() => ({
        display: 'flex',
        width: '20px',
        height: '20px',
        justifyContent: 'center',
        alignItems: 'center',
    }));

    const StyledEditCell = styled('div', {
        shouldForwardProp: (prop) => prop !== 'cellPosition',
    })<{
        /** Track the cell position. Can be first, second, or third */
        cellPosition: string;
    }>(({ cellPosition }) => {
        if (cellPosition === 'first') {
            return {
                display: 'flex',
                width: '252px',
                padding: '12px 16px',
                alignItems: 'center',
                border: 'none',
            };
        }
        if (cellPosition === 'second') {
            return {
                display: 'flex',
                width: '252px',
                padding: '12px 16px',
                alignItems: 'center',
                border: 'none',
            };
        }
        if (cellPosition === 'third') {
            return {
                display: 'flex',
                padding: '10px 16px',
                justifyContent: 'flex-end',
                alignItems: 'center',
                border: 'none',
            };
        }
    });

    const StyledEditMetamodelCard = styled('div')(({ theme }) => ({
        display: 'inline-flex',
        flexDirection: 'column',
        padding: '0px',
        alignItems: 'flex-start',
        gap: '0px',
        borderRadius: '0px 12px',
        boxShadow: '0px 0px',
    }));

    const StyledEditMetamodelCardHeader = styled('div')(({ theme }) => {
        return {
            display: 'flex',
            padding: '8px 16px',
            alignItems: 'center',
            gap: '10px',
            borderRadius: '12px 12px 0px 0px',
            background: theme.palette.purple['50'],
        };
    });

    // contains header cell and aligns it with a gap
    const StyledEditHeaderCellContainer = styled('div')(() => ({
        display: 'flex',
        padding: 'var(--shape-border-radius-none, 0px)',
        alignItems: 'center',
        gap: '10px',
        borderRadius: 'var(--shape-border-radius-none, 0px)',
    }));
    const StyledEditHeaderCell = styled('div')(() => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        gap: '3px',
    }));

    const StyledEditMetamodelCardContent = styled('div')(({ theme }) => ({
        display: 'flex',
        padding: theme.shape.borderRadiusNone,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 'var(--shape-border-radius-none, 0px)',
        borderRadius: 'var(--shape-border-radius-none, 0px) 12px 12px 12px',
        background: '#FFF',
    }));

    const StyledEditTableFooterRow = styled('div')(({ theme }) => ({
        display: 'flex',
        height: '44px',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'stretch',
        background: theme.palette.secondary.light,
    }));

    const StyledEditTextField = styled(TextField)(() => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '3px',
        alignSelf: 'stretch',
    }));

    const StyledSelect = styled(Select)(() => ({
        minWidth: '126px',
        // width: '126px',
        alignmentSelf: 'stretch',
    }));

    useEffect(() => {
        console.log('new node data: ', nodeData);
    }, [nodeData]);

    /** Reset Draggable */

    if (selectedNodeId === id) {
        return (
            <form>
                <Handle type="target" position={Position.Left} />
                <StyledEditMetamodelCard
                    onClick={() => {
                        onSelectNodeId(id);
                    }}
                >
                    <StyledEditMetamodelCardHeader>
                        <StyledTableIconContainer>
                            <StyledTableIcon />
                        </StyledTableIconContainer>
                        <StyledEditHeaderCellContainer>
                            <StyledHeaderCell>
                                <StyledEditHeaderCell>
                                    <Controller
                                        name={'name'}
                                        control={control}
                                        render={({ field }) => {
                                            return (
                                                <StyledEditTextField
                                                    variant="outlined"
                                                    value={
                                                        field.value
                                                            ? field.value
                                                                  .replaceAll(
                                                                      ' ',
                                                                      '_',
                                                                  )
                                                                  .toLowerCase()
                                                            : ''
                                                    }
                                                    onChange={(event) =>
                                                        field.onChange(event)
                                                    }
                                                    onBlur={(e) => {
                                                        const tempNodeData =
                                                            nodeData;

                                                        tempNodeData.name =
                                                            e.target.value;
                                                        setNodeData({
                                                            ...tempNodeData,
                                                        });
                                                    }}
                                                />
                                            );
                                        }}
                                    />
                                </StyledEditHeaderCell>
                                {/* 
                                <StyledEditIconContainer>
                                    <StyledEditIcon
                                        onClick={() => setEditTable(!editTable)}
                                    />
                                </StyledEditIconContainer> */}
                            </StyledHeaderCell>
                        </StyledEditHeaderCellContainer>
                    </StyledEditMetamodelCardHeader>
                    <StyledEditMetamodelCardContent>
                        {fields.map((col, idx) => {
                            return (
                                <>
                                    <StyledEditRow
                                        key={col.id}
                                        // isPrimary={idx === 0 ? true : false}
                                    >
                                        <StyledDragIconCell>
                                            <StyledDragIconContainer>
                                                <StyledDragIconInnerContainer>
                                                    <StyledDragIcon />
                                                </StyledDragIconInnerContainer>
                                            </StyledDragIconContainer>
                                        </StyledDragIconCell>
                                        <StyledEditCell cellPosition="first">
                                            <Controller
                                                control={control}
                                                name={`COLUMNS.${idx}.name`}
                                                render={({ field }) => (
                                                    <StyledEditTextField
                                                        key={`${col.id}_name`}
                                                        variant="outlined"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                      .replaceAll(
                                                                          ' ',
                                                                          '_',
                                                                      )
                                                                      .toLowerCase()
                                                                : ''
                                                        }
                                                        onChange={(event) =>
                                                            field.onChange(
                                                                event,
                                                            )
                                                        }
                                                        onBlur={(e) => {
                                                            const tempNodeData =
                                                                nodeData;
                                                            console.log(
                                                                'field: ',
                                                                field,
                                                            );
                                                            console.log(
                                                                'e: ',
                                                                e,
                                                            );
                                                            tempNodeData.properties[
                                                                idx
                                                            ].name =
                                                                e.target.value;
                                                            setNodeData({
                                                                ...tempNodeData,
                                                            });
                                                        }}
                                                    />
                                                )}
                                            />
                                        </StyledEditCell>

                                        <StyledEditCell cellPosition="second">
                                            <Controller
                                                control={control}
                                                name={`COLUMNS.${idx}.type`}
                                                render={({ field }) => (
                                                    <StyledSelect
                                                        key={`${col.id}_type`}
                                                        fullWidth
                                                        className="nodrag"
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(event) => {
                                                            field.onChange(
                                                                event,
                                                            );

                                                            const tempNodeData =
                                                                nodeData;
                                                            tempNodeData.properties[
                                                                idx
                                                            ].type =
                                                                event.target.value;
                                                            setNodeData({
                                                                ...tempNodeData,
                                                            });
                                                        }}
                                                    >
                                                        {dataTypeOptions.map(
                                                            (option, idx) => (
                                                                <Select.Item
                                                                    key={`${idx}_first`}
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.display
                                                                    }
                                                                </Select.Item>
                                                            ),
                                                        )}
                                                    </StyledSelect>
                                                )}
                                            />
                                        </StyledEditCell>
                                        {idx === 0 || idx === 1 ? (
                                            <StyledEditCell cellPosition="third">
                                                <StyledKeyIconContainer>
                                                    <StyledKeyIcon
                                                        isPrimary={idx === 0}
                                                    />
                                                </StyledKeyIconContainer>
                                            </StyledEditCell>
                                        ) : null}
                                    </StyledEditRow>
                                    {idx === 0 ? <StyledDivider /> : null}
                                </>
                            );
                        })}
                        <Handle type="source" position={Position.Right} />
                        <StyledEditTableFooterRow>
                            <AddCircleOutlineRounded
                                sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                            />
                        </StyledEditTableFooterRow>
                    </StyledEditMetamodelCardContent>
                </StyledEditMetamodelCard>
            </form>
        );
    }

    return (
        <form>
            <Handle type="target" position={Position.Left} />
            <StyledMetamodelCard
                isSelected={selectedNodeId === id}
                onClick={() => {
                    onSelectNodeId(id);
                }}
            >
                <StyledMetamodelCardHeader ref={headerRef}>
                    <StyledTableIconContainer>
                        <StyledTableIcon />
                    </StyledTableIconContainer>
                    <StyledHeaderCellContainer>
                        <StyledHeaderCell>
                            <StyledHeaderText variant="body1">
                                {data.name.toLowerCase().replaceAll(' ', '_')}
                            </StyledHeaderText>

                            {/* <StyledEditIconContainer>
                                <StyledEditIcon
                                    onClick={() => setEditTable(!editTable)}
                                />
                            </StyledEditIconContainer> */}
                        </StyledHeaderCell>
                    </StyledHeaderCellContainer>
                </StyledMetamodelCardHeader>
                <StyledMetamodelCardContent>
                    {data.properties.map((p, idx) => {
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
                    })}
                    <Handle type="source" position={Position.Right} />
                    <StyledTableFooterRow>
                        <AddCircleOutlineRounded
                            sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                        />
                    </StyledTableFooterRow>
                </StyledMetamodelCardContent>
            </StyledMetamodelCard>
        </form>
    );
};

export const MetamodelNode = React.memo(_MetamodelNode);
