import React from 'react';
import { Page } from '@/components/ui/';
import { Form } from '@semoss/components';
import { styled, Typography, Box, FileDropzone, Grid } from '@semoss/ui';
import { useForm } from 'react-hook-form';
import { Field } from './../../components/form';
import { FORM_ROUTES } from './forms/';

const StyledStack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledBox = styled(Box)({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '24px 16px 16px 16px',
    marginTop: '48px',
});

const UploadData = () => {
    const [selectedValues, setSelectedValues] = React.useState(null);

    return (
        <FileDropzone
            value={selectedValues}
            onChange={(newValues) => {
                setSelectedValues(newValues);
            }}
        />
    );
};

const stepsOne = [
    'Drag and Drop Data',
    'Connect to an External Database',
    'Copy Database',
    'Upload Database',
    // 'Build Database',
];

const stepsTwo = {
    ['Drag and Drop Data']: [
        'CSV',
        'Excel',
        'TSV',
        'SQLite',
        'H2',
        'Neo4J',
        'Tinker',
    ],
    ['Connect to an External Database']: [
        'Aster',
        'Athena',
        'BigQuery',
        'Cassandra',
        'Clickhouse',
        'DATABRICKS',
        'DataStax',
        'DB2',
        'Derby',
        'Elastic Search',
        'H2',
        'Hive',
        'Impala',
        'MariaDB',
        'MySQL',
        'Open Search',
        'Oracle',
        'Phoenix',
        'Postgres',
        'Redshift',
        'SAP Hana',
        'SEMOSS',
        'Snowflake',
        'SQL Server',
        'SQLITE',
        'Teradata',
        'Tibco',
        'Trino',
    ],
};

export const DatabaseImport = () => {
    const [activeStep, setActiveStep] = React.useState(0);
    const [stepOne, setStepOne] = React.useState('');
    const [stepTwo, setStepTwo] = React.useState('');

    const getForm = (form) => {
        return React.createElement(form.component);
    };

    console.log(activeStep, stepOne);

    return (
        <>
            <Page
                header={
                    <StyledStack>
                        <Typography variant="h4">Import Database</Typography>
                        <Typography variant="body1">
                            Add/import new database
                        </Typography>
                    </StyledStack>
                }
            >
                <Box sx={{ width: '100%' }}>
                    <Grid container columns={12}>
                        {stepsOne.map((val, idx) => (
                            <Grid item key={idx} xs={3} lg={3} md={3} xl={3}>
                                <Box
                                    onClick={() => {
                                        setStepOne(val);
                                        if (
                                            val === 'Copy Database' ||
                                            val === 'Upload Database'
                                        ) {
                                            setActiveStep(2);
                                            setStepTwo('');
                                        } else {
                                            setActiveStep(1);
                                            setStepTwo('');
                                        }
                                    }}
                                    sx={{
                                        width: '350px',
                                        height: '250px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        padding: '24px',
                                        boxShadow:
                                            '16px 21px 15px -3px rgba(0,0,0,0.1)',
                                    }}
                                >
                                    <Box>{val}</Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: '100%',
                        }}
                    >
                        <StyledBox>Hi</StyledBox>
                        <StyledBox>Hi</StyledBox>
                    </Box>
                </Box>
                {(activeStep === 1 || activeStep === 2) && (
                    <StyledBox>
                        {activeStep === 1 && !stepTwo && (
                            <Grid container rowSpacing={2}>
                                {Object.keys(stepsTwo).map((val, idx) => {
                                    if (val === stepOne) {
                                        return stepsTwo[val].map(
                                            (value, index) => {
                                                console.log(value);
                                                return (
                                                    <Grid
                                                        item
                                                        key={index}
                                                        xs={1}
                                                        lg={1}
                                                        md={1}
                                                        xl={1}
                                                    >
                                                        <Box
                                                            onClick={() => {
                                                                setStepTwo(
                                                                    value,
                                                                );
                                                                if (
                                                                    value ===
                                                                        'Copy Database' ||
                                                                    value ===
                                                                        'Upload Database'
                                                                ) {
                                                                    setActiveStep(
                                                                        2,
                                                                    );
                                                                } else {
                                                                    setActiveStep(
                                                                        1,
                                                                    );
                                                                }
                                                            }}
                                                            sx={{
                                                                height: '100px',
                                                                width: '100px',
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'center',
                                                                alignItems:
                                                                    'center',
                                                                border: '1px solid rgba(0,0,0,0.1)',
                                                                padding: '24px',
                                                                fontSize:
                                                                    '12px',
                                                            }}
                                                        >
                                                            <Box>{value}</Box>
                                                        </Box>
                                                    </Grid>
                                                );
                                            },
                                        );
                                    }
                                })}
                            </Grid>
                        )}
                        {activeStep === 1 &&
                            stepTwo &&
                            FORM_ROUTES.map((f) => {
                                if (f.name === stepTwo) {
                                    return getForm(f);
                                }
                            })}
                        {activeStep === 2 && stepOne === 'Upload Database' && (
                            <UploadData />
                        )}
                        {activeStep === 2 && stepOne === 'Copy Database' && (
                            <CopyDatabaseForm />
                        )}
                    </StyledBox>
                )}
            </Page>
        </>
    );
};

const CopyDatabaseForm = () => {
    const { control, watch } = useForm();

    return (
        <Form>
            <Field
                name="DATABASE_NAME"
                label="Database Name"
                control={control}
                rules={{
                    required: true,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
            <Field
                name="DATABASE_LOCATION"
                label="Database Location"
                control={control}
                rules={{
                    required: false,
                }}
                options={{
                    component: 'input',
                }}
                description=""
                layout="vertical"
            />
        </Form>
    );
};
