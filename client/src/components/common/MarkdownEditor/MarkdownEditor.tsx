import { styled, Grid, Textarea } from '@semoss/components';

import { Markdown } from '../Markdown/';

import { theme } from '@/theme';

const StyledGridItem = styled(Grid.Item, {
    height: theme.space['96'],
    overflow: 'auto',
});

const StyledTextarea = styled(Textarea, {
    height: '100% !important',
});

interface MarkdownEditorProps {
    /** Value of the input */
    value: string;

    /** Callback that is triggered when the value changes */
    onChange?: (value: string) => void;
}

export const MarkdownEditor = (props: MarkdownEditorProps) => {
    const { value, onChange = () => null } = props;

    return (
        <Grid>
            <StyledGridItem span={6}>
                <StyledTextarea
                    value={value}
                    onChange={(v) => {
                        onChange(v);
                    }}
                ></StyledTextarea>
            </StyledGridItem>
            <StyledGridItem span={6}>
                <Markdown content={value}></Markdown>
            </StyledGridItem>
        </Grid>
    );
};
