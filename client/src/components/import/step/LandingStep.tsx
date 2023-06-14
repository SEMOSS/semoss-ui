import { styled, Button, Grid } from '@semoss/components';
import { Card } from '@/components/ui';
import { theme } from '@/theme';
import { StepConfig, StepComponent } from './step.types';
import { useState } from 'react';
import { CONNECTORS } from '@/constants';
import CSV from '@/assets/img/CSV.svg';
import Excel from '@/assets/img/EXCEL.png';
import TSV from '@/assets/img/TSV.svg';
import SQLite from '@/assets/img/SQLITE.png';
import H2 from '@/assets/img/H2_DB.png';
import Neo4J from '@/assets/img/NEO4J.png';
import Tinker from '@/assets/img/TINKER.png';
import Copy from '@/assets/img/copy.svg';

export interface LandingStepConfig extends StepConfig {
    id: string;
    data: {
        type?: string;
    };
}
const StyledLandingStep = styled('div', {
        padding: theme.space['4'],
    }),
    StyledGrid = styled(Grid, {
        flex: 1,
        overflow: 'hidden',
    }),
    StyledCard = styled(Card, {
        height: 200,
    }),
    StyledCardImage = styled('img', {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        padding: 10,
    }),
    images: { name: string; image: string; value?: string }[] = [
        {
            name: 'CSV',
            image: CSV,
        },
        {
            name: 'Excel',
            image: Excel,
        },
        {
            name: 'TSV',
            image: TSV,
        },
        {
            name: 'SQLite',
            image: SQLite,
        },
        {
            name: 'H2',
            image: H2,
        },
        {
            name: 'Neo4J',
            image: Neo4J,
        },
        {
            name: 'Tinker',
            image: Tinker,
        },
        {
            name: 'Copy Database',
            image: Copy,
        },
    ];
for (const c in CONNECTORS) {
    images.push({
        name: CONNECTORS[c].name,
        image: CONNECTORS[c].image,
        value: CONNECTORS[c].driver,
    });
}

const _LandingStep: StepComponent<LandingStepConfig> = ({
    stepIdx,
    step,
    updateStep,
    navigateStep,
    updateSteps,
}) => {
    const [type, setType] = useState(step.data.type);
    return (
        <StyledLandingStep>
            Welcome to the Landing Page
            <br />
            Selected {type}
            <br />
            <StyledGrid gutterX={theme.space['8']}>
                {images.map((imageObj, idx) => {
                    const { name, image } = imageObj;
                    return (
                        <Grid.Item
                            key={idx}
                            responsive={{
                                sm: 12,
                                md: 6,
                                lg: 4,
                                xl: 3,
                            }}
                        >
                            <StyledCard>
                                <Card.Content stretch={true}>
                                    <StyledCardImage
                                        src={image}
                                        onClick={() => {
                                            console.log(imageObj);
                                            console.log(type);
                                            setType(name);
                                        }}
                                    />
                                </Card.Content>
                            </StyledCard>
                        </Grid.Item>
                    );
                })}
            </StyledGrid>
            <Button
                disabled={!type}
                onClick={() => {
                    // update the actual step information
                    console.log(type);

                    const steps = updateStep({
                        data: { type: type },
                    });
                    let next;
                    if (type === 'CSV') {
                        next = {
                            id: 'file-upload',
                            data: {
                                files: [],
                                delimiter: ',',
                                extensions: ['csv'],
                                databaseType: '',
                                metamodelType: '',
                                customUri: '',
                                tinkerType: '',
                                propFiles: [],
                                type: type,
                            },
                            name: `Upload ${type}`,
                        };
                    } else if (type === 'TSV') {
                        next = {
                            id: 'file-upload',
                            data: {
                                files: [],
                                delimiter: ',',
                                extensions: ['csv'],
                            },
                            name: `Upload ${type}`,
                        };
                    } else if (type === 'Excel') {
                        next = {
                            id: 'file-upload',
                            data: { files: [] },
                            name: `Upload ${type}`,
                        };
                    } else if (type === 'SQL SERVER') {
                        next = {
                            id: 'external-connection',
                            data: { files: [] },
                            name: 'Connect to SQL Server',
                        };
                    }

                    if (!next) {
                        return;
                    }

                    // update the steps
                    updateSteps([...steps.slice(0, stepIdx + 1), next]);
                    // navigate to the next one
                    navigateStep(stepIdx + 1);
                }}
            >
                Next
            </Button>
        </StyledLandingStep>
    );
};

_LandingStep.config = {
    id: 'landing',
    data: {
        type: '',
    },
};

export { _LandingStep as LandingStep };
