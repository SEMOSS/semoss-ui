import { StepConfig, StepComponent } from './step.types';
import {
    Table,
    Button,
    Modal,
    Tabs,
    Form,
    styled,
    Icon,
} from '@semoss/components';
import { Field } from '@/components/form';
import { useForm, useFieldArray } from 'react-hook-form';
import { theme } from '@/theme';
import { useEffect, useState, useReducer, useCallback } from 'react';
import { usePixel, useRootStore } from '@/hooks';
import {
    mdiChevronRight,
    mdiChevronDown,
    mdiSquareEditOutline,
    mdiCloseThick,
    mdiPlusThick,
} from '@mdi/js';
import { useNavigate } from 'react-router-dom';
export interface DataSelectionConfig extends StepConfig {
    id: string;
    data: any;
}
interface DataSelectionRow {
    name: string;
    dataType: string;
    remove: boolean;
    disabled: boolean;
}
type DataSelectionOptions = DataSelectionRow[];
type FormData = {
    alias: string;
    dataType: string;
    description: string;
    logicalNames: LogicalName[];
    logicalName: string;
    sampleInstance: string;
    format: string;
    prepend: string;
    append: string;
    largeNumber: string;
    numberDelimiter: string;
    round: number;
    javaDateFormatNotation: string;
};
interface LogicalName {
    name: string;
    remove: boolean;
}
const Wrapper = styled('div', {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.colors['grey-4'],
});

const StyledCardHeaderIcon = styled(Icon, {
    height: 'auto',
    width: theme.space['8'],
    variants: {
        add: {
            true: {
                color: 'green',
            },
            false: {
                color: 'red',
            },
        },
    },
});

const StyledForm = styled(Form, {
    width: theme.space['full'],
});

const FlexSpaceBetween = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
});

const initialState = {};

const reducer = (state, action) => {
    switch (action.type) {
        case 'create': {
            return {
                ...action.payload,
            };
        }
        case 'update': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

const _DataSelectionStep: StepComponent<DataSelectionConfig> = ({
    stepIdx,
    step,
    updateStep,
    navigateStep,
    steps,
    updateSteps,
}) => {
    const navigate = useNavigate();
    const handleResponse = useCallback(
        (id, dbName) => {
            navigate(`/importedDatabase/${id}`, {
                state: { dbName },
            });
        },
        [navigate],
    );
    const { setValue, handleSubmit, control, watch, getValues } =
        useForm<FormData>({
            defaultValues: {
                alias: '',
                description: '',
                logicalNames: [],
                sampleInstance: '',
                dataType: '',
                format: '',
                prepend: '',
                append: '',
                largeNumber: '',
                numberDelimiter: '',
                round: 2,
                javaDateFormatNotation: '',
            },
        });
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'logicalNames',
    });
    const { configStore, monolithStore } = useRootStore();
    const customOptions = {
        largeNumberFormatOptions: {
            None: 'Default',
            'Thousand (e.g. 1.00k)': 'Thousand',
            'Million (e.g. 1.00M)': 'Million',
            'Billion (e.g. 1.00B)': 'Billion',
            'Trillion (e.g. 1.00T)': 'Trillion',
            'Accounting ($)': 'Accounting',
            'Scientific (1.00E+03)': 'Scientific',
            'Percentage (%)': 'Percentage',
        },
        delimiterOptions: {
            None: 'Default',
            'Comma (1,000)': ',',
            'Period (1.000)': '.',
        },
    };

    const formats = {
        String: {},
        Integer: {
            '1000': 'int_default',
            '1,000': 'int_comma',
            $1000: 'int_currency',
            '$1,000': 'int_currency_comma',
            '10%': 'int_percent',
            '1.00k': 'thousand',
            '1.00M': 'million',
            '1.00B': 'billion',
            '1.00T': 'trillion',
            'Accounting ($)': 'accounting',
            'Scientific (1.00E+03)': 'scientific',
            'Custom Number Format': 'Custom',
            customOptions: {
                dimension: '',
                dimensionType: '',
                model: '',
                type: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                round: 0,
                appliedString: '',
                layout: '',
                date: 'Default',
            },
        },
        Double: {
            '1000.00': 'double_round2',
            '1000.0': 'double_round1',
            '1000.000': 'double_round3',
            '1,000.0': 'double_comma_round1',
            '1,000.00': 'double_comma_round2',
            '$1,000.00': 'double_currency_comma_round2',
            '10.0%': 'double_percent_round1',
            '10.00%': 'double_percent_round2',
            '1.00k': 'thousand',
            '1.00M': 'million',
            '1.00B': 'billion',
            '1.00T': 'trillion',
            'Accounting ($)': 'accounting',
            'Scientific (1.00E+03)': 'scientific',
            'Custom Number Format': 'Custom',
            customOptions: {
                dimension: '',
                dimensionType: '',
                model: '',
                type: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                round: 2,
                appliedString: '',
                layout: '',
                date: 'Default',
            },
        },
        Date: {
            '1879-03-14': 'yyyy-MM-dd',
            '03/14/1879': 'MM/dd/yyyy',
            '3/14/1879': 'M/d/yyyy',
            '03/14/79': 'MM/dd/yy',
            '03/14': 'MM/dd',
            'March 14, 1879': 'MMMMM d, yyyy',
            '14-Mar': 'dd-MMM',
            '14-Mar-79': 'dd-MMM-yy',
            '14-Mar-1879': 'dd-MMM-yyyy',
            'Mar-79': 'MMM-yy',
            'Friday, March 14, 1879': 'EEEEE, MMMMM d, yyyy',
            '1879': 'yyyy',
            '187903': 'yyyyMM',
            '18790314': 'yyyyMMdd',
            'Custom Date Format': 'Custom',
            customOptions: {
                dimension: '',
                dimensionType: '',
                model: '',
                type: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                round: '',
                appliedString: '',
                layout: '',
                date: '',
            },
        },
        TimeStamp: {
            '1879-03-14 13:30:55': 'yyyy-MM-dd HH:mm:ss',
            '1879-03-14 1:30 PM': 'yyyy-MM-dd hh:mm a',
            '1879-03-14 13:30': 'yyyy-MM-dd HH:mm',
            '1879-03-14 1:30': 'yyyy-MM-dd hh:mm',
            '3/14/79 13:30:55': 'M/d/yy HH:mm:ss',
            '3/14/79 1:30 PM': 'M/d/yy hh:mm a',
            '3/14/79 13:30': 'M/d/yy HH:mm',
            '3/14/79 1:30': 'M/d/yy hh:mm',
            'Custom Timestamp Format': 'Custom',
            customOptions: {
                dimension: '',
                dimensionType: '',
                model: '',
                type: 'Default',
                delimiter: 'Default',
                prepend: '',
                append: '',
                round: '',
                appliedString: '',
                layout: '',
                date: '',
            },
        },
    };
    const [dataSelectionOptions, setDataSelectionOptions] =
        useState<DataSelectionOptions>([]);
    const [openEditModal, setOpenEditModal] = useState<boolean>(false);
    const [dataSelectionRowToEdit, setDataSelectionRowToEdit] = useState<any>(
        {},
    );
    const dataType: string = watch('dataType');
    const format: string = watch('format');
    const [selectedTab, setSelectedTab] = useState<string>('Settings');
    let pixelString = '';
    for (let i = 0; i < step.data.responseFiles.length; i++) {
        pixelString += `PredictDataTypes ( filePath = [ "${step.data.responseFiles[i].fileLocation}" ] , delimiter = [ "${step.data.delimiter}" ] , rowCount = [ false ] ) ;`;
    }
    console.log(pixelString);

    // this still doesnt work if you have multiple files...
    const { status, data } = usePixel<any>(pixelString);

    const [state, dispatch] = useReducer(reducer, initialState);
    if (status === 'SUCCESS' && !Object.keys(state).length) {
        const fileObj = {};
        step.data.responseFiles.forEach((file) => {
            fileObj[file.fileName] = {
                unselect: false,
                show: true,
                rows: [],
                additionalDataTypes: {},
            };
            //  this will have to be updated.
            data.cleanHeaders.forEach((cleanheader: string) => {
                const row: DataSelectionRow = {
                    name: cleanheader,
                    dataType: data.dataTypes[cleanheader],
                    remove: true,
                    disabled: false,
                };
                fileObj[file.fileName].rows.push(row);
            });
            for (const prop in data.additionalDataTypes) {
                fileObj[file.fileName].additionalDataTypes[
                    JSON.stringify(prop)
                ] = JSON.stringify(data.additionalDataTypes[prop]);
            }
        });
        dispatch({ type: 'create', payload: fileObj });
    }

    useEffect(() => {
        if (dataType) {
            if (dataType === 'String') {
                setValue('format', '');
            } else {
                setValue('format', Object.keys(formats[dataType])[0]);
            }
        }
    }, [dataType]);
    useEffect(() => {
        if (format === 'Custom Number Format') {
            setValue(
                'largeNumber',
                Object.keys(customOptions.largeNumberFormatOptions)[0],
            );
            setValue(
                'numberDelimiter',
                Object.keys(customOptions.delimiterOptions)[0],
            );
            if (dataType === 'Double') {
                setValue('round', 2);
            }
        } else {
            setValue('append', '');
            setValue('prepend', '');
            setValue('largeNumber', '');
            setValue('numberDelimiter', '');
            setValue('javaDateFormatNotation', '');
            if (dataType === 'Double') {
                setValue('round', 2);
            }
        }
    }, [format]);

    const toggleValue = (
        fileName: string,
        newValue: boolean,
        fieldToUpdate: string | null,
        idx: number | null,
    ): void => {
        const fileToUpdate = state[fileName];
        if (fieldToUpdate) {
            fileToUpdate[fieldToUpdate] = newValue;
        }
        if (idx !== null || fieldToUpdate === 'unselect') {
            fileToUpdate.rows = updateRows(fileToUpdate.rows, newValue, idx);
        }
        dispatch({
            type: 'update',
            field: fileName,
            value: fileToUpdate,
        });
    };

    const updateRows = (
        rows: DataSelectionRow[],
        newValue: boolean,
        idx: number | null,
    ): DataSelectionRow[] => {
        return rows.map((row, i) => {
            if (idx !== null) {
                return i === idx ? { ...row, remove: newValue } : { ...row };
            }
            return { ...row, disabled: newValue, remove: newValue };
        });
    };

    const onSubmit = handleSubmit((formData) => {
        //        "databaseVar = RdbmsUploadTableData ( database = [ \"2Movie Data Datedcdcdcdcd\" ] , filePath = [ \"\\\\2Movie Data Date.csv\" ] , delimiter = [ \",\" ] , dataTypeMap = [ { \"Nominated\" : \"STRING\" , \"Title\" : \"STRING\" , \"Genre\" : \"STRING\" , \"Studio\" : \"STRING\" , \"Director\" : \"STRING\" , \"Revenue_Domestic\" : \"INT\" , \"MovieBudget\" : \"INT\" , \"Revenue_International\" : \"INT\" , \"RottenTomatoes_Critics\" : \"DOUBLE\" , \"RottenTomatoes_Audience\" : \"DOUBLE\" , \"Cast_Formed\" : \"DATE\" , \"Production_Start\" : \"DATE\" , \"Production_End\" : \"DATE\" , \"Theatre_Release_Date\" : \"DATE\" , \"DVD_Release\" : \"DATE\" } ] ,
        //newHeaders = [ { } ] ,
        //additionalDataTypes = [ { \"Cast_Formed\" : \"M/d/yyyy\" , \"Production_Start\" : \"M/d/yyyy\" , \"Production_End\" : \"M/d/yyyy\" , \"Theatre_Release_Date\" : \"M/d/yyyy\" , \"DVD_Release\" : \"M/d/yyyy\" } ]
        // , descriptionMap = [ { } ] , logicalNamesMap = [ { } ] , existing = [ false ] ) ;"
        //"RdbmsUploadTableData ( database = [ databaseVar ] , filePath = [ \"\\\\CollegeData.csv\" ] , delimiter = [ \",\" ] , dataTypeMap = [ { \"Institution_Name\" : \"STRING\" , \"City\" : \"STRING\" , \"State\" : \"STRING\" , \"City_State\" : \"STRING\" , \"Zip\" : \"STRING\" , \"URL\" : \"STRING\" , \"Main_Campus\" : \"STRING\" , \"Predominant_Ugrad_Deg\" : \"STRING\" , \"Highest_Deg\" : \"STRING\" , \"Control\" : \"STRING\" , \"Locale\" : \"STRING\" , \"Lat\" : \"DOUBLE\" , \"Long\" : \"DOUBLE\" , \"Religious_Affiliation\" : \"STRING\" , \"Adm_Rate\" : \"DOUBLE\" , \"SAT_R_75\" : \"INT\" , \"SAT_M_75\" : \"INT\" , \"SAT_W_75\" : \"INT\" , \"ACT_CUM_75\" : \"INT\" , \"Undergrad_Enrollment\" : \"INT\" , \"Percent_White\" : \"DOUBLE\" , \"Percent_Black\" : \"DOUBLE\" , \"Percent_Hisp\" : \"DOUBLE\" , \"Percent_Asian\" : \"DOUBLE\" , \"Percent_AIAN\" : \"DOUBLE\" , \"Percent_NHPI\" : \"DOUBLE\" , \"Percent_2OrMore\" : \"DOUBLE\" , \"Percent_NRA\" : \"DOUBLE\" , \"Percent_UNKN\" : \"DOUBLE\" , \"Percent_Part_time\" : \"DOUBLE\" , \"Avg_Cost_Academic_Year\" : \"INT\" , \"Avg_Cost_Program_Year\" : \"STRING\" , \"In_state_Tuition\" : \"INT\" , \"Out_of_state_Tuition\" : \"INT\" , \"Avg_Fac_Sal\" : \"INT\" , \"Percent_Full_time_Fac\" : \"DOUBLE\" , \"CompletionRate_150_4\" : \"DOUBLE\" , \"CompletionRate_150_L4\" : \"DOUBLE\" , \"RetentionRate_FT4\" : \"DOUBLE\" , \"RetentionRate_FTL4\" : \"DOUBLE\" , \"RetentionRate_PT4\" : \"DOUBLE\" , \"RetentionRate_PTL4\" : \"DOUBLE\" , \"Compl_Repay_1yr_Rate\" : \"STRING\" , \"Noncom_Repay_1yr_Rate\" : \"STRING\" , \"Compl_Repay_7yr_Rate\" : \"STRING\" , \"Noncom_Repay_7yr_Rate\" : \"STRING\" , \"Low_Inc_Aid\" : \"STRING\" , \"Parent_Ed_MS\" : \"STRING\" , \"Parent_Ed_HS\" : \"STRING\" , \"Parent_Ed_PS\" : \"STRING\" , \"Percent_Female\" : \"STRING\" , \"Percent_Male\" : \"STRING\" , \"Percent_Veterans\" : \"STRING\" , \"Percent_First_Gen\" : \"STRING\" , \"Level_of_institution\" : \"STRING\" , \"TIV_Approval_Date\" : \"DATE\" , \"Top3Majors\" : \"STRING\" } ] , newHeaders = [ { } ] , additionalDataTypes = [ { \"TIV_Approval_Date\" : \"M/d/yyyy\" } ] , descriptionMap = [ { } ] , logicalNamesMap = [ { } ] , existing = [ true ] ) ;"

        console.log(data);
        console.log(state);
        console.log(step);

        const dataTypeMap = {};
        state[step.data.responseFiles[0].fileName].rows.forEach((row) => {
            if (!row.disabled) {
                dataTypeMap[row.name] = row.dataType;
            }
        });
        const pixel = `databaseVar = RdbmsUploadTableData ( database = [${JSON.stringify(
            step.data.databaseName,
        )}] , filePath= [${JSON.stringify(
            step.data.responseFiles[0].fileLocation,
        )}] , delimiter = [${JSON.stringify(
            step.data.delimiter,
        )}] , dataTypeMap = [${JSON.stringify(
            dataTypeMap,
        )}] , newHeaders = [ { } ] , additionalDataTypes = [${JSON.stringify(
            data.additionalDataTypes,
        )}] , descriptionMap = [ { } ] , logicalNamesMap = [ { } ] , existing = [ false ] )`;
        monolithStore.runQuery(pixel).then((response) => {
            handleResponse(
                response.pixelReturn[0].output.database_id,
                step.data.databaseName,
            );
        });
    });

    if (status === 'SUCCESS' && Object.keys(state).length) {
        return (
            <StyledForm>
                {Object.keys(state).map((prop, idx) => {
                    return (
                        <div key={idx}>
                            <b>File Name: </b>
                            {prop}
                            <Wrapper>
                                <FlexSpaceBetween>
                                    <div
                                        onClick={() => {
                                            toggleValue(
                                                prop,
                                                !state[prop].show,
                                                'show',
                                                null,
                                            );
                                        }}
                                    >
                                        <StyledCardHeaderIcon
                                            path={
                                                state[prop].show
                                                    ? mdiChevronDown
                                                    : mdiChevronRight
                                            }
                                        />
                                    </div>
                                    <div>Sheet Name: {prop}</div>
                                    <Button
                                        color="grey"
                                        variant="text"
                                        onClick={() => {
                                            toggleValue(
                                                prop,
                                                !state[prop].unselect,
                                                'unselect',
                                                null,
                                            );
                                        }}
                                    >
                                        {!state[prop].unselect
                                            ? 'Unselect'
                                            : 'Select'}
                                    </Button>
                                </FlexSpaceBetween>
                                {state[prop].show ? (
                                    <div>
                                        Table Name: {prop}
                                        <Table>
                                            <Table.Head>
                                                <Table.Row>
                                                    <Table.Cell title="Name">
                                                        Name
                                                    </Table.Cell>
                                                    <Table.Cell title="Data Type">
                                                        Data Type
                                                    </Table.Cell>
                                                    <Table.Cell />
                                                </Table.Row>
                                            </Table.Head>
                                            <Table.Body>
                                                {state[prop].rows.map(
                                                    (row, idx) => {
                                                        const {
                                                            name,
                                                            dataType,
                                                            remove,
                                                        } = row;
                                                        return (
                                                            <Table.Row
                                                                key={idx}
                                                            >
                                                                <Table.Cell>
                                                                    {name}
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <FlexSpaceBetween>
                                                                        <div>
                                                                            {
                                                                                dataType
                                                                            }
                                                                        </div>
                                                                        <Button
                                                                            color="grey"
                                                                            variant="text"
                                                                            onClick={() => {
                                                                                setOpenEditModal(
                                                                                    true,
                                                                                );
                                                                                setValue(
                                                                                    'alias',
                                                                                    name,
                                                                                );
                                                                                setValue(
                                                                                    'dataType',
                                                                                    dataType.slice(
                                                                                        0,
                                                                                        1,
                                                                                    ) +
                                                                                        dataType
                                                                                            .slice(
                                                                                                1,
                                                                                            )
                                                                                            .toLowerCase(),
                                                                                );
                                                                            }}
                                                                        >
                                                                            <StyledCardHeaderIcon
                                                                                path={
                                                                                    mdiSquareEditOutline
                                                                                }
                                                                            />
                                                                        </Button>
                                                                    </FlexSpaceBetween>
                                                                </Table.Cell>
                                                                <Table.Cell>
                                                                    <Button
                                                                        color="grey"
                                                                        variant="text"
                                                                        onClick={() => {
                                                                            toggleValue(
                                                                                prop,
                                                                                !remove,
                                                                                null,
                                                                                idx,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <StyledCardHeaderIcon
                                                                            title={`${
                                                                                remove
                                                                                    ? 'Remove'
                                                                                    : 'Add'
                                                                            } column`}
                                                                            add={
                                                                                remove
                                                                                    ? 'false'
                                                                                    : 'true'
                                                                            }
                                                                            path={
                                                                                remove
                                                                                    ? mdiCloseThick
                                                                                    : mdiPlusThick
                                                                            }
                                                                        />
                                                                    </Button>
                                                                </Table.Cell>
                                                            </Table.Row>
                                                        );
                                                    },
                                                )}
                                            </Table.Body>
                                        </Table>
                                    </div>
                                ) : null}
                            </Wrapper>
                        </div>
                    );
                })}
                <Modal open={openEditModal}>
                    <Modal.Content size={'lg'}>
                        <Modal.Header>Log Data</Modal.Header>
                        <Modal.Body>
                            <Tabs
                                onChange={(tab) => {
                                    setSelectedTab(tab);
                                }}
                                value={selectedTab}
                            >
                                <Tabs.List>
                                    <Tabs.Trigger
                                        disabled={false}
                                        value="Settings"
                                    >
                                        Settings
                                    </Tabs.Trigger>
                                    <Tabs.Trigger
                                        disabled={false}
                                        value="Description"
                                    >
                                        Description
                                    </Tabs.Trigger>
                                    <Tabs.Trigger
                                        disabled={false}
                                        value="Logical Names"
                                    >
                                        Logical Names
                                    </Tabs.Trigger>
                                    <Tabs.Trigger
                                        disabled={false}
                                        value="Sample Instances"
                                    >
                                        Sample Instances
                                    </Tabs.Trigger>
                                </Tabs.List>
                                <Tabs.Content value="Settings">
                                    <Field
                                        label="Edit Alias"
                                        name="alias"
                                        control={control}
                                        rules={{
                                            required: false,
                                        }}
                                        options={{
                                            component: 'input',
                                        }}
                                        layout="vertical"
                                    />
                                    <Field
                                        label="Select A Data Type"
                                        name="dataType"
                                        control={control}
                                        rules={{ required: false }}
                                        options={{
                                            component: 'select',
                                            options: Object.keys(formats),
                                        }}
                                        disabled={false}
                                        error={''}
                                        layout="vertical"
                                    />
                                    {dataType && dataType !== 'String' ? (
                                        <Field
                                            label="Select A Format"
                                            name="format"
                                            control={control}
                                            rules={{ required: true }}
                                            options={{
                                                component: 'select',
                                                options: Object.keys(
                                                    formats[dataType],
                                                ).slice(0, -1),
                                            }}
                                            disabled={false}
                                            error={''}
                                            description={
                                                dataType === 'Date'
                                                    ? 'Please select the format that matches your data'
                                                    : ''
                                            }
                                            layout="vertical"
                                        />
                                    ) : null}
                                    {format === 'Custom Number Format' ? (
                                        <div>
                                            <Field
                                                label="Prepend Value to Label"
                                                name="prepend"
                                                control={control}
                                                rules={{ required: false }}
                                                options={{
                                                    component: 'input',
                                                }}
                                                disabled={false}
                                                error={''}
                                                layout="vertical"
                                            />
                                            <Field
                                                label="Append Value to Label"
                                                name="append"
                                                control={control}
                                                rules={{ required: false }}
                                                options={{
                                                    component: 'input',
                                                }}
                                                disabled={false}
                                                error={''}
                                                layout="vertical"
                                            />
                                            {dataType === 'Double' ? (
                                                <Field
                                                    label="Round to # of Decimal Places"
                                                    name="round"
                                                    control={control}
                                                    rules={{ required: true }}
                                                    options={{
                                                        component: 'input',
                                                    }}
                                                    disabled={false}
                                                    error={''}
                                                    layout="vertical"
                                                />
                                            ) : null}
                                            <Field
                                                label="Large Number Format"
                                                name="largeNumber"
                                                control={control}
                                                rules={{ required: true }}
                                                options={{
                                                    component: 'select',
                                                    options: Object.keys(
                                                        customOptions.largeNumberFormatOptions,
                                                    ),
                                                }}
                                                disabled={false}
                                                error={''}
                                                layout="vertical"
                                            />
                                            <Field
                                                label="Number Delimiter"
                                                name="numberDelimiter"
                                                control={control}
                                                rules={{ required: true }}
                                                options={{
                                                    component: 'select',
                                                    options: Object.keys(
                                                        customOptions.delimiterOptions,
                                                    ),
                                                }}
                                                disabled={false}
                                                error={''}
                                                layout="vertical"
                                            />
                                        </div>
                                    ) : format === 'Custom Timestamp Format' ||
                                      format === 'Custom Date Format' ? (
                                        <Field
                                            label="Enter Format as Java Date Format Notation"
                                            name="javaDateFormatNotation"
                                            control={control}
                                            rules={{ required: false }}
                                            options={{
                                                component: 'input',
                                            }}
                                            disabled={false}
                                            error={''}
                                            layout="vertical"
                                        />
                                    ) : null}
                                </Tabs.Content>
                                <Tabs.Content value="Description">
                                    <Field
                                        label="Edit Description"
                                        name="description"
                                        control={control}
                                        rules={{ required: false }}
                                        options={{
                                            component: 'textarea',
                                        }}
                                        disabled={false}
                                        error={''}
                                        layout="vertical"
                                    />
                                    <Button>Predict</Button>
                                </Tabs.Content>
                                <Tabs.Content value="Logical Names">
                                    <b>Current Logical Name(s): </b>
                                    {fields.length ? (
                                        <Table>
                                            <Table.Head>
                                                <Table.Row>
                                                    <Table.Cell title="Name">
                                                        Name
                                                    </Table.Cell>
                                                    <Table.Cell title="Remove">
                                                        Remove
                                                    </Table.Cell>
                                                </Table.Row>
                                            </Table.Head>
                                            <Table.Body>
                                                {fields.map((field, idx) => {
                                                    return (
                                                        <Table.Row key={idx}>
                                                            <Table.Cell
                                                                title={
                                                                    field.name
                                                                }
                                                            >
                                                                {field.name}
                                                            </Table.Cell>
                                                            <Table.Cell
                                                                title={
                                                                    field.name
                                                                }
                                                            >
                                                                <Button
                                                                    onClick={() => {
                                                                        remove(
                                                                            idx,
                                                                        );
                                                                    }}
                                                                >
                                                                    Remove
                                                                </Button>
                                                            </Table.Cell>
                                                        </Table.Row>
                                                    );
                                                })}
                                            </Table.Body>
                                        </Table>
                                    ) : (
                                        <div>
                                            No Logical Names Have Been Selected
                                        </div>
                                    )}

                                    <Field
                                        label="Enter New Logical Name"
                                        name="logicalName"
                                        control={control}
                                        rules={{ required: false }}
                                        options={{
                                            component: 'input',
                                        }}
                                        disabled={false}
                                        error={''}
                                        layout="vertical"
                                    />
                                    <Button
                                        onClick={() => {
                                            append({
                                                name: getValues('logicalName'),
                                                remove: false,
                                            });
                                            setValue('logicalName', '');
                                        }}
                                    >
                                        Add
                                    </Button>
                                </Tabs.Content>
                                <Tabs.Content value="Sample Instances">
                                    <Field
                                        label="Search for Sample Instance"
                                        name="sampleInstance"
                                        control={control}
                                        rules={{ required: false }}
                                        options={{
                                            component: 'input',
                                        }}
                                        disabled={false}
                                        error={''}
                                        layout="vertical"
                                    />
                                </Tabs.Content>
                            </Tabs>
                            <div>{Object.keys(dataSelectionRowToEdit)}</div>
                        </Modal.Body>
                        <Button onClick={() => setOpenEditModal(false)}>
                            Close
                        </Button>
                    </Modal.Content>
                </Modal>
                <div>
                    <Button
                        onClick={() => {
                            // navigate to the next one
                            navigateStep(stepIdx - 1);
                        }}
                    >
                        Back
                    </Button>
                    <Button
                        onClick={() => {
                            onSubmit();
                        }}
                    >
                        Import
                    </Button>
                </div>
            </StyledForm>
        );
    }
    return <div>...loading</div>;
};
_DataSelectionStep.config = {
    id: 'dataSelection',
    data: {},
};
export { _DataSelectionStep as DataSelectionStep };
