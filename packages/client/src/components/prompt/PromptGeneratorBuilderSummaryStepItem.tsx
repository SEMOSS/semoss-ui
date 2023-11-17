import { TOKEN_TYPE_INPUT } from './prompt.constants';
import { Builder, BuilderStepItem, Token } from './prompt.types';
import { List, ListItem, ListItemText } from '@mui/material';

interface BuilderStepItemProps {
    builder: Builder;
    currentBuilderStep: number;
}

export function PromptGeneratorBuilderSummaryStepItem(
    props: BuilderStepItemProps,
) {
    const stepItemsForSummaryStep = Object.values(props.builder).filter(
        (builderStepItem: BuilderStepItem) => {
            return builderStepItem.step === props.currentBuilderStep;
        },
    );

    const isStepItemComplete = (item: BuilderStepItem) => {
        switch (item.step) {
            case 2:
                // input step - need at least one input
                if (!item.value) {
                    return false;
                }
                return (item.value as Token[]).some((token: Token) => {
                    return token.type === TOKEN_TYPE_INPUT;
                });
            case 3:
                // input type step - types should not be null
                if (!item.value) {
                    return false;
                }
                return Object.values(item.value).every(
                    (type: string | null) => {
                        return !!type;
                    },
                );
            default:
                return !!item.value;
        }
    };

    return (
        <List component="div">
            {Array.from(stepItemsForSummaryStep, (item: BuilderStepItem, i) => (
                <ListItem key={i} sx={{ marginLeft: '16px' }}>
                    <ListItemText
                        primary={item.display}
                        secondary={
                            !item.required
                                ? 'Optional'
                                : isStepItemComplete(item)
                                ? 'Complete'
                                : 'In Progress'
                        }
                    />
                </ListItem>
            ))}
        </List>
    );
}
