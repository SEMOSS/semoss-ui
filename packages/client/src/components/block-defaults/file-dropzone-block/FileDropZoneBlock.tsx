//* State Management & Helpers
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';

//* UI Blocks
import { FileDropzone } from '@semoss/ui';

//* Hooks
import * as hooks from '@/hooks';

export interface FileDropZoneBlockDef extends BlockDef<'file-dropzone'> {
    widget: 'file-dropzone';
    data: {
        style: CSSProperties;
        name: {
            path: string | null;
            type: string | null;
            size?: number | null;
        };
    };
    slots: never;
}

export const FileDropZoneBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = hooks.useBlock<FileDropZoneBlockDef>(id);

    const handleFileChange = (file: File | null) => {
        if (file) {
            const fileSizeKB = file.size / 1024;
            let displaySize;
            if (fileSizeKB >= 1024) {
                //? at least 1 MB
                displaySize = `${(fileSizeKB / 1024).toFixed(2)} MB`;
            } else {
                //? less than 1 MB
                displaySize = `${fileSizeKB.toFixed(2)} KB`;
            }

            setData('name.path', file.name);
            setData('name.type', file.type);
            setData('name.size', displaySize);
        }
    };

    return (
        <FileDropzone
            style={{ ...data.style }}
            onChange={handleFileChange}
            {...attrs}
        />
    );
});
