import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { FileDropzone, TextField } from '@semoss/ui';
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

        // track the value
        const [value, setValue] = useState('');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const { monolithStore, configStore } = useRootStore();
        // const { id } = useEngine();

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

        const dropzoneHandler = async (value) => {
            // get temporary blob path for image and set as source to UI image element
            // this may not be necessary after reactor is running
            // we may want a confirm image upload button or modal
            // if we had that this could be re-introduced
            const imageUrl = URL.createObjectURL(value);
            setData(path, imageUrl as PathValue<D['data'], typeof path>);

            // // from roses branch, should work after merge
            // // packages/legacy/core/store/pixels/index.js
            // const upload = monolithStore.uploadImage(value, id);
            // console.log({upload})

            // // other possible approach
            // // this is currently failing due to user permission issue, this may not be viable
            // const upload = await monolithStore.uploadFile(
            //     // [data.PROJECT_UPLOAD],
            //     // configStore.store.insightID,
            //     // appId,
            //     // path,

            //     [value],
            //     configStore.store.insightID,
            //     id,
            //     path,
            // );
            // console.log({ upload });
            // // after upload is confirmed replace placeholder blob url src
            // const uploadImageUrl = upload.src // check key
            // setData(path, uploadImageUrl as PathValue<D['data'], typeof path>);

            // // other possible approach
            // // automatically run reactor and get image url
            // // await response and assign image url to src

            // // need to find the correct reactor
            // const pixel = `CreateImage ( url = [ "${
            //     imageUrl
            // }" ]);`;

            // const { pixelReturn } = await monolithStore.runQuery<[AppMetadata]>(
            //     pixel,
            // );

            // const app = pixelReturn[0].output;

            // const newImageUrl = URL.createObjectURL(value);
            // setData(path, newImageUrl as PathValue<D['data'], typeof path>);
        };

        const submitHandler = (args) => {
            args.preventDefault();
        };

        return (
            <form onSubmit={submitHandler}>
                <FileDropzone
                    imageSelector={true} // <--- is this valid in rose's branch?
                    description="Browse"
                    onChange={(value) => dropzoneHandler(value)}
                />
                {/* <button>submit</button> */}
            </form>
        );
    },
);
