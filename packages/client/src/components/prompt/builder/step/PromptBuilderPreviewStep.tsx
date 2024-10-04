import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper, StyledTextPaper } from '../../prompt.styled';
import { Box, Typography, Stack, Button, Popover } from '@semoss/ui';
import { PromptPreview } from '../../shared';
import { useState } from 'react';
import { PromptPopover } from './PromptPopover';
import { PromptModal } from '../../../../pages/prompt/PromptModal';

export const PromptBuilderPreviewStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: Token[]) => void;
}) => {
    const getBuilderTokens = (builder: Builder) => {
        return Array.isArray(builder.inputs.value) ? builder.inputs.value : [];
    };

    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptMode, setPromptMode] = useState('');
    const [promptToEdit, setPromptToEdit] = useState({});

    return (
        <StyledStepPaper elevation={2} square>
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems={'center'}
            >
                <Box>
                    <Typography variant="h5">Preview Prompt</Typography>
                    <Typography variant="body1">
                        Preview your prompt before exporting to an app.
                    </Typography>
                </Box>
                {/* <Button variant="outlined" color={"inherit"} onClick={handleClick}>
                    Create Template
                </Button> */}
                <Button
                    variant={'outlined'}
                    onClick={() => {
                        setPromptMode('Create');
                        setIsPromptModalOpen(true);
                    }}
                    aria-label={`Create Template`}
                    color={'inherit'}
                >
                    Create Template
                </Button>
                {/* <PromptPopover
                    id={"createTemplate"}
                    open={open}
                    anchorEl={anchorEl}
                    onClose={handleClose}
                    anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                    }}
                ></PromptPopover> */}
                <PromptModal
                    isOpen={isPromptModalOpen}
                    prompt={promptToEdit}
                    onClose={(reload) => {
                        setIsPromptModalOpen(false);
                        // if (reload) {
                        //     init();
                        // }
                    }}
                    mode={promptMode}
                ></PromptModal>
            </Stack>
            <StyledTextPaper>
                <PromptPreview
                    tokens={getBuilderTokens(props.builder)}
                    inputTypes={
                        props.builder.inputTypes.value
                            ? (props.builder.inputTypes.value as object)
                            : {}
                    }
                />
            </StyledTextPaper>
        </StyledStepPaper>
    );
};
