//* State Management & Helpers
import { useState, CSSProperties } from 'react';
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
        type: string;
        typeList: string[];
        size?: number;
        sizeLimit?: string;
    };
    slots: never;
}

export const FileDropZoneBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = hooks.useBlock<FileDropZoneBlockDef>(id);

    //* Users File Dropzone States
    // const [file, setFile] = useState<File | null>(null);
    // const [fileSize, setFileSize] = useState<number | null>(null);
    // const [fileSizeLimit, setFileSizeLimit] = useState<string | null>(null);
    // const [selectedFile, setSelectedFile] = useState(data);
    const [isFileValid, setIsFileValid] = useState<boolean>(false);

    const handleFileChange = (file: File) => {
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
            // setData('listTypes: ', data.typeList);
            // setData('type', file.type);
            // setData('size', displaySize);
            console.log('Name: ', file.name);
            console.log('Type: ', file.type);
            console.log('Size: ', displaySize);
            console.log('Selected File: ', file);

            // setSelectedFile(file);

            //? Valid / Invalid Prop Status
            if (data.size > 0) {
                const valid = isFileValid === true;
                return setIsFileValid(valid);
            } else {
                const valid = isFileValid === false;
                //? Check File Value Status & Remove from Memory
                return setIsFileValid(valid);
            }
        }
    };

    return (
        <FileDropzone
            style={{ ...data.style }}
            multiple={true}
            onChange={handleFileChange}
            // value={}
            valid={true}
            {...attrs}
        />
    );
});
