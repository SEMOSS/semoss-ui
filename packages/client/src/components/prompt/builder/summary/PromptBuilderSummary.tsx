import {
    PROMPT_BUILDER_INPUT_TYPES_STEP,
    PROMPT_BUILDER_PREVIEW_STEP,
    SUMMARY_STEPS,
} from '../../prompt.constants';
import { Builder, BuilderStepItem } from '../../prompt.types';
import { styled, Avatar, Collapse, Typography, List } from '@semoss/ui';
import { PendingOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { PromptBuilderSummaryStepItem } from './PromptBuilderSummaryStepItem';
import { PromptBuilderSummaryProgress } from './PromptBuilderSummaryProgress';

const StyledListItem = styled(List.Item)(({ theme }) => ({
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
}));

const StyledStepListItem = styled(StyledListItem, {
    shouldForwardProp: (prop) =>
        prop !== 'disabled' && prop !== 'isStepComplete',
})<{ disabled?: boolean; isStepComplete?: boolean }>(
    ({ theme, disabled, isStepComplete }) => ({
        color: disabled
            ? theme.palette.grey[400]
            : isStepComplete
            ? theme.palette.primary.main
            : theme.palette.grey[900],

        '&:hover': {
            cursor: !disabled ? 'pointer' : 'inherit',
        },
    }),
);

const StyledAvatar = styled(Avatar)(() => ({
    backgroundColor: 'white',
    color: 'inherit',
}));

const StyledCheckCircleOutlined = styled(CheckCircleOutlined)(({ theme }) => ({
    color: theme.palette.primary.main,
    marginTop: '8px',
}));

const StyledListItemTypography = styled(Typography)(() => ({
    color: 'inherit',
    fontWeight: 'bold',
}));

export const PromptBuilderSummary = (props: {
    builder: Builder;
    currentBuilderStep: number;
    isBuilderStepComplete: (step: number) => boolean;
    isBuildStepsComplete: () => boolean;
    changeBuilderStep: (step: number) => void;
}) => {
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

            {Array.from(SUMMARY_STEPS, (step: { title; icon }, i) => {
                let isStepComplete = props.isBuilderStepComplete(i + 1);
                let disabled =
                    i + 1 > props.currentBuilderStep && !isStepComplete;

                // Preview Step, depends on completion of other steps
                if (i === PROMPT_BUILDER_PREVIEW_STEP - 1) {
                    const completedSteps = props.isBuildStepsComplete();
                    disabled = !completedSteps;
                    isStepComplete = false;
                }

                return (
                    <span
                        key={i + 1}
                        onClick={() => {
                            if (!disabled) {
                                props.changeBuilderStep(i + 1);
                            }
                        }}
                    >
                        <StyledStepListItem
                            disabled={disabled}
                            isStepComplete={isStepComplete}
                            secondaryAction={
                                isStepComplete ? (
                                    <StyledCheckCircleOutlined />
                                ) : (
                                    <PendingOutlined
                                        sx={{ marginTop: '8px' }}
                                    />
                                )
                            }
                        >
                            <List.ItemAvatar>
                                <StyledAvatar>
                                    <step.icon />
                                </StyledAvatar>
                            </List.ItemAvatar>
                            <List.ItemText
                                disableTypography
                                primary={
                                    <StyledListItemTypography variant="subtitle2">
                                        {step.title}
                                    </StyledListItemTypography>
                                }
                            />
                        </StyledStepListItem>
                        <Collapse in={props.currentBuilderStep === i + 1}>
                            <PromptBuilderSummaryStepItem
                                builder={props.builder}
                                currentBuilderStep={i + 1}
                            />
                        </Collapse>
                    </span>
                );
            })}
        </List>
    );
};
