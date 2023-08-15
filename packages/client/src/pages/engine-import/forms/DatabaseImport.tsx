import React from 'react';
import { Page } from '@/components/ui/';
import {
    Avatar,
    Card,
    styled,
    Search,
    Select,
    Typography,
    Box,
    Grid,
    IconButton,
    useNotification,
} from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { FORM_ROUTES } from './forms';
import { stepsOne, stepsTwo } from './formSteps.constants';
import { UploadData } from './UploadData';
import { CopyDatabaseForm } from './CopyDatabaseForm';
import { StorageForm } from './StorageForm';
import { ModelForm } from './ModelForm';
import { useRootStore } from '@/hooks';
import { ArrowBackRounded, Search as SearchIcon } from '@mui/icons-material/';
import { BuildDb } from '@/assets/img/BuildDb';
import { ConnectModel } from '@/assets/img/ConnectModel';
import { ConnectDb } from '@/assets/img/ConnectDb';
import { CopyDb } from '@/assets/img/CopyDb';
import { UploadDb } from '@/assets/img/UploadDb';
import { ConnectStorage } from '@/assets/img/ConnectStorage';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSearchbarContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledSort = styled(Select)(({ theme }) => ({
    width: '20%',
}));

const StyledStack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledCard = styled(Card)(({ theme }) => ({
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledCardHeader = styled(Card.Header)(({ theme }) => ({
    height: theme.spacing(7.75),
    margin: '0px 0px 0px 0px',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    display: 'flex',
    padding: '16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    alignSelf: 'stretch',
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
    maxWidth: '350px',
    maxHeight: '250px',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    display: 'block',
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

const IconMapper = {
    'Connect to Database': <ConnectDb />,
    'Copy Database': <CopyDb />,
    'Upload Database': <UploadDb />,
    'Build Database': <BuildDb />,
    'Add Storage': <ConnectStorage />,
    'Add Model': <ConnectModel />,
};

export const DatabaseImport = () => {
    const [activeStep, setActiveStep] = React.useState(0);
    const [stepOne, setStepOne] = React.useState('');
    const [stepTwo, setStepTwo] = React.useState('');
    const [storageName, setStorageName] = React.useState('');
    const [predictDataTypes, setPredictDataTypes] = React.useState(null);
    const [metamodel, setMetamodel] = React.useState(null);
    const [search, setSearch] = React.useState('');

    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();

    const insightId = configStore.store.insightID;

    const formSubmit = (values) => {
        if (stepOne === 'Add Storage') {
            const pixel = `CreateStorageEngine(storage=["${
                values.storage
            }"], storageDetails=[${JSON.stringify(values.fields)}])`;

            monolithStore.runQuery(pixel).then((response) => {
                const output = response.pixelReturn[0].output,
                    operationType = response.pixelReturn[0].operationType;

                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    return;
                }

                notification.add({
                    color: 'success',
                    message: `Successfully created storage`,
                });

                navigate(`/storage/${output.database_id}`);
            });
            return;
        }

        if (values.METAMODEL_TYPE === 'As Suggested Metamodel') {
            monolithStore
                .uploadFile(values.FILE, insightId)
                .then((res: { fileName: string; fileLocation: string }[]) => {
                    const file = res[0].fileLocation;
                    monolithStore
                        .runQuery(
                            `PredictMetamodel(filePath=["${file}"], delimiter=["${values.DELIMETER}"], rowCount=[false])`,
                        )
                        .then((res) => {
                            const output = res.pixelReturn[0].output;
                            // format response to send to Form
                            setMetamodel(output);
                        });
                });
        }
        if (values.METAMODEL_TYPE === 'As Flat Table') {
            monolithStore
                .uploadFile(values.FILE, insightId)
                .then((res: { fileName: string; fileLocation: string }[]) => {
                    const file = res[0].fileLocation;
                    monolithStore
                        .runQuery(
                            `PredictDataTypes(filePath=["${file}"], delimiter=["${values.DELIMETER}"], rowCount=[false])`,
                        )
                        .then((res) => setPredictDataTypes(res));
                });
        }
    };

    const getForm = (form) => {
        return React.createElement(form.component, {
            submitFunc: formSubmit,
            metamodel: metamodel,
            predictDataTypes: predictDataTypes,
        });
    };

    const handleNavigate = () => {
        if (activeStep === 1) {
            setActiveStep(0);
            setStepOne('');
            setPredictDataTypes(null);
        }
        if (activeStep === 2) {
            if (stepOne === 'Copy Database' || stepOne === 'Upload Database') {
                setActiveStep(0);
            } else {
                setActiveStep(1);
                setStepTwo('');
                setStepOne('');
                setPredictDataTypes(null);
            }
        }
    };

    return (
        <>
            <Page
                header={
                    <StyledStack>
                        {activeStep !== 0 && (
                            <Box>
                                <IconButton onClick={handleNavigate}>
                                    <ArrowBackRounded />
                                </IconButton>
                                Back
                            </Box>
                        )}
                        <Typography variant="h4">
                            {stepOne ? stepOne : 'Add Source'}
                        </Typography>
                        <Typography variant="body1">
                            Add/import new database
                        </Typography>
                    </StyledStack>
                }
            >
                <StyledContainer>
                    <StyledSearchbarContainer>
                        <Search
                            label={'Search'}
                            size={'small'}
                            onChange={(e) => {
                                setSearch(e.target.value);
                            }}
                            placeholder={'Search'}
                            InputProps={{
                                startAdornment: <SearchIcon />,
                            }}
                            sx={{ width: '100%' }}
                        />
                    </StyledSearchbarContainer>
                    <Box sx={{ width: '100%' }}>
                        {activeStep === 0 && (
                            <Grid container columns={12} spacing={2}>
                                {stepsOne.map((val, idx) => (
                                    <Grid
                                        item
                                        key={idx}
                                        xs={3}
                                        lg={3}
                                        md={3}
                                        xl={3}
                                    >
                                        <StyledCard
                                            onClick={() => {
                                                setStepOne(val.name);
                                                if (
                                                    val.name ===
                                                        'Copy Database' ||
                                                    val.name ===
                                                        'Upload Database' ||
                                                    val.name ===
                                                        'Add Storage' ||
                                                    val.name === 'Add Model'
                                                ) {
                                                    setActiveStep(2);
                                                    setStepTwo('');
                                                } else {
                                                    setActiveStep(1);
                                                    setStepTwo('');
                                                }
                                            }}
                                        >
                                            {/* <StyledCardHeader
                                                title={val.name}
                                                titleTypographyProps={{
                                                    variant: 'body1',
                                                }}
                                                avatar={IconMapper[val.name]}
                                            /> */}
                                            <StyledCardContent>
                                                <Avatar
                                                    sx={{
                                                        bgcolor: 'transparent',
                                                    }}
                                                >
                                                    {IconMapper[val.name]}
                                                </Avatar>
                                                <Typography variant="body2">
                                                    {val.name}
                                                </Typography>
                                            </StyledCardContent>
                                        </StyledCard>
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
                                            columnSpacing={2}
                                            rowSpacing={2}
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
                                            columnSpacing={2}
                                            rowSpacing={2}
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
                                                            // title={stage}
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
                                            })}
                                        </Grid>
                                    </Box>
                                    <StyledCategoryTitle>
                                        Storage
                                    </StyledCategoryTitle>
                                    <Box>
                                        <Grid
                                            container
                                            columns={6}
                                            columnSpacing={2}
                                            rowSpacing={2}
                                        >
                                            {stepsTwo['Add Storage'].map(
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
                                                                // title={stage}
                                                                onClick={() => {
                                                                    setStepTwo(
                                                                        'Add Storage',
                                                                    );
                                                                    setStorageName(
                                                                        stage,
                                                                    );
                                                                }}
                                                            >
                                                                {stage}
                                                            </StyledFormTypeBox>
                                                        </Grid>
                                                    );
                                                },
                                            )}
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

                            {activeStep === 2 &&
                                stepOne === 'Upload Database' && <UploadData />}
                            {activeStep === 2 &&
                                stepOne === 'Copy Database' && (
                                    <CopyDatabaseForm />
                                )}
                            {activeStep === 1 && stepTwo === 'Add Storage' && (
                                <StorageForm
                                    submitFunc={(values) => formSubmit(values)}
                                    storageName={storageName}
                                />
                            )}
                            {activeStep === 2 && stepOne === 'Add Storage' && (
                                <StorageForm
                                    submitFunc={(values) => formSubmit(values)}
                                    storageName={''}
                                />
                            )}
                            {activeStep === 2 && stepOne === 'Add Model' && (
                                <ModelForm />
                            )}
                        </StyledBox>
                    )}
                </StyledContainer>
            </Page>
        </>
    );
};
