import { useState, useEffect } from 'react';
import {
    Modal,
    Button,
    Stack,
    TextField,
    Autocomplete,
    ImageSelector,
    useNotification,
    styled,
} from '@semoss/ui';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { observer } from 'mobx-react-lite';

import { usePixel, useRootStore, useEngine } from '@/hooks';

const StyledEditorContainerImages = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(10),
    height: '430px',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    marginTop: theme.spacing(1),
}));

interface EditDatabaseImageProps {
    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (success: boolean) => void;

    /** Current image src */
    currentImageSrc?: string;

    /** Type of modal; db/storage/model */
    type: string;
}

export const EditDatabaseImage = observer((props: EditDatabaseImageProps) => {
    const { open = false, onClose = () => null, currentImageSrc, type } = props;

    // get the notification
    const notification = useNotification();

    // get the configStore
    const { configStore, monolithStore } = useRootStore();

    // get the engine information
    const { id } = useEngine();

    const { handleSubmit, control, setValue } =
        useForm<Record<string, unknown>>();

    /**
     * @name onSubmit
     * @desc upload image selection
     * @param
     */
    const onSubmit = handleSubmit((data: object) => {
        console.log('data is', data.image);

        // check image blob if new upload image
        if (data.image) {
            if (data.image.src.indexOf('blob:') > -1) {
                console.log('new image uploaded');

                console.log('insight id is', configStore.store.insightID);
                console.log('id is', id);

                // then upload image
                // http://localhost:9090/vha-supply/api/uploadFile/baseUpload?insightId=/api/images/engine/upload 400 (Bad Request)
                // uploading image should hit this endpoint:http://localhost:9090/vha-supply/api/images/databaseImage/upload == /api/images/engine/upload

                // upload the file
                monolithStore.uploadFile(
                    data.image,
                    configStore.store.insightID,
                    id,
                    '/api/images/engine/upload',
                );
            }
        }
    });

    const handleChange = (event, field) => {
        console.log('event in handle change', event);
        field.value == event;

        console.log('field in handle change', field);

        //field on change not working? hard set field
        setValue('image', event);
        // field.onChange(event);
    };

    return (
        <Modal
            open={open}
            maxWidth={'md'}
            onClose={() => {
                onClose(false);
            }}
        >
            <Modal.Title>Edit {type} Image</Modal.Title>
            <Modal.Content>
                <StyledStack spacing={4}>
                    <StyledEditorContainerImages>
                        <Controller
                            name={'image'}
                            control={control}
                            defaultValue={currentImageSrc}
                            render={({ field }) => {
                                return (
                                    <ImageSelector
                                        value={currentImageSrc}
                                        options={[
                                            {
                                                title: 'Default',
                                                src: currentImageSrc,
                                                newImage: true,
                                            },
                                            {
                                                title: 'Blue Default',
                                                src: require('@/assets/img/BlueDefault.png'),
                                                newImage: false,
                                            },
                                            {
                                                title: 'Orange Default',
                                                src: require('@/assets/img/OrangeDefault.png'),
                                                newImage: false,
                                            },
                                            {
                                                title: 'Purple Default',
                                                src: require('@/assets/img/PurpleDefault.png'),
                                                newImage: false,
                                            },
                                            {
                                                title: 'Red Default',
                                                src: require('@/assets/img/RedDefault.png'),
                                                newImage: false,
                                            },
                                        ]}
                                        onChange={(e) => handleChange(e, field)}
                                    />
                                );
                            }}
                        />
                    </StyledEditorContainerImages>
                </StyledStack>
            </Modal.Content>
            <Modal.Actions>
                <Button
                    variant="text"
                    color="error"
                    onClick={() => {
                        // trigger the close
                        onClose(false);
                    }}
                >
                    Cancel
                </Button>
                <Button variant="contained" onClick={() => onSubmit()}>
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
});
