import React, { useState, useEffect } from 'react';
import {
    Button,
    Table,
    styled,
    Typography,
    Modal,
    LinearProgress,
    FileDropzone,
} from '@semoss/ui';
import { Add } from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { useEngine, useRootStore } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledTopDiv = styled('div')(() => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
}));

const StyledIcon = styled(Add)(({ theme }) => ({
    marginRight: theme.spacing(1),
}));

type FileUploadForm = {
    PROJECT_UPLOAD: File;
};

export const EngineFilePage = () => {
    const [open, setOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileList, setFileList] = useState<[]>([]);

    //Grabbing Engine Id for document creation
    const { id } = useEngine();

    const { monolithStore, configStore } = useRootStore();

    const { handleSubmit, control } = useForm<FileUploadForm>({
        defaultValues: {
            PROJECT_UPLOAD: null,
        },
    });

    //Method that is called for embedding a file

    const embedFile = handleSubmit(async (data: FileUploadForm) => {
        setIsLoading(true);
        try {
            //upload the file
            const upload = await monolithStore.uploadFile(
                [data.PROJECT_UPLOAD],
                configStore.store.insightID,
            );

            const { fileLocation } = upload[0];

            // Embedding the File
            await monolithStore.runQuery(`
                CreateEmbeddingsFromDocuments( engine= "${id}", filePaths= ["${fileLocation}"])
            `);
        } catch (e) {
            console.error(e);
        } finally {
            //turn off loading
            setIsLoading(false);
            setOpen(false);
        }
    });

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>File Explorer</Typography>
                <Button onClick={() => setOpen(true)}>
                    <StyledIcon fontSize="small" /> Embed New Document
                </Button>
            </StyledTopDiv>

            <StyledTableContainer>Work In Progress</StyledTableContainer>

            <Modal open={open} onClose={() => setOpen(false)} fullWidth>
                <Modal.Title>Upload Files</Modal.Title>
                <form onSubmit={embedFile}>
                    <Modal.Content>
                        <Controller
                            name={'PROJECT_UPLOAD'}
                            control={control}
                            rules={{}}
                            render={({ field }) => {
                                console.log(field.value);
                                return (
                                    <FileDropzone
                                        multiple={false}
                                        value={field.value}
                                        description="Drag and Drop a pdf or a csv file to embed"
                                        extensions={['.pdf', '.csv']}
                                        disabled={isLoading}
                                        onChange={(newValues) => {
                                            field.onChange(newValues);
                                        }}
                                    />
                                );
                            }}
                        />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            type="submit"
                            variant={'contained'}
                            disabled={isLoading}
                        >
                            Embed
                        </Button>
                    </Modal.Actions>
                </form>
                {isLoading && <LinearProgress />}
            </Modal>
        </StyledContainer>
    );
};
