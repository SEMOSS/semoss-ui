import React from 'react';
import { Page } from '@/components/ui/';
import { Form } from '@semoss/components';
import { styled, Typography, Box, FileDropzone, Grid } from '@semoss/ui';
import { useForm } from 'react-hook-form';
import { Field } from '../../../components/form';
import { FORM_ROUTES } from './forms';

const StyledStack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledBox = styled(Box)({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '24px 16px 16px 16px',
    marginBottom: '32px',
});

const StyledStepBox = styled(Box)({
    width: '350px',
    height: '250px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(0,0,0,0.1)',
    padding: '24px',
    boxShadow: '16px 21px 15px -3px rgba(0,0,0,0.1)',
});

const StyledFormTypeBox = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(0,0,0,0.1)',
    padding: '24px',
    boxShadow: '10px 10px 10px -3px rgba(0,0,0,0.1)',
});

const StyledCategoryTitle = styled(Box)({
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '16px',
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
    'Drag and Drop Data or Connect to an External Database',
    'Copy Database',
    'Upload Database',
    'Build Database',
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
                    {activeStep === 0 && (
                        <Grid container columns={12}>
                            {stepsOne.map((val, idx) => (
                                <Grid
                                    item
                                    key={idx}
                                    xs={3}
                                    lg={3}
                                    md={3}
                                    xl={3}
                                >
                                    <StyledStepBox
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
                                    >
                                        <Box>{val}</Box>
                                    </StyledStepBox>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
                {(activeStep === 1 || activeStep === 2) && (
                    <StyledBox>
                        {activeStep === 1 && !stepTwo && (
                            <Box>
                                <StyledCategoryTitle>
                                    File Uploads
                                </StyledCategoryTitle>
                                <Box>
                                    <Grid
                                        container
                                        columns={6}
                                        columnGap={2}
                                        rowGap={2}
                                    >
                                        {stepsTwo['Drag and Drop Data'].map(
                                            (stage, idx) => {
                                                return (
                                                    <Grid
                                                        key={idx}
                                                        item
                                                        lg={1}
                                                        md={1}
                                                        xs={1}
                                                        xl={1}
                                                        sm={1}
                                                    >
                                                        <StyledFormTypeBox
                                                            onClick={() =>
                                                                setStepTwo(
                                                                    stage,
                                                                )
                                                            }
                                                        >
                                                            {stage}
                                                        </StyledFormTypeBox>
                                                    </Grid>
                                                );
                                            },
                                        )}
                                    </Grid>
                                </Box>
                                <StyledCategoryTitle>
                                    Connections
                                </StyledCategoryTitle>
                                <Box>
                                    <Grid
                                        container
                                        columns={6}
                                        columnGap={2}
                                        rowGap={2}
                                    >
                                        {stepsTwo[
                                            'Connect to an External Database'
                                        ].map((stage, idx) => {
                                            return (
                                                <Grid
                                                    key={idx}
                                                    item
                                                    lg={1}
                                                    md={1}
                                                    xs={1}
                                                    xl={1}
                                                    sm={1}
                                                >
                                                    <StyledFormTypeBox
                                                        onClick={() =>
                                                            setStepTwo(stage)
                                                        }
                                                    >
                                                        {stage}
                                                    </StyledFormTypeBox>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>
                            </Box>
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
