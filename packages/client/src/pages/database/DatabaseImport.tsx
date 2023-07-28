import React from 'react';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Paper from '@mui/material/Paper';
import { Page } from '@/components/ui/';
import {
    styled,
    Typography,
    Box,
    Button,
    Stack,
    Divider,
    Menu,
    FileDropzone,
} from '@semoss/ui';

const StyledStack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledBox = styled(Box)({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    width: '100%',
    padding: '24px 16px 16px 16px',
});

const steps = [
    { label: 'Select a starting point', description: '' },
    { label: 'Import file or connect to external database', description: '' },
    { label: 'Enter or upload database information', description: '' },
];

function VerticalLinearStepper(props) {
    const { activeStep, setActiveStep } = props;

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
    };

    return (
        <Box sx={{ maxWidth: 400 }}>
            <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            optional={
                                index === 2 ? (
                                    <Typography variant="caption">
                                        Last step
                                    </Typography>
                                ) : null
                            }
                        >
                            {step.label}
                        </StepLabel>
                        <StepContent>
                            <Typography variant="subtitle1">
                                {step.description}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={handleNext}
                                        sx={{ mt: 1, mr: 1 }}
                                    >
                                        {index === steps.length - 1
                                            ? 'Finish'
                                            : 'Continue'}
                                    </Button>
                                    <Button
                                        disabled={index === 0}
                                        onClick={handleBack}
                                        sx={{ mt: 1, mr: 1 }}
                                    >
                                        Back
                                    </Button>
                                </div>
                            </Box>
                        </StepContent>
                    </Step>
                ))}
            </Stepper>
            {activeStep === steps.length && (
                <Paper square elevation={0} sx={{ p: 3 }}>
                    <Typography variant="subtitle1">
                        All steps completed - you&apos;re finished
                    </Typography>
                    <Button onClick={handleReset} sx={{ mt: 1, mr: 1 }}>
                        Reset
                    </Button>
                </Paper>
            )}
        </Box>
    );
}

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
];

const stepsTwo = [
    {
        ['Drag and Drop Data']: [
            'CSV',
            'Excel',
            'TSV',
            'SQLite',
            'H2',
            'Neo4J',
            'Tinker',
        ],
    },
    {
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
    },
];

export const DatabaseImport = () => {
    const [activeStep, setActiveStep] = React.useState(0);
    const [stepOne, setStepOne] = React.useState('');
    const [stepTwo, setStepTwo] = React.useState('');

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
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                    <Box>
                        <VerticalLinearStepper
                            activeStep={activeStep}
                            setActiveStep={setActiveStep}
                        />
                    </Box>
                    <StyledBox>
                        <Stack>
                            {activeStep === 0 &&
                                stepsOne.map((val, idx) => (
                                    <>
                                        <Menu.Item
                                            key={idx}
                                            value={val}
                                            onClick={() => {
                                                setStepOne(val);
                                                if (
                                                    val === 'Copy Database' ||
                                                    val === 'Upload Database'
                                                ) {
                                                    setActiveStep(2);
                                                } else {
                                                    setActiveStep(1);
                                                }
                                            }}
                                        >
                                            {val}
                                        </Menu.Item>
                                        <Divider />
                                    </>
                                ))}
                            {activeStep === 1 &&
                                stepsTwo.map((val, idx) => {
                                    const [first] = Object.keys(val);
                                    return (
                                        <Box key={idx}>
                                            {stepOne === first &&
                                                val[first].map((value) => {
                                                    return (
                                                        <>
                                                            <Menu.Item
                                                                value={value}
                                                                key={value}
                                                                onClick={() => {
                                                                    setStepTwo(
                                                                        value,
                                                                    );
                                                                }}
                                                            >
                                                                {value}
                                                            </Menu.Item>
                                                            <Divider />
                                                        </>
                                                    );
                                                })}
                                        </Box>
                                    );
                                })}
                            {activeStep === 2 &&
                                stepOne === 'Upload Database' && <UploadData />}
                        </Stack>
                    </StyledBox>
                </Box>
            </Page>
        </>
    );
};
