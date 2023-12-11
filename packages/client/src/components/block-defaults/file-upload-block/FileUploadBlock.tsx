//* State Management & Helpers
import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';

//* Hooks
import { useBlock } from '@/hooks';
import { useRootStore } from '@/hooks/useRootStore';

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
    const { monolithStore, configStore } = useRootStore();

    const handleFileChange = async (e) => {
        const files = e.target.files;
        const file = e.target.files[0];
        console.log('File: ', file);

        //string that will become the filePaths
        let fileLocations = '';
        try {
            //upload the file
            const upload = await monolithStore.uploadFile(
                file,
                configStore.store.insightID,
            );

            upload.map((file, index) => {
                const { fileLocation } = file;
                if (index + 1 === upload.length) {
                    //last member
                    fileLocations = fileLocations += `"${fileLocation}"`;
                } else {
                    //all other members
                    fileLocations = fileLocations += `"${fileLocation}", `;
                }
            });
            // Embedding the File
            await monolithStore.runQuery(`
                CreateEmbeddingsFromDocuments( engine= "377e2321-90b7-4856-b3e2-9f6c28663049", filePaths= [${fileLocations}])
            `);
        } catch (e) {
            console.error(e);
        }

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
