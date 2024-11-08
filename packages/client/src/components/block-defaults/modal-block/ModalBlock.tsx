import { CSSProperties, FC } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Modal as MuiModal,
    Box,
    Typography,
    Button,
    IconButton,
    styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PreviewIcon from '@mui/icons-material/Visibility';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Slot } from '@/components/blocks';

export interface ModalBlockDef extends BlockDef<'modal'> {
    widget: 'modal';
    data: {
        style: CSSProperties;
        title: string;
        showActions: boolean;
        submitLabel: string;
        cancelLabel: string;
        previewLabel: string;
        fullWidth: boolean;
        maxWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        minWidth: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
        designMode: boolean;
        isOpen: boolean;
    };
    slots: {
        content: true;
    };
}

interface ModalContentProps {
    data: ModalBlockDef['data'];
    handleClose: () => void;
    handleSubmit: () => void;
    slots: Record<string, any>;
    isPreview?: boolean;
    handlePreview?: () => void;
}

const StyledModalContainer = styled(Box, {
    shouldForwardProp: (prop) =>
        !['maxwidth', 'isPreview'].includes(prop as string),
})<{ maxwidth: string; isPreview: boolean }>(
    ({ theme, maxwidth, isPreview }) => ({
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[2],
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(4),
        maxHeight: '95vh',
        height: isPreview ? '94vh' : 'auto',
        overflow: 'auto',
        ...(maxwidth && {
            width: '90%',
            maxWidth: maxwidth,
        }),
    }),
);

const StyledModalHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
}));

const StyledContentArea = styled(Box, {
    shouldForwardProp: (prop) =>
        !['isDesignMode', 'isPreview'].includes(prop as string),
})<{ isDesignMode: boolean; isPreview: boolean }>(
    ({ theme, isDesignMode, isPreview }) => ({
        marginBottom: theme.spacing(2),
        minHeight: 100,
        border: '1px dashed',
        borderColor: theme.palette.primary.main,
        borderRadius: theme.shape.borderRadius,
        padding: theme.spacing(2),
        height: isPreview ? '65vh' : 'auto',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        opacity: !isDesignMode && !isPreview ? 0.7 : 1,
        '& > *': {
            width: '100%',
        },
        '&:empty::after': {
            content: isDesignMode ? '"Drop components here"' : '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: theme.palette.text.disabled,
            pointerEvents: 'none',
        },
    }),
);

const StyledModalActions = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
    borderTop: `1px solid ${theme.palette.divider}`,
}));

const StyledPreviewButton = styled(Button)(({ theme }) => ({
    fontSize: '0.75rem',
}));

const StyledLayoutBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isDesignMode',
})<{ isDesignMode: boolean }>(({ theme, isDesignMode }) => ({
    position: 'relative',
    margin: theme.spacing(2),
    border: '2px dashed',
    borderColor: isDesignMode
        ? theme.palette.primary.main
        : theme.palette.divider,
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
}));

const PreviewButtonWrapper = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: -36, // Position above the modal
    right: 0,
    zIndex: 1,
    display: 'flex',
    gap: theme.spacing(0.5),
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
}));

const ModalContent: FC<ModalContentProps> = observer(
    ({
        data,
        handleClose,
        handleSubmit,
        slots,
        isPreview = false,
        handlePreview,
    }) => {
        const getWidthValue = (
            size: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
        ): string => {
            switch (size) {
                case 'xs':
                    return '444px';
                case 'sm':
                    return '600px';
                case 'md':
                    return '900px';
                case 'lg':
                    return '1200px';
                case 'xl':
                    return '1536px';
                default:
                    return '444px';
            }
        };

        const minWidth = getWidthValue(data.minWidth);
        const maxWidth = data.fullWidth
            ? getWidthValue(data.maxWidth)
            : undefined;
        return (
            <StyledModalContainer
                maxwidth={maxWidth ?? minWidth}
                isPreview={isPreview}
                style={{ minWidth }}
            >
                {!isPreview && data.designMode && (
                    <PreviewButtonWrapper>
                        <StyledPreviewButton
                            size="small"
                            onClick={handlePreview}
                            startIcon={<PreviewIcon />}
                            variant="contained"
                        >
                            {data.previewLabel}
                        </StyledPreviewButton>
                    </PreviewButtonWrapper>
                )}
                <StyledModalHeader>
                    <Typography variant="h6" component="h2">
                        {data.title}
                    </Typography>
                    {isPreview && (
                        <IconButton onClick={handleClose} size="small">
                            <CloseIcon />
                        </IconButton>
                    )}
                </StyledModalHeader>

                <StyledContentArea
                    isDesignMode={data.designMode}
                    isPreview={isPreview}
                >
                    <Slot slot={slots.content} />
                </StyledContentArea>

                {data.showActions && (
                    <StyledModalActions>
                        <Button onClick={handleClose} variant="outlined">
                            {data.cancelLabel}
                        </Button>
                        <Button onClick={handleSubmit} variant="contained">
                            {data.submitLabel}
                        </Button>
                    </StyledModalActions>
                )}
            </StyledModalContainer>
        );
    },
);

export const ModalBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, slots, setData, listeners } =
        useBlock<ModalBlockDef>(id);

    const handleClose = () => {
        setData('isOpen', false);
    };

    const handleSubmit = () => {
        listeners.onSubmit();
        handleClose();
    };

    const handlePreview = () => {
        setData('isOpen', true);
    };
    const modalContentProps: ModalContentProps = {
        data,
        handleClose,
        handleSubmit,
        slots,
        isPreview: data.isOpen,
        handlePreview,
    };
    // Design Mode View
    if (data.designMode) {
        return (
            <StyledLayoutBox {...attrs} isDesignMode={true}>
                <ModalContent {...modalContentProps} />
            </StyledLayoutBox>
        );
    }
    // Non-Design Mode View - Simple view with preview button
    return (
        <>
            <Box {...attrs} sx={{ position: 'relative', m: 2 }}>
                {/* Preview Button */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        bgcolor: 'background.paper',
                        cursor: 'pointer',
                    }}
                >
                    <StyledPreviewButton
                        size="small"
                        onClick={handlePreview}
                        startIcon={<PreviewIcon />}
                        variant="contained"
                    >
                        {data.previewLabel}
                    </StyledPreviewButton>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 2 }}
                    >
                        Modal: {data.title}
                    </Typography>
                </Box>

                {/* Preview Modal */}
                {data.isOpen && (
                    <MuiModal
                        open={true}
                        onClose={handleClose}
                        sx={{
                            zIndex: 1500,
                            '& .MuiBackdrop-root': {
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            },
                        }}
                    >
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <ModalContent {...modalContentProps} />
                        </Box>
                    </MuiModal>
                )}
            </Box>
        </>
    );
});
