import React, { useEffect } from 'react';
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
} from '@semoss/ui';
import {
    stepsOne,
    stepsTwo,
    IconDBMapper,
} from '../engine-import/forms/formSteps.constants';
import { UploadData } from '../engine-import/forms/UploadData';
import { CopyDatabaseForm } from '../engine-import/forms/CopyDatabaseForm';
import { Search as SearchIcon } from '@mui/icons-material/';
import { BuildDb } from '@/assets/img/BuildDb';
import { ConnectModel } from '@/assets/img/ConnectModel';
import { ConnectDb } from '@/assets/img/ConnectDb';
import { CopyDb } from '@/assets/img/CopyDb';
import { UploadDb } from '@/assets/img/UploadDb';
import { ConnectStorage } from '@/assets/img/ConnectStorage';

import { useImport } from '@/hooks';
import { ImportSpecificPage } from './ImportSpecificPage';
import { ImportConnectionPage } from './ImportConnectionPage';

import { useNavigate, useLocation } from 'react-router-dom';

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

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{
    disabled: boolean;
}>(({ theme, disabled }) => ({
    backgroundColor: disabled ? theme.palette.grey['100'] : 'white',
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

const StyledFormTypeBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{
    disabled: boolean;
}>(({ theme, disabled }) => ({
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
    backgroundColor: disabled ? theme.palette.grey['100'] : 'white',
}));

const StyledSpan = styled('span')({
    '&:hover': {
        cursor: 'pointer',
    },
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
    'Connect to Storage': <ConnectStorage />,
    'Connect to Model': <ConnectModel />,
};

export const ImportPage = () => {
    const [importSearch, setImportSearch] = React.useState('');
    const [search, setSearch] = React.useState('');
    const { steps, activeStep, setSteps } = useImport();

    const navigate = useNavigate();
    const { search: importParams } = useLocation();

    useEffect(() => {
        const paramedStep = {
            title: '',
            description: '',
            data: '',
        };
        switch (importParams) {
            case '':
                break;
            case '?type=database':
                break;
            case '?type=model':
                paramedStep.title = 'Connect to Model';
                paramedStep.description =
                    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
                paramedStep.data = 'Connect to Model';

                setSteps([...steps, paramedStep], steps.length + 1);
                break;
            case '?type=storage':
                paramedStep.title = 'Connect to Storage';
                paramedStep.description =
                    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
                paramedStep.data = 'Connect to Storage';

                setSteps([...steps, paramedStep], steps.length + 1);
                break;
        }
    }, [importParams]);

    return (
        <>
            <Page
                header={
                    <StyledStack>
                        {steps.length ? (
                            <Breadcrumbs separator="/">
                                <StyledSpan
                                    onClick={() => {
                                        setSteps([], -1);
                                        navigate('/import');
                                    }}
                                >
                                    Import
                                </StyledSpan>
                                {steps.map((step, i) => {
                                    return (
                                        <StyledSpan
                                            key={i}
                                            onClick={() => {
                                                const newSteps = [];
                                                for (
                                                    let j = 0;
                                                    j < i + 1;
                                                    j++
                                                ) {
                                                    newSteps.push(steps[j]);
                                                }

                                                setSteps(newSteps, i + 1);
                                            }}
                                        >
                                            {step.title}
                                        </StyledSpan>
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
                            <>
                                <StyledCategoryTitle>
                                    Database
                                </StyledCategoryTitle>
                                <Grid container columns={12} spacing={2}>
                                    {stepsOne.slice(0, 4).map((val, idx) => {
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
                                                        disabled={val.disabled}
                                                        onClick={() => {
                                                            // Document first step
                                                            const stepOne = {
                                                                title: val.name,
                                                                description:
                                                                    val.description,
                                                                data: val.name,
                                                            };

                                                            if (!val.disabled) {
                                                                setSteps(
                                                                    [
                                                                        ...steps,
                                                                        stepOne,
                                                                    ],
                                                                    steps.length +
                                                                        1,
                                                                );
                                                            }
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

                                <StyledCategoryTitle>
                                    Other Options
                                </StyledCategoryTitle>
                                <Grid container columns={12} spacing={2}>
                                    {stepsOne.slice(4, 6).map((val, idx) => (
                                        <Grid
                                            item
                                            key={idx}
                                            xs={3}
                                            lg={3}
                                            md={3}
                                            xl={3}
                                        >
                                            <StyledCard
                                                disabled={val.disabled}
                                                onClick={() => {
                                                    // Document first step
                                                    const stepOne = {
                                                        title: val.name,
                                                        description: '',
                                                        data: val.name,
                                                    };
                                                    setSteps(
                                                        [...steps, stepOne],
                                                        steps.length + 1,
                                                    );
                                                }}
                                            >
                                                <StyledCardContent>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor:
                                                                'transparent',
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
                            </>
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
                                                        stage.name
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
                                                                    disabled={
                                                                        stage.disable
                                                                    }
                                                                    onClick={() => {
                                                                        if (
                                                                            !stage.disable
                                                                        ) {
                                                                            setSteps(
                                                                                [
                                                                                    ...steps,
                                                                                    {
                                                                                        title: stage.name,
                                                                                        description: `Fill out ${stage.name} details in order to work with data`,
                                                                                        data: stage.name,
                                                                                    },
                                                                                ],
                                                                                steps.length +
                                                                                    1,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                        .name
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage.name
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
                                                        stage.name
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
                                                                    disabled={
                                                                        stage.disable
                                                                    }
                                                                    // title={stage}
                                                                    onClick={() => {
                                                                        if (
                                                                            !stage.disable
                                                                        ) {
                                                                            setSteps(
                                                                                [
                                                                                    ...steps,
                                                                                    {
                                                                                        title: stage.name,
                                                                                        description: `Fill out ${stage.name} details in order to connect to datasource`,
                                                                                        data: stage.name,
                                                                                    },
                                                                                ],
                                                                                steps.length +
                                                                                    1,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                        .name
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage.name
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
                                                        stage.name
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
                                                                    disabled={
                                                                        stage.disable
                                                                    }
                                                                    onClick={() => {
                                                                        if (
                                                                            !stage.disable
                                                                        ) {
                                                                            setSteps(
                                                                                [
                                                                                    ...steps,
                                                                                    {
                                                                                        title: stage.name,
                                                                                        description: `Fill out ${stage.name} details in order to add model to catalog`,
                                                                                        data: stage.name,
                                                                                    },
                                                                                ],
                                                                                steps.length +
                                                                                    1,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                        .name
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage.name
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
                                                            stage.name
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
                                                                        disabled={
                                                                            stage.disable
                                                                        }
                                                                        // title={stage}
                                                                        onClick={() => {
                                                                            if (
                                                                                !stage.disable
                                                                            ) {
                                                                                setSteps(
                                                                                    [
                                                                                        ...steps,
                                                                                        {
                                                                                            title: stage.name,
                                                                                            description: `Fill out ${stage.name} details in order to add model to catalog`,
                                                                                            data: stage.name,
                                                                                        },
                                                                                    ],
                                                                                    steps.length +
                                                                                        1,
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <StyledInnerBox>
                                                                            <StyledCardImage
                                                                                src={
                                                                                    IconDBMapper[
                                                                                        stage
                                                                                            .name
                                                                                    ]
                                                                                }
                                                                            />
                                                                            <StyledCardText>
                                                                                {
                                                                                    stage.name
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
                                            Embedded
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
                                                        stage.name
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
                                                                    disabled={
                                                                        stage.disable
                                                                    }
                                                                    // title={stage}
                                                                    onClick={() => {
                                                                        if (
                                                                            !stage.disable
                                                                        ) {
                                                                            setSteps(
                                                                                [
                                                                                    ...steps,
                                                                                    {
                                                                                        title: stage.name,
                                                                                        description: `Fill out ${stage.name} details in order to add model to catalog`,
                                                                                        data: stage.name,
                                                                                    },
                                                                                ],
                                                                                steps.length +
                                                                                    1,
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    <StyledInnerBox>
                                                                        <StyledCardImage
                                                                            src={
                                                                                IconDBMapper[
                                                                                    stage
                                                                                        .name
                                                                                ]
                                                                            }
                                                                        />
                                                                        <StyledCardText>
                                                                            {
                                                                                stage.name
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
                                                            stage.name
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
                                                                        disabled={
                                                                            stage.disable
                                                                        }
                                                                        // title={stage}
                                                                        onClick={() => {
                                                                            if (
                                                                                !stage.disable
                                                                            ) {
                                                                                setSteps(
                                                                                    [
                                                                                        ...steps,
                                                                                        {
                                                                                            title: stage.name,
                                                                                            description: `Fill out ${stage.name} details in order to create new storage`,
                                                                                            data: stage.name,
                                                                                        },
                                                                                    ],
                                                                                    steps.length +
                                                                                        1,
                                                                                );
                                                                            }
                                                                        }}
                                                                    >
                                                                        <StyledInnerBox>
                                                                            <StyledCardImage
                                                                                src={
                                                                                    IconDBMapper[
                                                                                        stage
                                                                                            .name
                                                                                    ]
                                                                                }
                                                                            />
                                                                            <StyledCardText>
                                                                                {
                                                                                    stage.name
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
                    {steps.length === 2 && <ImportSpecificPage />}

                    {/* Step 4 will be the next thing to be shown after form */}
                    {steps.length === 3 && <ImportConnectionPage />}
                </StyledContainer>
            </Page>
        </>
    );
};
