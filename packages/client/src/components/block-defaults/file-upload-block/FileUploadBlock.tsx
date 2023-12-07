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
            size: number | null;
        };
    };
    slots: never;
}

export const FileUploadBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<FileUploadBlockDef>(id);

    const handleFileChange = (e) => {
        //* Get the File
        const file = e.target.files[0];

        // TODO Might want to add a file size limit to the block in the future, especially when allowing mulitple files to be uploaded at once
        //? Store the File on Server?
        //* File Size in MB
        const exactFileSize = (file.size / (1024 * 1024)).toFixed(4);
        console.log(exactFileSize, 'MB');

        //? Check for Users Uploaded File
        if (e.target.files?.length > 0 && file) {
            //? Set data for name, type, size
            setData('name.path', file.name);
            setData('name.type', file.type);
            setData(
                'name.size',
                file.size < 20000000 ? Number(exactFileSize) : null,
            );
            console.log('Size: ', exactFileSize);
        }

        //? Log file size details
        //? Max File Size to <20MB?
        //* Blueprint AI Bill of Rights = 11MB (for reference)
        console.log('Less then 20 MB? ', file.size < 20000000 ? true : false);
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
