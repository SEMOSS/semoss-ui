import * as React from 'react';
import { Button } from '@semoss/ui';
import { ArrowOutward } from '@mui/icons-material';
import { PromptLibraryDialog } from './PromptLibraryDialog';
import { Builder } from '../prompt.types';

export function PromptLibraryDialogButton(props: {
    disabled: boolean;
    builder: Builder;
}) {
    const [promptLibraryOpen, setPromptLibraryOpen] = React.useState(false);

    const closePromptLibrary = () => {
        setPromptLibraryOpen(false);
    };

    return (
        <>
            <Button
                color="primary"
                onClick={() => setPromptLibraryOpen(true)}
                disabled={props.disabled}
                size="small"
                endIcon={<ArrowOutward />}
                variant="text"
                disableElevation
            >
                Browse Prompt Templates
            </Button>
            <PromptLibraryDialog
                builder={props.builder}
                promptLibraryOpen={promptLibraryOpen}
                closePromptLibrary={closePromptLibrary}
            />
        </>
    );
}
