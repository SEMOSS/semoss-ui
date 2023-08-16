import React from 'react';
import { Page } from '@/components/ui/';
import {
    Avatar,
    Breadcrumbs,
    Card,
    styled,
    Search,
    Typography,
    Box,
    Grid,
    useNotification,
} from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { FORM_ROUTES } from './forms';
import { stepsOne, stepsTwo, IconDBMapper } from './formSteps.constants';
import { UploadData } from './UploadData';
import { CopyDatabaseForm } from './CopyDatabaseForm';
import { StorageForm } from './StorageForm';
import { ModelForm } from './ModelForm';
import { useRootStore } from '@/hooks';
import { Search as SearchIcon } from '@mui/icons-material/';
import { BuildDb } from '@/assets/img/BuildDb';
import { ConnectModel } from '@/assets/img/ConnectModel';
import { ConnectDb } from '@/assets/img/ConnectDb';
import { CopyDb } from '@/assets/img/CopyDb';
import { UploadDb } from '@/assets/img/UploadDb';
import { ConnectStorage } from '@/assets/img/ConnectStorage';

import { useImport } from '@/hooks';

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

const StyledStack = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
}));

const StyledCard = styled(Card)(() => ({
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledCardContent = styled(Card.Content)(() => ({
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
    padding: '16px 16px 16px 16px',
    marginBottom: '32px',
});

const StyledInnerBox = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const StyledCardImage = styled('img')({
    display: 'flex',
    height: '30px',
    width: '30px',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',
    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    // aspectRatio: '1/1'
});

const StyledCardText = styled('p')({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: '0',
});

const StyledFormTypeBox = styled(Box)({
    maxWidth: '215px',
    maxHeight: '75px',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'block',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid rgba(0,0,0,0.1)',
    padding: '16px 24px',
    boxShadow: '0px 5px 22px 0px rgba(0,0,0,0.04)',
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

    const [importSearch, setImportSearch] = React.useState('');
    const [search, setSearch] = React.useState('');

    const { configStore, monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();

    const insightId = configStore.store.insightID;

    const { steps, addStep, removeStep, switchStep } = useImport();

    /**
     *
     * @param values
     * @returns
     * @desc this is doing a number of different things,
     * We will have to wrap this component in a context, in order to give each
     * component access to the number of things that are needed
     */
    const formSubmit = async (values) => {
        /** Storage: START */
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
        /** Storage: END */

        /** Connect to External: START */
        // I'll be hitting this reactor if dbDriver is in RDBMSTypeEnum on BE
        if (values.type === 'connect') {
            const pixel = `ExternalJdbcTablesAndViews(conDetails=[
                ${JSON.stringify(values.conDetails)}
            ])`;

            const resp = await monolithStore.runQuery(pixel);
            const output = resp.pixelReturn[0].output,
                operationType = resp.pixelReturn[0].operationType;

            if (operationType.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });
            } else {
                setMetamodel(output);
            }
            return;
        }
        /** Connect to External: END */

        /** Drag and Drop: START */
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
        /** Drag and Drop: END */
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

    console.log(steps);

    return (
        <>
            <Page
                header={
                    <StyledStack>
                        {steps.length ? (
                            <Breadcrumbs separator="/">
                                <span
                                    onClick={() => {
                                        switchStep(0);
                                    }}
                                >
                                    Import
                                </span>
                                {steps.map((step, i) => {
                                    return (
                                        <span
                                            key={i}
                                            onClick={() => {
                                                switchStep(i + 1);
                                            }}
                                        >
                                            {step.title}
                                        </span>
                                    );
                                })}
                            </Breadcrumbs>
                        ) : (
                            <div>&nbsp;</div>
                        )}
                        <Typography variant="h4">
                            {steps.length
                                ? steps[steps.length - 1].title
                                : 'Add Source'}
                        </Typography>
                        <Typography variant="body1">
                            {steps.length
                                ? steps[steps.length - 1].description
                                : "Welcome to our integrated data nexus, your gateway to a world of interconnected possibilities. This page empowers you with the freedom to effortlessly connect to diverse databases, wield versatile storage solutions, and tap into the transformative capabilities of Large Language Models (LLMs). Whether you're a developer, analyst, or visionary, our platform serves as a springboard for unified data orchestration, innovation, and insights."}
                        </Typography>
                    </StyledStack>
                }
            >
                <StyledContainer>
                    {steps.length < 1 ? (
                        <StyledSearchbarContainer>
                            <Search
                                label={'Search'}
                                size={'small'}
                                value={importSearch}
                                onChange={(e) => {
                                    setImportSearch(e.target.value);
                                }}
                                placeholder={'Search'}
                                InputProps={{
                                    startAdornment: <SearchIcon />,
                                }}
                                sx={{ width: '100%' }}
                            />
                        </StyledSearchbarContainer>
                    ) : null}
                    {steps.length === 1 &&
                        steps[0].title !== 'Copy Database' &&
                        steps[0].title !== 'Upload Database' && (
                            <StyledSearchbarContainer>
                                <Search
                                    label={'Search'}
                                    size={'small'}
                                    value={search}
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
                        )}
                    {steps.length < 1 && (
                        <Box sx={{ width: '100%' }}>
                            <Grid container columns={12} spacing={2}>
                                {stepsOne.map((val, idx) => {
                                    if (
                                        val.name
                                            .toLowerCase()
                                            .includes(
                                                importSearch.toLowerCase(),
                                            )
                                    ) {
                                        return (
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
                                                        // Document first step
                                                        const stepOne = {
                                                            title: val.name,
                                                            description:
                                                                val.description,
                                                            data: val.name,
                                                        };

                                                        addStep(stepOne);
                                                    }}
                                                >
                                                    <StyledCardContent>
                                                        <Avatar
                                                            sx={{
                                                                bgcolor:
                                                                    'transparent',
                                                            }}
                                                        >
                                                            {
                                                                IconMapper[
                                                                    val.name
                                                                ]
                                                            }
                                                        </Avatar>
                                                        <Typography variant="body2">
                                                            {val.name}
                                                        </Typography>
                                                    </StyledCardContent>
                                                </StyledCard>
                                            </Grid>
                                        );
                                    }
                                })}
                            </Grid>
                        </Box>
                    )}
                    {/* Selection for options that require more info */}
                    {steps.length === 1 &&
                        steps[0].title !== 'Copy Database' &&
                        steps[0].title !== 'Upload Database' && (
                            <Box sx={{ width: '100%' }}>
                                {/* Database Options */}
                                {steps[0].title
                                    .toLowerCase()
                                    .includes('database') && (
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
                                                {stepsTwo[
                                                    'Drag and Drop Data'
                                                ].map((stage, idx) => {
                                                    if (
                                                        stage
                                                            .toLowerCase()
                                                            .includes(
                                                                search.toLowerCase(),
                                                            )
                                                    ) {
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
                                                                    onClick={() => {
                                                                        addStep(
                                                                            {
                                                                                title: stage,
                                                                                description: `Fill out ${stage} details in order to work with data`,
                                                                                data: stage,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage
                                                                            }
                                                                        </StyledCardText>
                                                                    </StyledInnerBox>
                                                                </StyledFormTypeBox>
                                                            </Grid>
                                                        );
                                                    }
                                                })}
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
                                                    if (
                                                        stage
                                                            .toLowerCase()
                                                            .includes(
                                                                search.toLowerCase(),
                                                            )
                                                    ) {
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
                                                                        addStep(
                                                                            {
                                                                                title: stage,
                                                                                description: `Fill out ${stage} details in order to connect to datasource`,
                                                                                data: stage,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage
                                                                            }
                                                                        </StyledCardText>
                                                                    </StyledInnerBox>
                                                                </StyledFormTypeBox>
                                                            </Grid>
                                                        );
                                                    }
                                                })}
                                            </Grid>
                                        </Box>
                                    </Box>
                                )}

                                {/* Model Options */}
                                {steps[0].title
                                    .toLowerCase()
                                    .includes('model') && (
                                    <Box>
                                        <StyledCategoryTitle>
                                            Commercially Hosted
                                        </StyledCategoryTitle>
                                        <Box>
                                            <Grid
                                                container
                                                columns={6}
                                                columnSpacing={2}
                                                rowSpacing={2}
                                            >
                                                {stepsTwo[
                                                    'Commercial Models'
                                                ].map((stage, idx) => {
                                                    if (
                                                        stage
                                                            .toLowerCase()
                                                            .includes(
                                                                search.toLowerCase(),
                                                            )
                                                    ) {
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
                                                                        addStep(
                                                                            {
                                                                                title: stage,
                                                                                description: `Fill out ${stage} details in order to create new storage`,
                                                                                data: stage,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage
                                                                            }
                                                                        </StyledCardText>
                                                                    </StyledInnerBox>
                                                                </StyledFormTypeBox>
                                                            </Grid>
                                                        );
                                                    }
                                                })}
                                            </Grid>
                                        </Box>
                                        <StyledCategoryTitle>
                                            Locally Hosted
                                        </StyledCategoryTitle>
                                        <Box>
                                            <Grid
                                                container
                                                columns={6}
                                                columnSpacing={2}
                                                rowSpacing={2}
                                            >
                                                {stepsTwo['Local Models'].map(
                                                    (stage, idx) => {
                                                        if (
                                                            stage
                                                                .toLowerCase()
                                                                .includes(
                                                                    search.toLowerCase(),
                                                                )
                                                        ) {
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
                                                                            addStep(
                                                                                {
                                                                                    title: stage,
                                                                                    description: `Fill out ${stage} details in order to create new storage`,
                                                                                    data: stage,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        <StyledInnerBox>
                                                                            <StyledCardImage
                                                                                src={
                                                                                    IconDBMapper[
                                                                                        stage
                                                                                    ]
                                                                                }
                                                                            />
                                                                            <StyledCardText>
                                                                                {
                                                                                    stage
                                                                                }
                                                                            </StyledCardText>
                                                                        </StyledInnerBox>
                                                                    </StyledFormTypeBox>
                                                                </Grid>
                                                            );
                                                        }
                                                    },
                                                )}
                                            </Grid>
                                        </Box>

                                        <StyledCategoryTitle>
                                            Embeded
                                        </StyledCategoryTitle>
                                        <Box>
                                            <Grid
                                                container
                                                columns={6}
                                                columnSpacing={2}
                                                rowSpacing={2}
                                            >
                                                {stepsTwo[
                                                    'Embedded Models'
                                                ].map((stage, idx) => {
                                                    if (
                                                        stage
                                                            .toLowerCase()
                                                            .includes(
                                                                search.toLowerCase(),
                                                            )
                                                    ) {
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
                                                                        addStep(
                                                                            {
                                                                                title: stage,
                                                                                description: `Fill out ${stage} details in order to create new storage`,
                                                                                data: stage,
                                                                            },
                                                                        );
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage
                                                                            }
                                                                        </StyledCardText>
                                                                    </StyledInnerBox>
                                                                </StyledFormTypeBox>
                                                            </Grid>
                                                        );
                                                    }
                                                })}
                                            </Grid>
                                        </Box>
                                    </Box>
                                )}
                                {/* Storage Options */}
                                {steps[0].title
                                    .toLowerCase()
                                    .includes('storage') && (
                                    <Box>
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
                                                        if (
                                                            stage
                                                                .toLowerCase()
                                                                .includes(
                                                                    search.toLowerCase(),
                                                                )
                                                        ) {
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
                                                                            addStep(
                                                                                {
                                                                                    title: stage,
                                                                                    description: `Fill out ${stage} details in order to create new storage`,
                                                                                    data: stage,
                                                                                },
                                                                            );
                                                                        }}
                                                                    >
                                                                        <StyledInnerBox>
                                                                            <StyledCardImage
                                                                                src={
                                                                                    IconDBMapper[
                                                                                        stage
                                                                                    ]
                                                                                }
                                                                            />
                                                                            <StyledCardText>
                                                                                {
                                                                                    stage
                                                                                }
                                                                            </StyledCardText>
                                                                        </StyledInnerBox>
                                                                    </StyledFormTypeBox>
                                                                </Grid>
                                                            );
                                                        }
                                                    },
                                                )}
                                            </Grid>
                                        </Box>
                                    </Box>
                                )}
                            </Box>
                        )}

                    {/* Step 2 Show Form for Copy and Upload */}
                    {steps.length === 1 &&
                        (steps[0].title === 'Copy Database' ||
                            steps[0].title === 'Upload Database') && (
                            <StyledBox>
                                {steps[0].title === 'Copy Database' ? (
                                    <UploadData />
                                ) : (
                                    <CopyDatabaseForm />
                                )}
                            </StyledBox>
                        )}

                    {/* Step 3 will be the form */}
                    {steps.length === 2 && (
                        <StyledBox>
                            {steps[0].title === 'Add Model' ? (
                                <ModelForm
                                // submitFunc={(vals) => formSubmit(vals)}
                                />
                            ) : steps[0].title === 'Add Storage' ? (
                                <StorageForm
                                    submitFunc={(vals) => formSubmit(vals)}
                                />
                            ) : (
                                // 'Connect to Database'
                                FORM_ROUTES.map((f) => {
                                    if (f.name === steps[1].title) {
                                        return getForm(f);
                                    }
                                })
                            )}
                        </StyledBox>
                    )}

                    {/* Step 4 will be metamodeling or predicting data types */}
                    {steps.length === 3 && <div>Metamodel</div>}
                </StyledContainer>
            </Page>
        </>
    );
};
