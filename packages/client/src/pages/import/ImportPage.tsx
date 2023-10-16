/**
 * Page Documentation (10/10/2023)
 *
 * Different Connection types:
 * Model(LLM), Vector Databases, Functions, Traditional Dbs, Storage
 *
 * Steps and (props...) from the useImport hook will give you the steps that
 * have been completed through the selection process.
 *
 * Steps is important for this page as based on the step in the process you will
 * see different steps in the connection process for all engines
 *
 * TODO seperate links: Just seperate the steps into
 * - /import
 * - /import/model
 * - /import/model/OpenAi
 */

import React, { useEffect, useRef } from 'react';
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
import { stepsOne } from './import.constants';

import { UploadData } from '../../components/import/refactor/UploadData';
import { CopyDatabaseForm } from '../../components/import/refactor/CopyDatabaseForm';
import { Search as SearchIcon } from '@mui/icons-material/';
import { BuildDb } from '@/assets/img/BuildDb';
import { ConnectModel } from '@/assets/img/ConnectModel';
import { ConnectDb } from '@/assets/img/ConnectDb';
import { CopyDb } from '@/assets/img/CopyDb';
import { UploadDb } from '@/assets/img/UploadDb';
import { ConnectStorage } from '@/assets/img/ConnectStorage';

import { useImport } from '@/hooks';

import { EstablishConnectionPage, ImportConnectionPage } from './';

import { useNavigate, useLocation } from 'react-router-dom';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: 'auto',
    flexDirection: 'column',
    alignItems: 'flex-start',
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
}>(({ theme, disabled }) => {
    const palette = theme.palette as unknown as {
        primary: Record<string, string>;
        primaryContrast: Record<string, string>;
    };

    return {
        backgroundColor: disabled ? theme.palette.grey['100'] : 'white',
        '&:hover': {
            boxShadow: disabled
                ? '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)'
                : `0px 5px 22px 0px ${palette.primaryContrast['shadow']}`,
            cursor: 'pointer',
        },
    };
});
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
}>(({ theme, disabled }) => {
    const palette = theme.palette as unknown as {
        primary: Record<string, string>;
        primaryContrast: Record<string, string>;
    };

    return {
        maxWidth: '215px',
        maxHeight: '75px',
        borderRadius: '12px',
        cursor: 'pointer',
        display: 'block',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid rgba(0,0,0,0.1)',
        padding: '16px 24px',
        boxShadow:
            '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)',
        backgroundColor: disabled ? theme.palette.grey['100'] : 'white',

        '&:hover': {
            cursor: 'pointer',
            boxShadow: disabled
                ? '0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)'
                : `0px 5px 22px 0px ${palette.primaryContrast['shadow']}`,
        },
    };
});

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
    'Build Database': <BuildDb />,
    'Connect to Storage': <ConnectStorage />,
    'Connect to Model': <ConnectModel />,
    'Connect to Vector Database': <ConnectStorage />,
    'Connect to Function': <ConnectModel />,
    // 'Upload Database': <UploadDb />,
};

export const ImportPage = () => {
    const [importSearch, setImportSearch] = React.useState('');
    const [search, setSearch] = React.useState('');
    const { steps, activeStep, setSteps, CONNECTION_OPTIONS } = useImport();

    const scrollToTopRef = useRef(null);

    const navigate = useNavigate();
    const { search: importParams } = useLocation();

    useEffect(() => {
        const paramedStep = {
            title: '',
            description: '',
            data: '',
        };

        // Based on where you came from in application, we can skip first step in connection process
        switch (importParams) {
            case '':
                break;
            case '?type=database':
                break;
            case '?type=model':
                paramedStep.title = 'Connect to Model';
                paramedStep.description =
                    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
                paramedStep.data = 'MODEL';

                setSteps([...steps, paramedStep], steps.length + 1);
                break;
            case '?type=vector':
                paramedStep.title = 'Connect to Vector Database';
                paramedStep.description =
                    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
                paramedStep.data = 'VECTOR';

                setSteps([...steps, paramedStep], steps.length + 1);
                break;
            case '?type=function':
                paramedStep.title = 'Connect to Function';
                paramedStep.description =
                    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
                paramedStep.data = 'FUNCTION';

                setSteps([...steps, paramedStep], steps.length + 1);
                break;
            case '?type=storage':
                paramedStep.title = 'Connect to Storage';
                paramedStep.description =
                    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
                paramedStep.data = 'STORAGE';

                setSteps([...steps, paramedStep], steps.length + 1);
                break;
        }
    }, [importParams]);

    useEffect(() => {
        const scrollIntoView = () => {
            if (scrollToTopRef.current) {
                scrollToTopRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'start',
                });
            }
        };

        const delayScroll = () => {
            setTimeout(scrollIntoView, 100); // 5000 milliseconds = 5 seconds
        };

        delayScroll(); // Trigger the delayed scroll when the component mounts
    }, [steps.length]);

    return (
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
                                            for (let j = 0; j < i + 1; j++) {
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
                {/* Search First Step: TODO - only one search */}
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

                {/* Search Second Step: TODO - only one search */}
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

                {/*  When Step changes scroll top into view */}
                <div ref={scrollToTopRef} style={{ height: '0px' }}>
                    &nbsp;
                </div>
                {/* Step 1: is determination which engine you would like to connect to */}
                {steps.length < 1 && (
                    <Box sx={{ width: '100%' }}>
                        <>
                            <StyledCategoryTitle>Database</StyledCategoryTitle>
                            <Grid container columns={12} spacing={2}>
                                {stepsOne.slice(0, 3).map((val, idx) => {
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
                                                            data: val.data,
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
                                {stepsOne.slice(3, 7).map((val, idx) => (
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
                                                    data: val.data,
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
                        </>
                    </Box>
                )}
                {/* Step 2a: Selection for options that require more info */}
                {/* This is shared between vector, function, database, model and storage */}
                {steps.length === 1 &&
                    steps[0].title !== 'Copy Database' &&
                    steps[0].title !== 'Upload Database' && (
                        <Box sx={{ width: '100%' }}>
                            {Object.entries(
                                CONNECTION_OPTIONS[steps[0].data],
                            ).map((kv: [string, any[]], i) => {
                                // TODO FIX ANY TYPE
                                return (
                                    <Box key={i}>
                                        <StyledCategoryTitle>
                                            {kv[0]}
                                        </StyledCategoryTitle>

                                        <Box>
                                            <Grid
                                                container
                                                columns={6}
                                                columnSpacing={2}
                                                rowSpacing={2}
                                            >
                                                {kv[1].map((stage, idx) => {
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
                                                                                        id: `${kv[0]}.${stage.name}`,
                                                                                        title: stage.name,
                                                                                        description: `Fill out ${
                                                                                            stage.name
                                                                                        } details in order to add ${steps[0].data.toLowerCase()} to catalog`,
                                                                                        data: stage.fields,
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
                                                                                stage.icon
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
                                );
                            })}
                        </Box>
                    )}

                {/* Step 2b: Show Form for Copy and Upload ( this is only a 2-step process) */}
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

                {/* Step 3:  Will be the form to capture specific engine connection details */}
                {steps.length === 2 && <ImportConnectionPage />}
                {/* Let's call this ImportConnectionPage */}

                {/* Step 4: If there is a step in the process after inputting connection details: metamodel for example */}
                {steps.length === 3 && <EstablishConnectionPage />}
                {/* Lets call this EstablishedConnectionPage */}
            </StyledContainer>
        </Page>
    );
};
