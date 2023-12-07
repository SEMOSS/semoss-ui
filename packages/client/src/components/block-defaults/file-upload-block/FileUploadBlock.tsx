//* State Management & Helpers
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';

//* Hooks
import { useBlock } from '@/hooks';

//* File Block Settings
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

//* File Upload Block
export const FileUploadBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<FileUploadBlockDef>(id);

    const handleFileChange = (e) => {
        //? Get Users Uploaded File Information
        const file = e.target.files[0];

        //* Check if there is an uploaded file
        if (e.target.files?.length > 0 && file) {
            console.log('Users File: ', file);
            //? Set data for the file name and type
            setData('name.path', file.name);
            setData('name.type', file.type);
            console.log('Name & Type: ', file.name, file.type);
            console.log('File Size: ', file.size);
        }
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
