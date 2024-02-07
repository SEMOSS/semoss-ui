import { styled, IconButton } from '@/component-library';
import { Close } from '@mui/icons-material';

const StyledCardToolbar = styled('div')(() => ({
    display: 'flex',
    justifyContent: 'flex-end',
}));

export const WelcomeStepToolbar = (props: { closeModal: () => void }) => {
    return (
        <StyledCardToolbar>
            <IconButton size="small" onClick={() => props.closeModal()}>
                <Close />
            </IconButton>
        </StyledCardToolbar>
    );
};
