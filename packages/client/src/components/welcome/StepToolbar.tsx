import { styled, IconButton } from '@semoss/ui';
import { Close } from '@mui/icons-material';

const StyledCardToolbar = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
}));

export const StepToolbar = (props: { closeModal: () => void }) => {
    return (
        <StyledCardToolbar>
            <IconButton size="small" onClick={() => props.closeModal()}>
                <Close />
            </IconButton>
        </StyledCardToolbar>
    );
};
