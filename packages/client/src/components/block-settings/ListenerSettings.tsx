import { observer } from 'mobx-react-lite';
import { styled, Stack, Typography, IconButton, Button } from '@semoss/ui';

import { useBlockSettings, useWorkspace } from '@/hooks';
import { ACTIONS_DISPLAY, BlockDef } from '@/stores';
import { Add, Delete, Edit } from '@mui/icons-material';

import { ListenerActionOverlay } from './ListenerActionOverlay';
import { BaseSettingSection } from './BaseSettingSection';

const Spacer = styled('div')(() => ({
    flex: 1,
}));

/**
 * TODO: reorganize and update the styling once app/blocks is up and working
 */

interface ListenerSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Lisetner to update
     */
    listener: Extract<keyof D['listeners'], string>;
}

export const ListenerSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        listener,
    }: ListenerSettingsProps<D>) => {
        const { listeners, setListener } = useBlockSettings(id);
        const { workspace } = useWorkspace();

        /**
         * Open the overlay to create a edit action
         *
         * @param actionIdx - index of the action to edit. Will create a new one if -1
         */
        const openActionOverlay = (actionIdx = -1) => {
            workspace.openOverlay(() => {
                return (
                    <ListenerActionOverlay
                        id={id}
                        listener={listener}
                        actionIdx={actionIdx}
                        onClose={() => workspace.closeOverlay()}
                    />
                );
            });
        };

        /**
         * Open the overlay to create a edit action
         *
         * @param actionIdx - index of the action to edit. Will create a new one if -1
         */
        const deleteListener = (actionIdx: number) => {
            // copy it
            const updated = [...listeners[listener]];

            // remove it
            updated.splice(actionIdx, 1);

            setListener(listener, updated);
        };

        return (
            <Stack>
                {listeners[listener].map((a, aIdx) => (
                    <Stack
                        key={aIdx}
                        alignItems={'center'}
                        flex={1}
                        direction="row"
                    >
                        <Typography variant="body2">
                            {ACTIONS_DISPLAY[a.message]}
                        </Typography>
                        <Spacer />
                        <IconButton
                            size="small"
                            onClick={() => openActionOverlay(aIdx)}
                        >
                            <Edit />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={() => deleteListener(aIdx)}
                        >
                            <Delete />
                        </IconButton>
                    </Stack>
                ))}
                <Stack
                    alignItems={'center'}
                    justifyContent={'center'}
                    flex={'1'}
                    direction="row"
                >
                    <Button
                        size="small"
                        onClick={() => openActionOverlay(-1)}
                        startIcon={<Add />}
                    >
                        New Action
                    </Button>
                </Stack>
            </Stack>
        );
    },
);
