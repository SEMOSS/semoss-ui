import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Node } from 'react-flow-renderer';
import { MetamodelNode } from './MetamodelNode';
import { Close, ExpandMore, KeyRounded } from '@mui/icons-material';
import {
    useForm,
    Controller,
    useFieldArray,
    useWatch,
    useFormState,
} from 'react-hook-form';
import { getDefaultOptions } from './utility';

import {
    styled,
    Accordion,
    Typography,
    IconButton,
    TextField,
    Table,
    Paper,
    Button,
    Switch,
    FormControlLabel,
    Select,
    TableCellProps,
} from '@semoss/ui';

import { useMetamodel } from '@/hooks';
import { MetamodelContext, MetamodelContextType } from '@/contexts';
import { TableContainer } from '@mui/material';

type CustomTableCellProps = TableCellProps & {
    isDirty?: boolean;
};

// type MetamodelNode = Node<React.ComponentProps<typeof MetamodelNode>['data']>;

/**
 * TODO:
 * FUNCTIONAL
 * store user edits to table
 * update the node data using metamodelContext
 * handle primary key
 * handle foreign key
 * display relationships
 * enable relationship editing
 *
 * STYLING
 */

export const MetamodelEditMenu = ({ nodeData }) => {
    const [originalValues, setOriginalValues] = useState({
        name: '',
        COLUMNS: [],
    });
    const [dataTypeOptions, setDataTypeOptions] = useState([]);
    const [changedCells, setChangedCells] = useState({}); // track changed cells, specifically table name

    const { selectedNodeId, onSelectNodeId, isInteractive, updateData } =
        useMetamodel();

    const [data, setData] = useState({
        data: {
            name: '',
            properties: [
                {
                    id: '',
                    name: '',
                    physicalType: '',
                    specificFormat: '',
                    type: '',
                    isPrimary: '',
                    allowNull: '',
                    isForeign: '',
                },
            ],
        },
    });

    const [canEdit, setCanEdit] = useState(false);

    const {
        control,
        setValue,
        formState: { isDirty, dirtyFields },
        handleSubmit,
    } = useForm({
        defaultValues: {
            name: nodeData?.data.name,
            COLUMNS: nodeData?.data.properties,
        },
    });
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'COLUMNS',
    });

    useEffect(() => {
        setData(nodeData);
        if (nodeData?.data) {
            setValue('COLUMNS', nodeData.data.properties);
        }
        if (nodeData?.data && !originalValues.COLUMNS.length) {
            const temp = {
                name: nodeData.data.name,
                COLUMNS: nodeData.data.properties,
            };
            setOriginalValues(temp);
        }
    }, [nodeData]);

    useEffect(() => {
        const temp = getDefaultOptions();
        setDataTypeOptions(temp);
    }, []);

    /** handle save click */
    const onSubmit = (data) => {
        console.log('data on save: ', data);
    };

    const handleTextFieldChange = (rowIndex, cellName, value) => {
        /** Handle tracking changed cells */
        const key = `${rowIndex}-${cellName}`;
        if (
            originalValues.COLUMNS.length &&
            value !== originalValues.COLUMNS[rowIndex][cellName]
        ) {
            setChangedCells((prev) => ({ ...prev, [key]: true }));
        } else {
            const updated = { ...changedCells };
            delete updated[key];
            setChangedCells(updated);
        }
    };

    /** STYLES: METAMODEL NAV*/
    const StyledContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            width: '345px',
            height: '100%',
            padding: '16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--spacing-spacing-05, 16px)',
            borderRadius: `${shape.borderRadiusLg}, 12px`,
            background: theme.palette.background.paper,
            boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06);',
        };
    });
    const StyledHeaderContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            padding: '0px 16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: shape.borderRadiusNone,
            alignSelf: 'flex-start',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledMenuItem = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            padding: '0px 16px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: shape.borderRadiusNone,
            alignSelf: 'flex-start',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledHeader = styled('div')(() => {
        return {
            display: 'flex',
            padding: '16px 16px',
            alignItems: 'center',
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderText = styled('div')(() => {
        return {
            display: 'flex',
            padding: '4px 0px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
        };
    });
    const StyledHeaderTitle = styled(Typography)(() => {
        return {
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderInstruction = styled(Typography)(() => {
        return {
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderIconContainer = styled('div')(() => {
        return {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            alignSelf: 'stretch',
        };
    });
    const StyledHeaderIconButton = styled(IconButton)(() => {
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
        };
    });
    const StyledAccordion = styled(Accordion)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            borderRadius: shape.borderRadiusLg,
            background:
                'var(--light-secondary-shades-30-p, rgba(217, 217, 217, 0.30))',
        };
    });
    const StyledAccordionTrigger = styled(Accordion.Trigger)(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusLg: string;
        };
        return {
            display: 'flex',
            // flexDirection: 'column',
            height: '48px',
            maxHeight: '48px',
            width: '100%',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            borderRadius: shape.borderRadiusLg,
            // background:
            //     'var(--light-secondary-shades-30-p, rgba(217, 217, 217, 0.30))',
        };
    });
    const StyledAccordionTriggerText = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            width: '300px',
            minWidth: '300px',
            paddingLeft: '0px',
            alignItems: 'center',
            gap: shape.borderRadiusNone,
            alignSelf: 'stretch',
            borderRadius: shape.borderRadiusNone,
        };
    });
    const StyledAccordionTriggerLabel = styled('div')(() => {
        return {
            display: 'flex',
            padding: '12px 0px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            flex: '1 0 0',
        };
    });
    const StyledAccordionTriggerTypography = styled(Typography)(() => {
        return {
            alignSelf: 'stretch',
        };
    });
    const StyledEndIconContainer = styled('div')(({ theme }) => {
        const shape = theme.shape as unknown as {
            borderRadiusNone: string;
        };
        return {
            display: 'flex',
            marginRight: '6px',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: shape.borderRadiusNone,
            flex: '1 0 0',
            borderRadius: shape.borderRadiusNone,
        };
    });

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

    const StyledDivider = styled('div')(() => ({
        height: '1px',
        alignSelf: 'stretch',
        border: '1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))',
    }));

    const StyledEditTextCell = styled('div')(() => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        gap: '3px',
    }));

    const StyledEditTextField = styled(TextField)(() => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '3px',
        alignSelf: 'stretch',
    }));

    const StyledSelect = styled(Select)(() => ({
        // minWidth: '126px',
        // width: '126px',
        // alignmentSelf: 'stretch',
    }));

    const StyledTableCell = styled(Table.Cell)({
        padding: '3px',
    });

    /**
     * EDIT LOGIC
     *
     * update the data using context
     */

    /** Reset Draggable */

    return (
        <TableContainer
            sx={{
                width: '100%',
                zIndex: 1,
                marginBottom: '20px',
                boxShadow: '9px 5px 22px 0px #D6EAFF',
            }}
            component={Paper}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                {data ? (
                    <StyledHeaderContainer>
                        <StyledHeader>
                            <StyledHeaderTitle variant="h6">
                                {canEdit ? 'Edit' : 'View'} Table:{' '}
                                {data.data.name}
                            </StyledHeaderTitle>
                        </StyledHeader>
                    </StyledHeaderContainer>
                ) : (
                    <StyledHeaderInstruction variant={'body1'}>
                        Please select a table from above if you would like to
                        view or edit table data
                    </StyledHeaderInstruction>
                )}
                <FormControlLabel
                    sx={{ marginLeft: '9px', marginTop: '9px' }}
                    control={<Switch onChange={() => setCanEdit(!canEdit)} />}
                    label="Edit"
                />
                <Button
                    variant="contained"
                    sx={{ marginLeft: '9px', marginTop: '9px' }}
                    disabled={!isDirty}
                >
                    Save Changes
                </Button>
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.Cell>ID</Table.Cell>
                            <Table.Cell>Name</Table.Cell>
                            {/* <Table.Cell>Alias</Table.Cell> */}
                            {/* <Table.Cell>Description</Table.Cell> */}
                            <Table.Cell>Data Type</Table.Cell>
                            <Table.Cell>Primary Key</Table.Cell>
                            <Table.Cell>Allow null</Table.Cell>
                            <Table.Cell>Foreign Key</Table.Cell>
                            <Table.Cell>Actions</Table.Cell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {fields.length
                            ? fields.map((col, rowIndex) => (
                                  <Table.Row key={col.id}>
                                      <StyledTableCell>
                                          {rowIndex}
                                      </StyledTableCell>
                                      <StyledTableCell
                                          component="th"
                                          scope="row"
                                      >
                                          <StyledEditTextField
                                              key={`${rowIndex}-name`}
                                              defaultValue={
                                                  data.data &&
                                                  data.data.properties[rowIndex]
                                                      .name
                                                      ? data.data.properties[
                                                            rowIndex
                                                        ].name
                                                      : ''
                                              }
                                              onChange={(e) => {
                                                  /** update cell value */
                                                  const temp = data;
                                                  temp.data.properties[
                                                      rowIndex
                                                  ].name = e.target.value;
                                                  setData(temp);
                                              }}
                                              onBlur={(e) => {
                                                  handleTextFieldChange(
                                                      rowIndex,
                                                      'name',
                                                      e.target.value,
                                                  );
                                              }}
                                              variant="outlined"
                                              disabled={!canEdit}
                                              size="small"
                                              sx={{
                                                  '& .MuiInputBase-input': {
                                                      borderRadius: '8px',
                                                      backgroundColor:
                                                          changedCells[
                                                              `${rowIndex}-name`
                                                          ]
                                                              ? 'rgb(255, 213, 128, 0.5)'
                                                              : 'transparent',
                                                  },
                                              }}
                                          />
                                          {/* <Controller
                                              name={`COLUMNS.${rowIndex}.name`}
                                              control={control}
                                              render={({ field }) => {
                                                  <StyledEditTextField
                                                      key={`${rowIndex}-name`}
                                                      value={field.value}
                                                      onChange={(event) =>
                                                          field.onChange(event)
                                                      }
                                                      variant="outlined"
                                                      disabled={!canEdit}
                                                      size="small"
                                                      sx={{
                                                          '& .MuiInputBase-input':
                                                              {
                                                                  borderRadius:
                                                                      '8px',
                                                                  backgroundColor:
                                                                      dirtyFields &&
                                                                      dirtyFields.COLUMNS &&
                                                                      dirtyFields
                                                                          .COLUMNS[
                                                                          `${rowIndex}`
                                                                      ]?.name
                                                                          ? 'rgb(255, 213, 128)'
                                                                          : 'transparent',
                                                              },
                                                      }}
                                                  />;
                                              }}
                                          /> */}
                                      </StyledTableCell>
                                      <StyledTableCell>
                                          <Controller
                                              control={control}
                                              name={`COLUMNS.${rowIndex}.type`}
                                              render={({ field }) => (
                                                  <StyledSelect
                                                      fullWidth
                                                      className="nodrag"
                                                      disabled={!canEdit}
                                                      value={field.value}
                                                      //   {...field}
                                                      onChange={(event) => {
                                                          field.onChange(event);
                                                          handleTextFieldChange(
                                                              rowIndex,
                                                              'type',
                                                              event.target
                                                                  .value,
                                                          );
                                                      }}
                                                      sx={{
                                                          borderRadius: '8px',
                                                          backgroundColor:
                                                              changedCells[
                                                                  `${rowIndex}-type`
                                                              ]
                                                                  ? 'rgb(255, 213, 128, 0.5)'
                                                                  : 'transparent',
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
                                      </StyledTableCell>
                                      <StyledTableCell>
                                          <Controller
                                              control={control}
                                              name={`COLUMNS.${rowIndex}.isPrimary`}
                                              render={({ field }) => (
                                                  <StyledSelect
                                                      fullWidth
                                                      className="nodrag"
                                                      disabled={!canEdit}
                                                      defaultValue={
                                                          field.value ===
                                                          undefined
                                                              ? false
                                                              : field.value
                                                      }
                                                      {...field}
                                                      onChange={(event) => {
                                                          field.onChange(event);
                                                          handleTextFieldChange(
                                                              rowIndex,
                                                              'isPrimary',
                                                              event.target
                                                                  .value,
                                                          );
                                                      }}
                                                      sx={{
                                                          borderRadius: '8px',
                                                          backgroundColor:
                                                              changedCells[
                                                                  `${rowIndex}-isPrimary`
                                                              ]
                                                                  ? 'rgb(255, 213, 128, 0.5)'
                                                                  : 'transparent',
                                                      }}
                                                  >
                                                      {[
                                                          {
                                                              value: 'true',
                                                              display: 'True',
                                                          },
                                                          {
                                                              value: 'false',
                                                              display: 'False',
                                                          },
                                                      ].map((option, idx) => (
                                                          <Select.Item
                                                              key={`${idx}_first`}
                                                              value={
                                                                  option.value
                                                              }
                                                          >
                                                              {option.display}
                                                          </Select.Item>
                                                      ))}
                                                  </StyledSelect>
                                              )}
                                          />
                                      </StyledTableCell>
                                      <StyledTableCell>False</StyledTableCell>
                                      <StyledTableCell>NA</StyledTableCell>
                                      <StyledTableCell
                                      //   key={`${col.id}_${rowIndex}_action`}
                                      >
                                          <Button
                                              type="button"
                                              disabled={!canEdit}
                                              onClick={() => remove(rowIndex)}
                                          >
                                              Delete
                                          </Button>
                                      </StyledTableCell>
                                  </Table.Row>
                              ))
                            : null}
                    </Table.Body>
                </Table>
                <Button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => append({})}
                >
                    Add Column
                </Button>
                <Button type="submit" disabled={!isDirty}>
                    Save
                </Button>
            </form>
        </TableContainer>

        /** VERTICAL PANEL VERSION OF EDIT METAMODEL */
        // <StyledContainer>
        //     <StyledHeaderContainer>
        //         <StyledHeader>
        //             <StyledHeaderText>
        //                 <StyledHeaderTitle variant="body1">
        //                     Properties
        //                 </StyledHeaderTitle>
        //                 <StyledHeaderInstruction variant="body2">
        //                     Update table and column properties
        //                 </StyledHeaderInstruction>
        //             </StyledHeaderText>
        //             <StyledHeaderIconContainer>
        //                 <StyledHeaderIconButton>
        //                     <Close />
        //                 </StyledHeaderIconButton>
        //             </StyledHeaderIconContainer>
        //         </StyledHeader>
        //     </StyledHeaderContainer>
        //     <StyledAccordion>
        //         <StyledAccordionTrigger>
        //             <StyledAccordionTriggerText>
        //                 <StyledAccordionTriggerLabel>
        //                     <StyledAccordionTriggerTypography variant="subtitle2">
        //                         Table
        //                     </StyledAccordionTriggerTypography>
        //                 </StyledAccordionTriggerLabel>
        //                 <StyledEndIconContainer>
        //                     <StyledHeaderIconButton>
        //                         <ExpandMore />
        //                     </StyledHeaderIconButton>
        //                 </StyledEndIconContainer>
        //             </StyledAccordionTriggerText>
        //         </StyledAccordionTrigger>
        //     </StyledAccordion>
        //     <StyledMenuItem>
        //         <TextField variant={'outlined'} value={'Schema'}></TextField>
        //     </StyledMenuItem>
        //     <StyledMenuItem>
        //         <TextField
        //             variant={'outlined'}
        //             label="Name"
        //             value={nodeData && nodeData.data ? nodeData.data.name : ''}
        //         ></TextField>
        //     </StyledMenuItem>
        //     <StyledMenuItem>
        //         <TextField
        //             variant={'outlined'}
        //             label="Description"
        //             value={'description'}
        //         ></TextField>
        //     </StyledMenuItem>
        //     <StyledAccordion>
        //         <StyledAccordionTrigger>
        //             <StyledAccordionTriggerText>
        //                 <StyledAccordionTriggerLabel>
        //                     <StyledAccordionTriggerTypography variant="subtitle2">
        //                         Columns
        //                     </StyledAccordionTriggerTypography>
        //                 </StyledAccordionTriggerLabel>
        //                 <StyledEndIconContainer>
        //                     <StyledHeaderIconButton>
        //                         <ExpandMore />
        //                     </StyledHeaderIconButton>
        //                 </StyledEndIconContainer>
        //             </StyledAccordionTriggerText>
        //         </StyledAccordionTrigger>
        //     </StyledAccordion>
        //     <StyledMenuItem>
        //         {nodeData && nodeData.data ? (
        //             nodeData.data.properties.map((p, idx) => {
        //                 return (
        //                     <>
        //                         <StyledMetamodelCardItem
        //                             key={p.id}
        //                             isPrimary={idx === 0 ? true : false}
        //                         >
        //                             <StyledMetamodelCardItemCell cellPosition="first">
        //                                 <StyledMetamodelCardItemCellText variant="body2">
        //                                     {p.name
        //                                         .toLowerCase()
        //                                         .replaceAll(' ', '_')}
        //                                 </StyledMetamodelCardItemCellText>
        //                             </StyledMetamodelCardItemCell>

        //                             <StyledMetamodelCardItemCell cellPosition="second">
        //                                 <StyledColumnTypeText
        //                                     variant="body2"
        //                                     columnDataType={
        //                                         p.type ? p.type : ''
        //                                     }
        //                                 >
        //                                     {p.type ? p.type.toLowerCase() : ''}
        //                                 </StyledColumnTypeText>
        //                             </StyledMetamodelCardItemCell>

        //                             {idx === 0 || idx === 1 ? (
        //                                 <StyledMetamodelCardItemCell cellPosition="third">
        //                                     <StyledKeyIconContainer>
        //                                         <StyledKeyIcon
        //                                             isPrimary={idx === 0}
        //                                         />
        //                                     </StyledKeyIconContainer>
        //                                 </StyledMetamodelCardItemCell>
        //                             ) : null}
        //                         </StyledMetamodelCardItem>
        //                         {idx === 0 ? <StyledDivider /> : null}
        //                     </>
        //                 );
        //             })
        //         ) : (
        //             <div>Select a table</div>
        //         )}
        //     </StyledMenuItem>
        //     <StyledAccordion>
        //         <StyledAccordionTrigger>
        //             <StyledAccordionTriggerText>
        //                 <StyledAccordionTriggerLabel>
        //                     <StyledAccordionTriggerTypography variant="subtitle2">
        //                         Relationships
        //                     </StyledAccordionTriggerTypography>
        //                 </StyledAccordionTriggerLabel>
        //                 <StyledEndIconContainer>
        //                     <StyledHeaderIconButton>
        //                         <ExpandMore />
        //                     </StyledHeaderIconButton>
        //                 </StyledEndIconContainer>
        //             </StyledAccordionTriggerText>
        //         </StyledAccordionTrigger>
        //     </StyledAccordion>
        // </StyledContainer>
    );
};
