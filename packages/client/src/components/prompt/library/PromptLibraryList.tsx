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

interface PromptLibraryListProps {
    /**
     *
     */
    filter: string;

    /**
     *
     * @param filter
     * @returns
     */
    setFilter: (filter: string) => void;

    /**
     *
     */
    reload?: boolean;
}

export const PromptLibraryList = (props: PromptLibraryListProps) => {
    const { filter, reload, setFilter } = props;
    const { monolithStore } = useRootStore();
    const [promptTags, setPromptTags] = useState([]);

    /**
     * @desc
     */
    useEffect(() => {
        init();
    }, [reload]);

    /**
     * @desc Gets all filter options
     */
    const init = () => {
        monolithStore
            .runQuery('GetPromptMetaValues( metaKeys = ["tag","domain"])')
            .then((response) => {
                const { output } = response.pixelReturn[0];
                if (output.length > 0) {
                    const tagMap = { all: '' };
                    output.map((tag) => {
                        tagMap[tag.METAVALUE] = '';
                    });
                    setPromptTags(Object.keys(tagMap));
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
                        selected={category === filter}
                    >
                        <List.ItemButton onClick={() => setFilter(category)}>
                            <StyledListItemText>{category}</StyledListItemText>
                        </List.ItemButton>
                    </StyledListItem>
                ))}
            </List>
        </Paper>
    );
};
