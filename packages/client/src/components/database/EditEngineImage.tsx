import { useState } from 'react';
import { Modal, Button, Stack, ImageSelector, styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

import { useRootStore, useEngine } from '@/hooks';

const StyledEditorContainerImages = styled('div')(({ theme }) => ({
    marginBottom: theme.spacing(10),
    height: '430px',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    marginTop: theme.spacing(1),
}));

interface EditEngineImageProps {
    /** Track if the edit is open */
    open: boolean;

    /** Callback that is triggered on onClose */
    onClose: (success: boolean) => void;

    /** Current image src */
    currentImageSrc?: string;

    /** Type of modal; db/storage/model */
    type: string;
}

export const EditEngineImage = observer((props: EditEngineImageProps) => {
    const { open = false, onClose, currentImageSrc, type } = props;

    // get the configStore
    const { monolithStore } = useRootStore();

    // get the engine information
    const { id } = useEngine();

    //default image options
    const defaultImageOptions = [
        {
            name: 'Default',
            src: currentImageSrc,
        },
        {
            name: 'Blue Default',
            src: require('@/assets/img/BlueDefault.png'),
            type: 'image/png',
        },
        {
            name: 'Orange Default',
            src: require('@/assets/img/OrangeDefault.png'),
            type: 'image/png',
        },
        {
            name: 'Purple Default',
            src: require('@/assets/img/PurpleDefault.png'),
            type: 'image/png',
        },
        {
            name: 'Red Default',
            src: require('@/assets/img/RedDefault.png'),
            type: 'image/png',
        },
    ];

    //set default image to first in list
    const [imageSelectorValue, setImageSelectorValue] = useState(
        defaultImageOptions[0],
    );

    /**
     * @name onSubmit
     * @desc upload image selection
     * @param
     */
    const onSubmit = async (image: File) => {
        let imageUpload;

        // check if its a new image
        if (image.src.indexOf('blob:') > -1) {
            //build new image
            imageUpload = image.fileContents;
            imageUpload.src = image.src;
        } else {
            //if its not a new image we need to create a file to upload
            //we use download to grab the engine image
            //need to change this if we dont want to upload default images
            await createFile(image.src, image.name, image.type).then((file) => {
                imageUpload = file;
            });
        }

        //upload image
        const upload = monolithStore.uploadImage(imageUpload, id);

        //after successful upload trigger close modal & reload page
        upload && onClose(true);
    };

    //on change, set value to entire image
    const handleChange = (event) => {
        setImageSelectorValue(event);
    };

    const createFile = async (
        path: string,
        name: string,
        type: string,
    ): Promise<File> => {
        const response = await fetch(path);
        const data = await response.blob();
        const metadata = {
            type: type,
        };
        return new File([data], name, metadata);
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
                        <ImageSelector
                            value={imageSelectorValue}
                            defaultImageOptions={defaultImageOptions}
                            onChange={(e) => handleChange(e)}
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
                <Button
                    variant="contained"
                    onClick={() => onSubmit(imageSelectorValue)}
                >
                    Save
                </Button>
            </Modal.Actions>
        </Modal>
    );
});
