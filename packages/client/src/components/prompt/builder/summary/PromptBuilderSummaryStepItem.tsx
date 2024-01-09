import { INPUT_TYPE_VECTOR, INPUT_TYPE_DATABASE } from '../../prompt.constants';
import { Builder, BuilderStepItem } from '../../prompt.types';
import { List } from '@semoss/ui';

interface BuilderStepItemProps {
    builder: Builder;
    currentBuilderStep: number;
}

export const PromptBuilderSummaryStepItem = (props: BuilderStepItemProps) => {
    const stepItemsForSummaryStep = Object.values(props.builder).filter(
        (builderStepItem: BuilderStepItem) => {
            return builderStepItem.step === props.currentBuilderStep;
        },
    );

    const isStepItemComplete = (item: BuilderStepItem) => {
        switch (item.step) {
            case 3:
                // input type step
                if (item.value === undefined) {
                    return false;
                }
                return (
                    Object.values(item.value).length &&
                    Object.values(item.value).every(
                        (inputType: { type: string; meta: string }) => {
                            if (
                                inputType?.type === INPUT_TYPE_VECTOR ||
                                inputType?.type === INPUT_TYPE_DATABASE
                            ) {
                                return !!inputType.meta;
                            } else {
                                return !!inputType.type;
                            }
                        },
                    )
                );
            default:
                return !!item.value;
        }
    };

    return (
        <List disablePadding>
            {Array.from(stepItemsForSummaryStep, (item: BuilderStepItem, i) => (
                <List.Item disableGutters key={i} sx={{ marginLeft: '16px' }}>
                    <List.ItemText
                        primary={item.display}
                        secondary={
                            !item.required
                                ? 'Optional'
                                : isStepItemComplete(item)
                                ? 'Complete'
                                : 'In Progress'
                        }
                    />
                </List.Item>
            ))}
        </List>
    );
};
