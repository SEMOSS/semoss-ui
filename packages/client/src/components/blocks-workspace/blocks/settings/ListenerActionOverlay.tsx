import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useForm } from 'react-hook-form';

import { styled, Stack, Modal, Button } from '@semoss/ui';
import { ActionMessages, BlockDef, ListenerActions } from '@semoss/renderer';

import { useBlockSettings } from '@/hooks';
import {
    ActionTypeSelector,
    ActionFormFields,
    useEventActionData,
    getDefaultFormValues,
    validateForm,
} from './block-events';

const StyledSpacer = styled('div')(() => ({
    flex: 1,
}));

interface ActionOverlayProps<D extends BlockDef = BlockDef> {
    id: string;
    type: 'sync' | 'async';
    listener: Extract<keyof D['listeners'], string>;
    actionIdx: number;
    onClose: () => void;
}

type ListenerActionForm = ListenerActions;

export const ListenerActionOverlay = observer(
    <D extends BlockDef = BlockDef>(props: ActionOverlayProps<D>) => {
        const { id, type, listener, actionIdx = -1, onClose } = props;
        const { listeners, setListener } = useBlockSettings(id);

        const isNewAction = actionIdx === -1;
        const existingAction =
            actionIdx !== -1 ? listeners[listener].order[actionIdx] : null;

        // Form setup
        const defaultValues = existingAction
            ? getDefaultFormValues(existingAction.message)
            : getDefaultFormValues(ActionMessages.RUN_QUERY);

        const { control, handleSubmit, reset, watch, setValue } =
            useForm<ListenerActionForm>({
                defaultValues,
            });

        const message = watch('message');
        const payload = watch('payload');
        const queryId = watch('payload.queryId');
        const destinationType = watch('payload.destinationType');
        const text = watch('payload.text');


        // Data fetching
        const { queries, cells, pages } = useEventActionData(queryId);

        // Form validation
        const isFormValid = validateForm(message, payload);

        // Reset form when action index changes
        useEffect(() => {
            const formData =
                existingAction ||
                getDefaultFormValues(ActionMessages.RUN_QUERY);
            reset(formData);
        }, [actionIdx, existingAction, reset]);

        // Reset payload when message type changes
        useEffect(() => {
            if (existingAction?.message !== message) {
                const newDefaults = getDefaultFormValues(message);
                setValue('payload', newDefaults.payload);
            }
        }, [message, existingAction, setValue]);

        const handleFormSubmit = handleSubmit(
            (formData: ListenerActionForm) => {
                const updatedActions = listeners[listener].order
                    ? [...listeners[listener].order]
                    : [];

                if (isNewAction) {
                    updatedActions.push(formData);
                } else {
                    updatedActions[actionIdx] = formData;
                }

                setListener(listener, updatedActions, type);
                onClose();
            },
        );

        return (
            <>
                <Modal.Title>
                    {`${isNewAction ? 'Add' : 'Edit'} ${listener}`}
                </Modal.Title>

                <Modal.Content>
                    <Stack padding={2}>
                        <ActionTypeSelector
                            control={control}
                            setValue={setValue}
                        />

                        <ActionFormFields
                            message={message}
                            control={control}
                            setValue={setValue}
                            queries={queries}
                            cells={cells}
                            queryId={queryId}
                            destinationType={destinationType}
                            pages={pages}
                        />
                    </Stack>
                </Modal.Content>

                <Modal.Actions>
                    <StyledSpacer />
                    <Button type="button" variant="text" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleFormSubmit} disabled={!isFormValid}>
                        Save
                    </Button>
                </Modal.Actions>
            </>
        );
    },
);
