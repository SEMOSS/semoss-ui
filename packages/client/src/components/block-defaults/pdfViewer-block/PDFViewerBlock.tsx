import React, { useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockComponent, BlockDef } from '@/stores';
import { useBlock, useRootStore } from '@/hooks';
import { Button, Typography, CircularProgress, Stack } from '@mui/material';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ClearIcon from '@mui/icons-material/Clear';
import { useParams } from 'react-router-dom';
import { Env } from '@/env';

export interface PDFViewerBlockDef extends BlockDef<'pdfViewer'> {
    widget: 'pdfViewer';
    data: {
        style: {
            width: string;
            height: string;
            padding: string;
        };
        selectedPdf: string | null;
    };
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    '& .MuiDialogActions-root': {
        padding: theme.spacing(1),
    },
    '& .MuiDialog-paper': {
        width: '80%',
        height: '85%',
        maxWidth: '100%',
        maxHeight: '100%',
    },
}));

export const PDFViewerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<PDFViewerBlockDef>(id);
    const [openModal, setOpenModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfContent, setPdfContent] = useState<string | null>(null);
    const { configStore, monolithStore } = useRootStore();
    const { appId } = useParams();

    const downloadAndPrepareFile = useCallback(async (path: string) => {
        try {
            setLoading(true);

            // First call to get the jobId
            const response = await monolithStore.runQuery<[string]>(
                `DownloadAsset(filePath=["${path}"], space=["${appId}"]);`,
            );

            const fileKey = response?.pixelReturn[0]?.output;

            if (!fileKey) {
                throw new Error('Failed to get file key');
            }

            // Create the download URL
            const url = `${Env.MODULE}/api/engine/downloadFile?insightId=${
                configStore?.store?.insightID
            }&fileKey=${encodeURIComponent(fileKey as string)}`;

            // Use fetch with no-cors mode and get blob
            const fileResponse = await fetch(url, {
                method: 'GET',
                headers: new Headers({
                    'Content-Type': 'application/pdf',
                }),
            });
            const blob = await fileResponse.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    // Ensure it has the correct data URL prefix
                    if (
                        !base64data.startsWith('data:application/pdf;base64,')
                    ) {
                        const pdfPrefix = 'data:application/pdf;base64,';
                        const base64Content = base64data.replace(
                            /^data:.*?;base64,/,
                            '',
                        );
                        resolve(pdfPrefix + base64Content);
                    } else {
                        resolve(base64data);
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            setError('Failed to load PDF');
            setLoading(false);
        }
    }, []);

    const handleOpenModal = useCallback(async () => {
        if (!data?.selectedPdf) return;
        setOpenModal(true);
        setLoading(true);
        setError(null);
        try {
            const content = await downloadAndPrepareFile(data?.selectedPdf);
            setPdfContent(content as string);
        } catch (err) {
            setError('Failed to load PDF');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [data.selectedPdf]);

    const handleCloseModal = useCallback(() => {
        setOpenModal(false);
        setLoading(false);
        setError(null);
    }, []);

    // Extract file name from path
    const fileName = data.selectedPdf?.split('/').pop() || '';

    // Clear the selection
    const handleClear = useCallback(() => {
        setData('selectedPdf', '', true);
        setPdfContent(null);
    }, [setData]);

    return (
        <>
            <div style={data.style} {...attrs}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Button
                        onClick={handleOpenModal}
                        variant="contained"
                        color="secondary"
                        disabled={!data?.selectedPdf}
                    >
                        View PDF
                    </Button>
                    {data?.selectedPdf && (
                        <Button
                            onClick={handleClear}
                            variant="outlined"
                            color="secondary"
                            startIcon={<ClearIcon />}
                        >
                            Clear
                        </Button>
                    )}
                </Stack>
                {data?.selectedPdf && (
                    <Typography variant="body2" style={{ marginTop: '10px' }}>
                        Selected PDF: {fileName}
                    </Typography>
                )}
            </div>
            <BootstrapDialog
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="pdf-viewer-modal"
                aria-describedby="modal-to-display-pdf"
            >
                <DialogTitle>{fileName || ''}</DialogTitle>
                <IconButton
                    aria-label="close"
                    onClick={handleCloseModal}
                    sx={(theme) => ({
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: theme.palette.grey[500],
                    })}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    {loading && <CircularProgress />}
                    {error && <Typography color="error">{error}</Typography>}
                    {data?.selectedPdf && (
                        <iframe
                            src={pdfContent}
                            style={{ border: 'none' }}
                            width="100%"
                            height="98%"
                            title={fileName}
                        ></iframe>
                    )}
                </DialogContent>
            </BootstrapDialog>
        </>
    );
});
