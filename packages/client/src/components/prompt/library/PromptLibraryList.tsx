import { styled, List, Paper } from '@semoss/ui';
import {
    LIBRARY_PROMPT_TAG_BUSINESS,
    LIBRARY_PROMPT_TAG_COMMUNICATIONS,
    LIBRARY_PROMPT_TAG_TRAVEL,
} from '../prompt.constants';

const LIBRARY_CATEGORIES = [
    'all',
    LIBRARY_PROMPT_TAG_BUSINESS,
    LIBRARY_PROMPT_TAG_COMMUNICATIONS,
    LIBRARY_PROMPT_TAG_TRAVEL,
];

interface StyledListItemProps {
    selected: boolean;
}
const StyledListItem = styled(List.Item, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<StyledListItemProps>(({ selected, theme }) => ({
    backgroundColor: selected
        ? theme.palette.grey[200]
        : theme.palette.background.paper1,
}));
const StyledListItemText = styled(List.ItemText)(() => ({
    textTransform: 'capitalize',
}));

export const PromptLibraryList = (props: {
    filter: string;
    setFilter: (filter: string) => void;
}) => {
    return (
        <Paper>
            <List disablePadding>
                {Array.from(LIBRARY_CATEGORIES, (category) => (
                    <StyledListItem
                        key={category}
                        disableGutters
                        disablePadding
                        selected={category === props.filter}
                    >
                        <List.ItemButton
                            onClick={() => props.setFilter(category)}
                        >
                            <StyledListItemText>{category}</StyledListItemText>
                        </List.ItemButton>
                    </StyledListItem>
                ))}
            </List>
        </Paper>
    );
};
