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
    console.log('Files Array: ', files);

    useEffect(() => {
        setData('value', files);
    }, [files, setData]);

    const uploadFile = async (files, insightId, projectId) => {
        try {
            const upload = await monolithStore.uploadFile(
                files,
                insightId,
                projectId,
            );
            console.log('Upload Result:', upload);
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    };
    const handleFileChange = async (uploadedFiles) => {
        setFiles(uploadedFiles);
        const insightId = state.insightId,
            projectId = '66a2a9ad-056f-4e4a-ae1c-b28cfd4331f8';
        try {
            const uploadResult = await uploadFile(
                uploadedFiles,
                insightId,
                projectId,
            );
            console.log('Uploaded File Details:', uploadResult);
        } catch (error) {
            console.error('Error in file upload:', error);
        }
    };

    return (
        <FileDropzone
            style={{ ...data.style }}
            onChange={handleFileChange}
            multiple={false}
            valid={true}
            {...attrs}
        />
    );
});
