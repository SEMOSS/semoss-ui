import { Builder, BuilderStepItem } from './prompt.types';
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

    return (
        <List component="div">
            {Array.from(stepItemsForSummaryStep, (item: BuilderStepItem, i) => (
                <ListItem key={i} sx={{ marginLeft: '16px' }}>
                    <ListItemText
                        primary={item.display}
                        secondary={
                            !item.required || !!item.value
                                ? 'Complete'
                                : 'In Progress'
                        }
                    />
                </ListItem>
            ))}
        </List>
    );
}
