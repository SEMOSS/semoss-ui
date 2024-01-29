import { useState } from 'react';
import { Button, IconButton, Typography } from '@semoss/ui';
import { PlayArrow, Try } from '@mui/icons-material';
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
                        <Button
                            variant="text"
                            size="small"
                            disabled
                            startIcon={<PlayArrow />}
                        >
                            Test Prompt
                        </Button>
                    </span>
                </StyledTooltip>
            ) : (
                <Button
                    variant="text"
                    size="small"
                    startIcon={<PlayArrow />}
                    onClick={() => setPromptContextTestOpen(true)}
                >
                    Test Prompt
                </Button>
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
