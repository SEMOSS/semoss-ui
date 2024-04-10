import {
    PROMPT_BUILDER_INPUT_TYPES_STEP,
    PROMPT_BUILDER_PREVIEW_STEP,
    SUMMARY_STEPS,
    TOKEN_TYPE_INPUT,
} from '../../prompt.constants';
import { Builder, BuilderStepItem, Token } from '../../prompt.types';
import { styled, Avatar, Collapse, Typography, List } from '@semoss/ui';
import { PendingOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { PromptBuilderSummaryStepItem } from './PromptBuilderSummaryStepItem';
import { PromptBuilderSummaryProgress } from './PromptBuilderSummaryProgress';
import { useEffect } from 'react';

const StyledListItem = styled(List.Item)(({ theme }) => ({
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
}));

const StyledProgressSubtitle = styled(Typography)(({ theme }) => ({
    color: theme.palette.success.main,
    fontWeight: 'bold',
}));

const StyledStepListItem = styled(StyledListItem, {
    shouldForwardProp: (prop) =>
        prop !== 'disabled' && prop !== 'isStepComplete' && prop !== 'isActive',
})<{ disabled?: boolean; isStepComplete?: boolean; isActive?: boolean }>(
    ({ theme, disabled, isStepComplete, isActive }) => ({
        color: disabled
            ? theme.palette.grey[400]
            : isStepComplete
            ? theme.palette.success.main
            : theme.palette.grey[900],

        '&:hover': {
            cursor: !disabled ? 'pointer' : 'inherit',

            ...(!isActive &&
                !disabled && { backgroundColor: theme.palette.grey[100] }),
        },

        ...(isActive && { backgroundColor: theme.palette.success.selected }),
    }),
);

const StyledAvatar = styled(Avatar, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ theme, isActive }) => ({
    backgroundColor: 'white',

    ...(isActive ? { color: theme.palette.grey[900] } : { color: 'inherit' }),
}));

const StyledCheckCircleOutlined = styled(CheckCircleOutlined, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
    marginTop: '8px',

    ...(isActive
        ? { color: theme.palette.grey[900] }
        : { color: theme.palette.success.main }),
}));

const StyledListItemTypography = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive?: boolean }>(({ isActive, theme }) => ({
    fontWeight: 'bold',

    ...(isActive ? { color: theme.palette.grey[900] } : { color: 'inherit' }),
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
                        <StyledProgressSubtitle variant="subtitle2">
                            Overall Completion
                        </StyledProgressSubtitle>
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
                const isActive = props.currentBuilderStep === i + 1;

                // Preview Step, depends on completion of other steps
                if (i === PROMPT_BUILDER_PREVIEW_STEP - 1) {
                    const completedSteps = props.isBuildStepsComplete();
                    disabled = !completedSteps;
                    isStepComplete = false;
                }

                // checks to see if inputs have been set properly and disables / enables step accordingly
                if (i + 1 === PROMPT_BUILDER_INPUT_TYPES_STEP) {
                    const hasInputs = (
                        props.builder.inputs.value as Token[]
                    )?.some((token: Token) => {
                        return token.type === TOKEN_TYPE_INPUT;
                    });
                    disabled = !hasInputs;
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
                            isActive={isActive}
                            secondaryAction={
                                isStepComplete ? (
                                    <StyledCheckCircleOutlined
                                        isActive={isActive}
                                    />
                                ) : (
                                    <PendingOutlined
                                        sx={{ marginTop: '8px' }}
                                    />
                                )
                            }
                        >
                            <List.ItemAvatar>
                                <StyledAvatar isActive={isActive}>
                                    <step.icon />
                                </StyledAvatar>
                            </List.ItemAvatar>
                            <List.ItemText
                                disableTypography
                                primary={
                                    <StyledListItemTypography
                                        isActive={isActive}
                                        variant="subtitle2"
                                    >
                                        {step.title}
                                    </StyledListItemTypography>
                                }
                            />
                        </StyledStepListItem>
                        <Collapse in={isActive}>
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
