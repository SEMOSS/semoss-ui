import { styled, Grid, TextArea } from '@semoss/ui';

import { Markdown } from '../Markdown';

const StyledGridItem = styled(Grid)(({ theme }) => ({
    height: theme.spacing(36),
    overflow: 'auto',
}));

const StyledTextarea = styled(TextArea)(() => ({
    height: '100%',
    width: '100%',
    overflow: 'auto',
}));

interface MarkdownEditorProps {
    /** Value of the input */
    value: string;

    /** Callback that is triggered when the value changes */
    onChange?: (value: string) => void;
}

export const MarkdownEditor = (props: MarkdownEditorProps) => {
    const { value, onChange = () => null } = props;

    return (
        <Grid container>
            <StyledGridItem item xs={6}>
                <StyledTextarea
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                    }}
                ></StyledTextarea>
            </StyledGridItem>
            <StyledGridItem item xs={6}>
                <Markdown content={value}></Markdown>
            </StyledGridItem>
        </Grid>
    );
};
