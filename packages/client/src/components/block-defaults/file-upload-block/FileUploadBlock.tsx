//! FILE IMPORTS
//* State Management & Helpers
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';

//* Hooks
import { useBlock } from '@/hooks';

//* Block Settings
export interface FileUploadBlockDef extends BlockDef<'file-upload'> {
    widget: 'file-upload';
    data: {
        style: CSSProperties;
        name: {
            path: string | null;
            type: string | null;
        };
    };
    slots: never;
}

export const FileUploadBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<FileUploadBlockDef>(id);

    const handleFileChange = (e) => {
        //? Get Uploaded File Info
        const file = e.target.files[0];
        console.log('File: ', file);

        //* Check if there is an uploaded file
        if (e.target.files?.length > 0 && file) {
            //? Set data for the file name and type
            setData('name.path', file.name);
            setData('name.type', file.type);
            console.log('Uploaded File Name: ', file.name);
            console.log('Uploaded File Type: ', file.type);
        }
        console.log(e.target.files[0].value);
    };

    return (
        <input
            type="file"
            accept=".pdf,.doc,.docx,xlsx,.xls,.csv,.txt"
            style={{
                cursor: 'pointer',
                ...data.style,
            }}
            {...attrs}
            onChange={handleFileChange}
        />
    );
});
