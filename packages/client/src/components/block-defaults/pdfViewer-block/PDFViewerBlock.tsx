import React, { useEffect, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { BlockComponent, BlockDef } from '@/stores';
import { useBlock, useRootStore } from '@/hooks';
import { Typography, CircularProgress, Paper, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
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

// Styled components
const ViewerContainer = styled(Paper)(({ theme }) => ({
    position: 'relative',
    height: '100%',
    padding: theme.spacing(1),
}));

const Header = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(0),
}));

const LoadingContainer = styled(Box)({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
});

const ErrorMessage = styled(Typography)(({ theme }) => ({
    padding: theme.spacing(2.5),
    color: theme.palette.error.main,
}));

const PDFContainer = styled(Box)(({ theme }) => ({
    height: '92%',
    flex: 1,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
}));

const PDFObject = styled('object')({
    width: '100%',
    height: '100%',
});

const PDFIframe = styled('iframe')({
    width: '100%',
    border: 'none',
    height: 'calc(100% - 35px)', // Subtract header height
    minHeight: 340,
});

export const PDFViewerBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<PDFViewerBlockDef>(id);
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

    useEffect(() => {
        if (data?.selectedPdf) {
            downloadAndPrepareFile(data?.selectedPdf)
                .then((content) => {
                    setPdfContent(content as string);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error('Error loading PDF:', err);
                    setError('Failed to load PDF');
                    setLoading(false);
                });
        } else {
            setPdfContent(null);
            setError(null);
            setLoading(false);
        }
    }, [data.selectedPdf]);

    // Extract file name from path
    const fileName = data.selectedPdf?.split('/').pop() || '';

    // Clear the selection
    const handleClear = useCallback(() => {
        setData('selectedPdf', '', true);
        setPdfContent(null);
        setError(null);
    }, [setData]);

    if (!data.selectedPdf) {
        return (
            <div style={data.style} {...attrs}>
                <Typography variant="body2" color="textSecondary">
                    Select a PDF from settings to view it here
                </Typography>
            </div>
        );
    }

    return (
        <>
            <ViewerContainer elevation={2} {...attrs}>
                <Header>
                    <Typography variant="h6" noWrap sx={{ flex: 1 }}>
                        {fileName}
                    </Typography>
                    <IconButton
                        onClick={handleClear}
                        size="small"
                        aria-label="clear pdf"
                        edge="end"
                    >
                        <ClearIcon />
                    </IconButton>
                </Header>

                {loading && (
                    <LoadingContainer>
                        <CircularProgress />
                    </LoadingContainer>
                )}

                {error && <ErrorMessage variant="body1">{error}</ErrorMessage>}

                {pdfContent && !loading && !error && (
                    <PDFContainer>
                        <PDFObject data={pdfContent} type="application/pdf">
                            <PDFIframe src={pdfContent} title={fileName} />
                        </PDFObject>
                    </PDFContainer>
                )}
            </ViewerContainer>
        </>
    );
});
