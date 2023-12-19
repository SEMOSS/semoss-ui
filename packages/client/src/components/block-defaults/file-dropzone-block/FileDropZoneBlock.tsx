//* State Management & Helpers
import { useState, useEffect, CSSProperties } from 'react';
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
        name: string;
        value?: File[] | null;
        size?: number;
        sizeLimit?: string;
        maxFileSize?: number;
        type: string;
        extensions?: string[];
        onChange?: (files: File[]) => void;
        multiple?: boolean;
        valid?: boolean;
    };
    slots: never;
}

export const FileDropZoneBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = hooks.useBlock<FileDropZoneBlockDef>(id);

    const [files, setFiles] = useState<File[]>({ ...data.value });
    console.log('Files: ', files);

    useEffect(() => {
        setData('value', files);
    }, [files, setData]);

    const handleFileChange = (uploadedFiles: File[]) => {
        setFiles(uploadedFiles);
    };

    const handleFileDelete = (fileName: string) => {
        setFiles(files.filter((file) => file.name !== fileName));
    };

    return (
        <FileDropzone
            style={{ ...data.style }}
            onDeleted={handleFileDelete}
            onChange={handleFileChange}
            multiple={true}
            valid={true}
            {...attrs}
        />
    );
});
