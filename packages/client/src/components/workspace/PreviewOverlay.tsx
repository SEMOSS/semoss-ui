import { observer } from 'mobx-react-lite';
import { Button, Modal, styled } from '@/component-library';
import { SerializedState } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';

const StyledContainer = styled('div')(({ theme }) => ({
    height: '60vh',
    width: '100%',
    border: `1px solid ${theme.palette.divider}`,
}));

interface PreviewOverlayProps {
    /** State to load in the preview */
    state: SerializedState;

    /** Method called to close overlay  */
    onClose: () => void;
}

export const PreviewOverlay = observer((props: PreviewOverlayProps) => {
    const { state, onClose = () => null } = props;

    return (
        <>
            <Modal.Title>Preview</Modal.Title>
            <Modal.Content>
                <StyledContainer>
                    <BlocksRenderer state={state} />
                </StyledContainer>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => onClose()}>Cancel</Button>
            </Modal.Actions>
        </>
    );
});
