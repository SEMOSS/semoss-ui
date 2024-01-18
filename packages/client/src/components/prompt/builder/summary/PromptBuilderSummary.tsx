import {
    PROMPT_BUILDER_INPUT_TYPES_STEP,
    SUMMARY_STEPS,
} from '../../prompt.constants';
import { Builder, BuilderStepItem } from '../../prompt.types';
import { grey } from '@mui/material/colors';
import { styled, Avatar, Collapse, Typography, List } from '@semoss/ui';
import { PendingOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { PromptBuilderSummaryStepItem } from './PromptBuilderSummaryStepItem';
import { PromptBuilderSummaryProgress } from './PromptBuilderSummaryProgress';

const StyledListItem = styled(List.Item)(({ theme }) => ({
    backgroundColor: grey[100],
    color: grey[900],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
}));

const StyledCheckCircleOutlined = styled(CheckCircleOutlined)(({ theme }) => ({
    color: theme.palette.primary.main,
    marginTop: '8px',
}));

const StyledListItemTypography = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isStepComplete',
})<{ isStepComplete: boolean }>(({ theme, isStepComplete }) => ({
    color: isStepComplete ? theme.palette.primary.main : grey[900],
    fontWeight: 'bold',
}));

export const PromptBuilderSummary = (props: {
    builder: Builder;
    currentBuilderStep: number;
    isBuilderStepComplete: (step: number) => boolean;
}) => {
    const markBuilderStepComplete = (
        summaryStep: number,
        currentBuilderStep: number,
    ) => {
        if (summaryStep < currentBuilderStep) {
            return true;
        } else {
            return (
                props.isBuilderStepComplete(summaryStep) &&
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
                                (builderStepItem.step ===
                                PROMPT_BUILDER_INPUT_TYPES_STEP
                                    ? props.isBuilderStepComplete(
                                          PROMPT_BUILDER_INPUT_TYPES_STEP,
                                      )
                                    : !!builderStepItem.value))))
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
                <List.ItemText
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
                        <PromptBuilderSummaryProgress
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
                                <StyledCheckCircleOutlined />
                            ) : (
                                <PendingOutlined sx={{ marginTop: '8px' }} />
                            )
                        }
                    >
                        <List.ItemAvatar>
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
                        </List.ItemAvatar>
                        <List.ItemText
                            disableTypography
                            primary={
                                <StyledListItemTypography
                                    variant="subtitle1"
                                    isStepComplete={markBuilderStepComplete(
                                        i + 1,
                                        props.currentBuilderStep,
                                    )}
                                >
                                    {step.title}
                                </StyledListItemTypography>
                            }
                        />
                    </StyledListItem>
                    <Collapse in={props.currentBuilderStep === i + 1}>
                        <PromptBuilderSummaryStepItem
                            builder={props.builder}
                            currentBuilderStep={i + 1}
                        />
                    </Collapse>
                </span>
            ))}
        </List>
    );
};
