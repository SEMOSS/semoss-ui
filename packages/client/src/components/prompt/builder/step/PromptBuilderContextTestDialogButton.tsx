import { useState } from 'react';
import { IconButton, Typography } from '@semoss/ui';
import { Try } from '@mui/icons-material';
import { PromptBuilderContextTestDialog } from './PromptBuilderContextTestDialog';
import { StyledTooltip } from '../../prompt.styled';

export const PromptBuilderContextTestDialogButton = (props: {
    disabled: boolean;
    llm: string;
    context: string;
}) => {
    const [promptContextTestOpen, setPromptContextTestOpen] = useState(false);

    const closePromptContextTest = () => {
        setPromptContextTestOpen(false);
    };

    return (
        <>
            {props.disabled ? (
                <StyledTooltip
                    title={
                        <Typography
                            variant="body1"
                            sx={{ padding: 1, width: '100%' }}
                        >
                            Select an LLM and add context to test your prompt
                        </Typography>
                    }
                >
                    <span>
                        <IconButton disabled>
                            <Try color="disabled" />
                        </IconButton>
                    </span>
                </StyledTooltip>
            ) : (
                <IconButton
                    title="Test prompt"
                    color="primary"
                    onClick={() => setPromptContextTestOpen(true)}
                >
                    <Try />
                </IconButton>
            )}
            <PromptBuilderContextTestDialog
                llm={props.llm}
                context={props.context}
                open={promptContextTestOpen}
                close={closePromptContextTest}
            />
        </>
    );
};
