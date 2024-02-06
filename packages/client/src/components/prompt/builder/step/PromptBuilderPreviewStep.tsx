import { useState } from 'react';
import { Builder, Token } from '../../prompt.types';
import { StyledStepPaper, StyledTextPaper } from '../../prompt.styled';
import {
    styled,
    Modal,
    Box,
    Typography,
    Stack,
    Button,
    IconButton,
} from '@semoss/ui';
import { getBuilderJsonState } from '../../prompt.helpers';
import { BlocksRenderer } from '@/components/blocks-workspace';
import { Close, OpenInNew } from '@mui/icons-material';

export const StyledModalTitle = styled(Modal.Title)(() => ({
    flexDirection: 'row',
    textAlign: 'end',
    alignItems: 'center',
    paddingBottom: 0,
}));

export const PromptBuilderPreviewStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: Token[]) => void;
}) => {
    const [open, setOpen] = useState(false);
    const builderJsonState = getBuilderJsonState(props.builder);

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Preview</Typography>
                <Typography variant="body1">
                    Preview your prompt app before exporting.
                </Typography>
            </Box>
            <StyledTextPaper height="425px">
                <BlocksRenderer state={builderJsonState} />
            </StyledTextPaper>
            {/* <Stack direction="row" justifyContent="end" width="100%" paddingTop={1}>
                <Button 
                    color="inherit"
                    size="small"
                    variant="text" 
                    endIcon={<OpenInNew/>} 
                    onClick={() => setOpen(true)}
                >
                    Open
                </Button>
            </Stack>
            <Modal open={open} fullWidth maxWidth="lg">
                <StyledModalTitle>
                    <IconButton onClick={() => setOpen(false)}>
                        <Close />
                    </IconButton>
                </StyledModalTitle>
                <BlocksRenderer state={builderJsonState} useOverlayLoading={false} />
            </Modal> */}
        </StyledStepPaper>
    );
};
