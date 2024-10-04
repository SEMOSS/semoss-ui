import { styled, List, Paper } from '@semoss/ui';
import {
    LIBRARY_PROMPT_TAG_BUSINESS,
    LIBRARY_PROMPT_TAG_COMMUNICATIONS,
    LIBRARY_PROMPT_TAG_TRAVEL,
} from '../prompt.constants';
import { useRootStore } from '@/hooks';
import { useState, useEffect } from 'react';

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
        : theme.palette.background.paper,
}));
const StyledListItemText = styled(List.ItemText)(() => ({
    textTransform: 'capitalize',
}));

export const PromptLibraryList = (props: {
    filter: string;
    setFilter: (filter: string) => void;
}) => {
    const { monolithStore } = useRootStore();
    const [promptTags, setPromptTags] = useState([]);

    useEffect(() => {
        init();
    }, []);

    const init = () => {
        monolithStore
            .runQuery('GetPromptMetaValues( metaKeys = ["tag","domain"])')
            .then((response) => {
                let { output } = response.pixelReturn[0];
                if (output.length > 0) {
                    let tagArr = ['all'];
                    output.map((tag) => {
                        tagArr.push(tag.METAVALUE);
                    });
                    console.log(tagArr);
                    setPromptTags(tagArr);
                }
            });
    };

    return (
        <Paper>
            <List disablePadding>
                {Array.from(promptTags, (category) => (
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
