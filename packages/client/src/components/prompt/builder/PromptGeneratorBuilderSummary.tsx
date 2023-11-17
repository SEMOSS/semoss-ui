import { SUMMARY_STEPS } from '../prompt.constants';
import { Builder, BuilderStepItem } from '../prompt.types';
import { grey } from '@mui/material/colors';
import {
    styled,
    Avatar,
    Box,
    Collapse,
    LinearProgress,
    LinearProgressProps,
    Typography,
} from '@semoss/ui';
import { List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { PendingOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { PromptGeneratorBuilderSummaryStepItem } from './PromptGeneratorBuilderSummaryStepItem';

const StyledListItem = styled(ListItem)(({ theme }) => ({
    backgroundColor: grey[100],
    color: grey[900],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
}));

const FlexBox = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
}));

interface BuilderSummaryProps {
    builder: Builder;
    currentBuilderStep: number;
}

function PromptGeneratorBuilderSummaryProgress(
    props: LinearProgressProps & { progress: number },
) {
    return (
        <FlexBox>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={props.progress} />
            </Box>
            <Box>
                <Typography variant="body2">{`${Math.round(
                    props.progress,
                )}%`}</Typography>
            </Box>
        </FlexBox>
    );
}

export function PromptGeneratorBuilderSummary(props: BuilderSummaryProps) {
    // step is complete if all the required step items have values
    const isBuilderStepComplete = (summaryStep) => {
        return Object.values(props.builder)
            .filter((builderStepItem: BuilderStepItem) => {
                return (
                    builderStepItem.step === summaryStep &&
                    builderStepItem.required
                );
            })
            .every(
                (builderStepItem: BuilderStepItem) => !!builderStepItem.value,
            );
    };

    const markBuilderStepComplete = (summaryStep, currentBuilderStep) => {
        if (summaryStep < currentBuilderStep) {
            return true;
        } else {
            return (
                isBuilderStepComplete(summaryStep) &&
                summaryStep <= currentBuilderStep
            );
        }
    };

    // don't count optional step items as part of overall completion until the step is active
    const builderProgress = () => {
        const builderArray = Object.values(props.builder);
        const completedStepsToCount = builderArray.filter(
            (builderStepItem: BuilderStepItem) => {
                return (
                    builderStepItem.step < props.currentBuilderStep ||
                    (builderStepItem.step === props.currentBuilderStep &&
                        (!builderStepItem.required ||
                            (builderStepItem.required &&
                                !!builderStepItem.value)))
                );
            },
        );
        return builderArray.length === completedStepsToCount.length
            ? 100
            : Math.round(100 / builderArray.length) *
                  completedStepsToCount.length;
    };

    return (
        <List component="nav">
            <StyledListItem>
                <ListItemText
                    disableTypography
                    primary={
                        <Typography
                            variant="subtitle2"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                        >
                            Overall Completion
                        </Typography>
                    }
                    secondary={
                        <PromptGeneratorBuilderSummaryProgress
                            progress={builderProgress()}
                        />
                    }
                />
            </StyledListItem>

            {Array.from(SUMMARY_STEPS, (step: { title; icon }, i) => (
                <span key={i + 1}>
                    <StyledListItem
                        secondaryAction={
                            markBuilderStepComplete(
                                i + 1,
                                props.currentBuilderStep,
                            ) ? (
                                <CheckCircleOutlined
                                    color="primary"
                                    sx={{ marginTop: '8px' }}
                                />
                            ) : (
                                <PendingOutlined sx={{ marginTop: '8px' }} />
                            )
                        }
                    >
                        <ListItemAvatar>
                            <Avatar
                                sx={{
                                    backgroundColor: 'white',
                                    color: markBuilderStepComplete(
                                        i + 1,
                                        props.currentBuilderStep,
                                    )
                                        ? 'primary.main'
                                        : grey[900],
                                }}
                            >
                                <step.icon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={step.title}
                            primaryTypographyProps={{
                                fontWeight: 'bold',
                                color: markBuilderStepComplete(
                                    i + 1,
                                    props.currentBuilderStep,
                                )
                                    ? 'primary'
                                    : grey[900],
                            }}
                        />
                    </StyledListItem>
                    <Collapse in={props.currentBuilderStep === i + 1}>
                        <PromptGeneratorBuilderSummaryStepItem
                            builder={props.builder}
                            currentBuilderStep={i + 1}
                        />
                    </Collapse>
                </span>
            ))}
        </List>
    );
}
