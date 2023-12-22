import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FileDropzone, useNotification } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

import { useRootStore, useEngine } from '@/hooks';
import { ContrastOutlined } from '@mui/icons-material';

interface ImageInputSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const ImageInputSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: ImageInputSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState('');
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const { monolithStore, configStore } = useRootStore();
        const notification = useNotification();

        // // image upload is currently throwing an error saying Im not in the right context to access the engine id but doesnt seem to work even with the project ID or insight ID set manually
        // // currently getting a 400 error with the message --> User does not have access to this engine or the engine id does not exist

        let engineId;
        try {
            const { id } = useEngine();
            engineId = id;
        } catch {
            console.log(
                'Error: Could not retrieve engineId from context. Uploaded image files will not be saved.',
            );
        }

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        // creates a file that for imageUpload
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

        const dropzoneHandler = async (imageArg) => {
            // get temporary blob path for image and set as source to UI image element
            // this may not be necessary after reactor is running
            const imageUrl = URL.createObjectURL(imageArg);
            setData(path, imageUrl as PathValue<D['data'], typeof path>);

            await createFile(imageArg.src, imageArg.name, imageArg.type)
                .then((file) => monolithStore.uploadImage(file, engineId))
                .then((res) => {})
                .catch((error) => {
                    notification.add({
                        color: 'error',
                        message: `Image Upload Error: ${error}`,
                    });
                    console.log({ error });
                });

            // uploadImage --> packages/legacy/core/store/pixels/index.js
        };

        const submitHandler = (args) => {
            args.preventDefault();
        };

        return (
            <form onSubmit={submitHandler}>
                <FileDropzone
                    // imageSelector={true} // <--- used on 103 branch
                    description="Browse"
                    onChange={(value) => dropzoneHandler(value)}
                />
            </form>
        );
    },
);
