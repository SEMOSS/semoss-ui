import { observer } from 'mobx-react-lite';
import { styled, Stack, IconButton, Tooltip } from '@semoss/ui';
import { RestartAlt } from '@mui/icons-material';

import { useWorkspace } from '@/hooks';

const StyledActions = styled(Stack)(() => ({
    position: 'absolute',
    bottom: '0',
    left: '0',
    width: '32px', // from flexlayout
    zIndex: 1,
}));

type WorkspaceResetProps = {
    /** Called on reset **/
    onReset?: () => void;

    /** Style elements to pass */
    sx?: React.ComponentProps<typeof StyledActions>['sx'];
};

export const WorkspaceReset = observer((props: WorkspaceResetProps) => {
    const { sx = undefined, onReset = () => null } = props;
    const { workspace } = useWorkspace();

    /**
     * reset the selected layout
     */
    const resetWorkspace = () => {
        try {
            // reset the select layout (if it is there)
            workspace.resetLayout();

            // trigger the reset
            onReset();
        } catch (e) {
            //noop
        }
    };

    return (
        <StyledActions direction="column" justifyContent={'center'} sx={sx}>
            <Tooltip title={'Reset workspace'}>
                <IconButton
                    size={'small'}
                    color="default"
                    onClick={() => {
                        resetWorkspace();
                    }}
                >
                    <RestartAlt fontSize="inherit" />
                </IconButton>
            </Tooltip>
        </StyledActions>
    );
});
