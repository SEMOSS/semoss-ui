import React from 'react';
import { Page } from '@/components/ui/';
import { styled, Typography, Box, Grid, IconButton } from '@semoss/ui';
import { FORM_ROUTES } from './forms';
import { stepsOne, stepsTwo } from './formSteps.constants';
import { UploadData } from './UploadData';
import { CopyDatabaseForm } from './CopyDatabaseForm';
import { ArrowBackRounded } from '@mui/icons-material/';

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

export const DatabaseImport = () => {
    const [activeStep, setActiveStep] = React.useState(0);
    const [stepOne, setStepOne] = React.useState('');
    const [stepTwo, setStepTwo] = React.useState('');

    const formSubmit = (values) => {
        console.log(values);
    };

    const getForm = (form) => {
        return React.createElement(form.component, { submitFunc: formSubmit });
    };

    const handleNavigate = () => {
        if (activeStep === 1) {
            setActiveStep(0);
            setStepOne('');
        }
        if (activeStep === 2) {
            setActiveStep(1);
            setStepTwo('');
            setStepOne('');
        }
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
                        {activeStep !== 0 && (
                            <Box>
                                <IconButton onClick={handleNavigate}>
                                    <ArrowBackRounded />
                                </IconButton>
                                Back
                            </Box>
                        )}
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
