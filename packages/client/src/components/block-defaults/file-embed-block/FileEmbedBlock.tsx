import { useState, useEffect, CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockDef, BlockComponent } from '@/stores';
import { FileDropzone } from '@semoss/ui';
import * as hooks from '@/hooks';

export interface FileEmbedBlockDef extends BlockDef<'file-embed'> {
    widget: 'file-embed';
    data: {
        style: CSSProperties;
        name: string;
        fileName?: string;
        fileLocation?: string;
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

export const FileEmbedBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = hooks.useBlock<FileEmbedBlockDef>(id);
    const { state } = hooks.useBlocks();
    const { monolithStore } = hooks.useRootStore();

    const [files, setFiles] = useState<File[]>({ ...data.value });

    if (!data.fileName || !files || typeof files === 'undefined') return;

    //* grab the uploaded file uploaded
    const usersFileName = data.fileName;
    console.log('File Name: ', usersFileName);
    useEffect(() => {
        setFiles(files);
        setData('value', files);
        setData('fileName', usersFileName);
    }, [files, usersFileName]);

    const uploadFile = async (files, insightId) => {
        try {
            const upload = await monolithStore.uploadFile(files, insightId);
            //* file object
            setFiles(files);
            console.log('Result Obj:', upload[0]);

            //* file location
            const fileLocationUpload = upload[0].fileLocation;
            setData('fileLocation', fileLocationUpload);
            console.log('Location Mock Copy:', fileLocationUpload);

            //* file name
            const fileNameUpload = upload[0].fileName;
            setData('fileName', fileNameUpload);
            console.log('Name Mock Copy:', fileNameUpload);
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };

    const handleFileChange = async (uploadedFiles) => {
        const insightId = state.insightId;
        try {
            const uploadResult = await uploadFile(uploadedFiles, insightId);
            setFiles(uploadedFiles);
            setData('value', uploadedFiles);
            setData('fileName', uploadedFiles.name);
            console.log('File Upload:', uploadedFiles);

            return uploadResult;
        } catch (error) {
            console.error('Error in file upload:', error);
        }
    };

    return (
        <FileDropzone
            style={{ ...data.style }}
            onChange={handleFileChange}
            multiple={false}
            extensions={[
                '.pdf',
                '.csv',
                '.xlsx',
                '.txt',
                '.doc',
                '.ppt',
                '.docx',
                '.pptx',
            ]}
            valid={true}
            {...attrs}
        />
    );
});
