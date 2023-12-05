import { observer } from 'mobx-react-lite';
import { TextField, Modal, Button, Stack } from '@semoss/ui';
import { Controller, useForm } from 'react-hook-form';

import { useBlocks } from '@/hooks';
import { ActionMessages, BlockJSON } from '@/stores';
import {
    DefaultBlockDefinitions,
    PageBlockConfig,
    PageBlockDef,
} from '@/components/block-defaults';

type NewPageForm = {
    ROUTE: string;
};

interface NewPageOverlayProps {
    /** Callback that is triggered onClose */
    onClose: () => void;
}

/**
 * Edit or create a new page
 */
export const NewPageOverlay = observer(
    (props: NewPageOverlayProps): JSX.Element => {
        const { onClose = () => null } = props;

        const { state } = useBlocks();

        // create a new form
        const {
            control,
            handleSubmit,
            clearErrors,
            setError,
            formState: { errors },
        } = useForm<NewPageForm>({
            defaultValues: {
                ROUTE: '',
            },
        });

        /**
         * Allow the user to login
         */
        const onSubmit = handleSubmit((data: NewPageForm) => {
            clearErrors();
            if (!data.ROUTE) {
                setError('ROUTE', {
                    type: 'manual',
                    message: `Route is required`,
                });
                return;
            }

            // check that the routes
            for (const b in state.blocks) {
                const block = state.blocks[b];

                // check if it is a page widget
                if (
                    block.widget === PageBlockConfig.widget &&
                    block.data.route === data.ROUTE
                ) {
                    // store the pages
                    console.error(`ERROR: ${data.ROUTE}} already exists`);
                    return;
                }
            }

            // update it
            const json = {
                widget: 'page',
                data: {
                    route: data.ROUTE,
                    style: {},
                },
                listeners: {},
                slots: {
                    content: [],
                },
            };

            // dispatch a query
            state.dispatch({
                message: ActionMessages.ADD_BLOCK,
                payload: {
                    json: json as unknown as BlockJSON,
                    position: null,
                },
            });

            onClose();
        });

        return (
            <>
                <Modal.Title>New Page</Modal.Title>
                <Modal.Content>
                    <Stack marginTop={1}>
                        <Controller
                            name={'ROUTE'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        error={!!errors?.ROUTE?.message}
                                        label="Route"
                                        value={field.value ? field.value : ''}
                                        onChange={(value) => {
                                            clearErrors();
                                            field.onChange(value);
                                        }}
                                        helperText={errors?.ROUTE?.message}
                                    />
                                );
                            }}
                        />
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="text" onClick={() => onClose()}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSubmit()}>Submit</Button>
                </Modal.Actions>
            </>
        );
    },
);
