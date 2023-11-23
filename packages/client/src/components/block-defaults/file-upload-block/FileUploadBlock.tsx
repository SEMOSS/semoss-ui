//! FILE IMPORTS
//* State Management & Helpers
import { BlockDef, BlockComponent } from '@/stores';
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';

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
    //* Get the block data
    const { attrs, data, setData } = useBlock<FileUploadBlockDef>(id);

    const handleFileChange = (e) => {
        //* Get the name of uploaded file
        const file = e.target.files[0];

        //* Check if there is an uploaded file
        if (e.target.files?.length > 0 && file) {
            //* Set the data to the block
            setData('name.path', file.name);
            setData('name.type', file.type);
        }
    };

    return (
        <input
            type="file"
            accept=".pdf,.doc,.docx,xlsx,.xls,.csv,.txt"
            style={{ ...data.style }}
            onChange={handleFileChange}
            {...attrs}
        />
    );
});
