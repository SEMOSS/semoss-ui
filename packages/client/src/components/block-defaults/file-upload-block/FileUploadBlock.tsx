//* State Management & Helpers
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';

//* Hooks
import { useBlock } from '@/hooks';

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
        //? Get Users Uploaded File Information
        const file = e.target.files[0];

        //? Check for Users Uploaded File
        if (e.target.files?.length > 0 && file) {
            console.log('Users File: ', file);
            //? Set the data (name, type) of the file
            setData('name.path', file.name);
            setData('name.type', file.type);
            console.log('Name & Type: ', file.name, '~', file.type);
            // TODO Might want to add a file size limit to the block in the future, especially when allowing mulitple files to be uploaded at once
            console.log('File Size: ', file.size / 1024 / 1024, 'MB');
            console.log('File Size: ', file.size / 1024 / 1024 / 1024, 'GB');
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
