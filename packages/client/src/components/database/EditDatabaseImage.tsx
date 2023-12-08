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

    /** Values to show in the fields */
    values: Record<string, unknown>;

    /** Current image src */
    currentImageSrc?: string;

    /** Type of modal; db/storage/model */
    type: string;
}

/**
 * Wrap the Database routes and provide styling/functionality
 */
export const EditDatabaseImage = observer((props: EditDatabaseImageProps) => {
    const {
        open = false,
        onClose = () => null,
        values = {},
        currentImageSrc,
        type,
    } = props;

    // get the notification
    const notification = useNotification();

    // get the configStore
    const { configStore, monolithStore } = useRootStore();

    const [isLoading, setIsLoading] = useState(false);

    // get a list of the keys
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            // filter the fields to the ones that are passed in
            return Object.prototype.hasOwnProperty.call(values, k.metakey);
        },
    );

    // get the engine information
    const { id } = useEngine();

    // track the options
    const [filterOptions, setFilterOptions] = useState<
        Record<string, string[]>
    >(() => {
        return databaseMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = [];

            return prev;
        }, {});
    });

    // get metakeys that we want to get the values from
    const metaKeys = databaseMetaKeys.map((k) => {
        return k.metakey;
    });

    // get the values
    const getDatabaseMetaValues = usePixel<
        {
            METAKEY: string;
            METAVALUE: string;
            count: number;
        }[]
    >(`META | GetDatabaseMetaValues ( metaKeys = ['tags'] ) ;`);

    useEffect(() => {
        if (getDatabaseMetaValues.status !== 'SUCCESS') {
            return;
        }

        // format the catalog data into a map
        const updated = getDatabaseMetaValues.data.reduce((prev, current) => {
            if (!prev[current.METAKEY]) {
                prev[current.METAKEY] = [];
            }

            prev[current.METAKEY].push(current.METAVALUE);

            return prev;
        }, {});

        setFilterOptions(updated);
    }, [getDatabaseMetaValues.status, getDatabaseMetaValues.data]);

    // const { handleSubmit, control } = useForm<Record<string, unknown>>({
    //     defaultValues: values,
    // });

    console.log('values ', values);

    const { handleSubmit, control, setValue } =
        useForm<Record<string, unknown>>();

    /**
     * @name onSubmit
     * @desc approve, deny, delete selected members/users
     * @param data - form data
     */
    const onSubmit = handleSubmit((data: object) => {
        // copy over the defined keys
        const meta = {};
        if (data) {
            for (const key in data) {
                if (data[key] !== undefined) {
                    meta[key] = data[key];
                }
            }
        }

        console.log('data is', data);
        console.log('meta ', meta);

        if (Object.keys(meta).length === 0) {
            notification.add({
                color: 'warning',
                message: 'Nothing to Save',
            });

            return;
        }

        //check image blob if new upload image
        // if (watchUploadImage) {
        //     if (watchUploadImage.src.indexOf('blob:') > -1) {
        //         console.log('new image uploaded');

        //         console.log('insight id is', configStore.store.insightID);
        //         console.log('id is', id);

        //         // then upload image
        //         // http://localhost:9090/vha-supply/api/uploadFile/baseUpload?insightId=/api/images/engine/upload 400 (Bad Request)
        //         // uploading image should hit this endpoint:http://localhost:9090/vha-supply/api/images/databaseImage/upload == /api/images/engine/upload

        //         // upload the file
        //         const upload = monolithStore.uploadFile(
        //             watchUploadImage,
        //             configStore.store.insightID,
        //             id,
        //             '/api/images/engine/upload',
        //         );

        //         console.log('upload is ', upload);
        //     }
        // }

        // monolithStore
        //     .runQuery(
        //         `SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(
        //             meta,
        //         )}], jsonCleanup=[true])`,
        //     )
        //     .then((response) => {
        //         const { output, additionalOutput, operationType } =
        //             response.pixelReturn[0];

        //         // track the errors
        //         if (operationType.indexOf('ERROR') > -1) {
        //             notification.add({
        //                 color: 'error',
        //                 message: output,
        //             });

        //             return;
        //         }

        //         notification.add({
        //             color: 'success',
        //             message: additionalOutput[0].output,
        //         });

        //         // close it and succesfully message
        //         onClose(true);
        //     })
        //     .catch((error) => {
        //         notification.add({
        //             color: 'error',
        //             message: error.message,
        //         });
        //     });
    });

    const handleChange = (event, field) => {
        console.log('event in handle change', event);
        field.value == event;

        console.log('field in handle change', field);

        //field on change not working? hard set field
        // setValue('image', event);
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
            <Modal.Title>Edit {type} Images roseTest</Modal.Title>
            <Modal.Content>
                <StyledStack spacing={4}>
                    <StyledEditorContainerImages>
                        <Controller
                            name={'image'}
                            control={control}
                            render={({ field }) => {
                                return (
                                    <ImageSelector
                                        value={currentImageSrc}
                                        options={[
                                            {
                                                title: 'Default',
                                                src: currentImageSrc,
                                            },
                                            {
                                                title: 'Blue Default',
                                                src: require('@/assets/img/BlueDefault.png'),
                                            },
                                            {
                                                title: 'Orange Default',
                                                src: require('@/assets/img/OrangeDefault.png'),
                                            },
                                            {
                                                title: 'Purple Default',
                                                src: require('@/assets/img/PurpleDefault.png'),
                                            },
                                            {
                                                title: 'Red Default',
                                                src: require('@/assets/img/RedDefault.png'),
                                            },
                                        ]}
                                        // onChange={(e) =>
                                        //     field.onChange(e.target.value)
                                        // }
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
