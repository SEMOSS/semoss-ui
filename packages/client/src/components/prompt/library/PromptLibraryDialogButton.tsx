import { useState } from 'react';
import { Button, Typography } from '@semoss/ui';
import { ArrowOutward } from '@mui/icons-material';
import { PromptLibraryDialog } from './PromptLibraryDialog';
import { Builder } from '../prompt.types';
import { StyledTooltip } from '../prompt.styled';

export const PromptLibraryDialogButton = (props: {
    disabled: boolean;
    builder: Builder;
}) => {
    const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);

    const closePromptLibrary = () => {
        setPromptLibraryOpen(false);
    };

    return (
        <>
            {props.disabled ? (
                <StyledTooltip
                    title={
                        <Typography
                            variant="body1"
                            sx={{ marginX: 1, width: '100%' }}
                        >
                            Add a name and select an LLM to browse
                        </Typography>
                    }
                >
                    <span>
                        <Button
                            color="primary"
                            disabled
                            endIcon={<ArrowOutward />}
                            variant="text"
                            disableElevation
                        >
                            Browse Prompt Templates
                        </Button>
                    </span>
                </StyledTooltip>
            ) : (
                <Button
                    color="primary"
                    onClick={() => setPromptLibraryOpen(true)}
                    endIcon={<ArrowOutward />}
                    variant="text"
                    disableElevation
                >
                    Browse Prompt Templates
                </Button>
            )}
            <PromptLibraryDialog
                builder={props.builder}
                promptLibraryOpen={promptLibraryOpen}
                closePromptLibrary={closePromptLibrary}
            />
        </>
    );
};
