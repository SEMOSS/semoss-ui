//* State Management & Helpers
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';

//* Hooks
import { useBlock } from '@/hooks';

//* Create a Data Object for the Uploaded File ~ Name, Type, Size
export interface FileUploadBlockDef extends BlockDef<'file-upload'> {
    widget: 'file-upload';
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

export const FileUploadBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<FileUploadBlockDef>(id);

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            //? Calculate File Size in KB
            const fileSizeKB = file.size / 1024;
            console.log(fileSizeKB);

            //* Display File Size in KB or MB
            let displaySize;
            if (fileSizeKB >= 1024) {
                //? at least 1 MB
                displaySize = `${(fileSizeKB / 1024).toFixed(2)} MB`;
            } else {
                //? less than 1 MB
                displaySize = `${fileSizeKB.toFixed(2)} KB`;
            }
            //* Set File Data
            setData('name.path', file.name);
            setData('name.type', file.type);
            setData('name.size', displaySize);
            console.log('File Size: ', displaySize);
        }
    };

    return (
        <input
            type="file"
            accept=".pdf,.doc,.docx,xlsx,.xls,.csv,.txt"
            style={{
                ...data.style,
            }}
            {...attrs}
            onChange={handleFileChange}
        />
    );
});
