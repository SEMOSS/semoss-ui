import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import html2canvas from 'html2canvas';
import { ArrowBack, Close, PreviewOutlined } from '@mui/icons-material';

import {
    styled,
    createFilterOptions,
    Typography,
    Modal,
    IconButton,
    Button,
    TextField,
    Autocomplete,
    useNotification,
    RadioGroup,
    Box,
    Tooltip,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { useBlocks } from '@semoss/renderer';
import { SECTION_ORDER } from '../blocks-workspace/menus/default-menu';
import { getBlockElement } from '@/stores';
import { DesignerMenuItem } from '../blocks-workspace/menus/menu-types';
import { CommunityLayers } from './CommunityLayers';

const StyledModalHeading = styled(Modal.Title)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
});

const StyledTitle = styled(Typography)({
    fontWeight: 500,
});

const StyledModalContent = styled(Modal.Content)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingTop: `${theme.spacing(1)}!important`,
    width: '100%',
}));

const StyledButtonGroupIconButton = styled(IconButton)(({ theme }) => ({
    backgroundColor: 'white',
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.primary.dark,
    alignSelf: 'flex-start',
    fontSize: theme.typography.pxToRem(16),
    fontWeight: 500,
    '&:hover': {
        backgroundColor: 'transparent',
    },
    padding: '0px',
}));

interface EditDetailsModalProps {
    isOpen: boolean;
    selected: any;
    onClose: (reset?: boolean) => void;
    isEdit?: boolean;
    block_json?: DesignerMenuItem;
}

interface AddAsClientBlockTypes {
    name: string;
    section: string;
    helperText: string;
    visibility: 'private' | 'public';
    block_json: any;
}

export const AddAsClientBlock: AddAsClientBlockTypes = {
    name: '',
    section: '',
    helperText: '',
    visibility: 'private',
    block_json: {},
};

export const AddClientBlockModal = (props: EditDetailsModalProps) => {
    const { isOpen, selected, onClose, isEdit, block_json } = props;
    const { control, setValue, reset, handleSubmit } =
        useForm<AddAsClientBlockTypes>({ defaultValues: AddAsClientBlock });
    const { monolithStore, configStore } = useRootStore();
    const { registry, state } = useBlocks();
    const notification = useNotification();
    const allowedKeys = ['widget', 'data', 'listeners', 'slots'];
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [imageDimensions, setImageDimensions] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });
    const [localBlockItem, setLocalBlockItem] = useState<any>([]);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (block_json) {
            setLocalBlockItem(structuredClone(block_json));
        }
    }, []);

    useEffect(() => {
        if (isEdit && block_json) {
            setValue('name', block_json.name ?? '');
            setValue('section', block_json.section ?? '');
            setValue('helperText', block_json.helperText ?? '');
        }
    }, [isEdit, block_json, setValue, isOpen]);

    const handleLayersPanelUpdate = (updatedJson: any) => {
        setLocalBlockItem((prev: any) => ({
            ...prev,
            json: updatedJson.json,
        }));
    };

    const handleFieldChange = (field: string, value: string) => {
        setLocalBlockItem((prev: any) => ({
            ...prev,
            [field]: value,
        }));
    };

    /**
     * Recursively processes the slots of a block to retain only the allowed keys.
     *
     * @param {any} value - The slots or part of slots to process.
     * @param {Record<string, any>} blocks - The entire blocks object for reference.
     * @returns {any} Processed slots with only allowed keys retained.
     */
    const processSlots = (value: any, blocks: Record<string, any>): any => {
        // Check if the current value is an array
        if (Array.isArray(value)) {
            return value.map(
                (item) =>
                    // If the item is a string and exists in blocks, process it
                    typeof item === 'string' && item in blocks
                        ? Object.fromEntries(
                              allowedKeys
                                  .filter((key) => key in blocks[item]) // Filter allowed keys
                                  .map((key) => [
                                      key,
                                      processSlots(blocks[item][key], blocks),
                                  ]), // Process each key recursively
                          )
                        : processSlots(item, blocks), // Recursively process item if not a string or not in blocks
            );
            // Check if the current value is an object
        } else if (typeof value === 'object' && value !== null) {
            return Object.fromEntries(
                Object.entries(value).map(([key, val]) => [
                    key,
                    processSlots(val, blocks), // Recursively process each entry
                ]),
            );
        } else {
            // Return value if it's neither an array nor an object
            return value;
        }
    };

    /**
     * This function is a wrapper around the useForm's handleSubmit function.
     * It processes the block's slots to remove any unnecessary keys and
     * recursively calls itself until all the slots are processed.
     *
     * Once the slots are processed, it calls the monolith's AddBlock query to
     * add the block to the monolith's database.
     *
     * @param {AddAsClientBlockTypes} data - The data to be sent to the monolith.
     *
     * @returns {Promise<void>}
     */
    const handleAddAsClientBlock = handleSubmit(
        async (data: AddAsClientBlockTypes) => {
            const block = state.blocks[selected];
            const newClientBlock = {
                widget: block.widget,
                data: block.data,
                listeners: block.listeners,
                slots: processSlots(block.slots, state.blocks),
            };

            const response = await monolithStore.runQuery<[true]>(
                `AddBlock(name=["${data.name}"], section=["${
                    data.section
                }"], json=["<encode>${JSON.stringify(
                    newClientBlock,
                )}</encode>"]);`,
            );
            const { output, operationType } = response.pixelReturn[0];

            if (operationType.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    message: 'Successfully added document',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }

            reset(AddAsClientBlock);
            onClose();
            setShowPreviewModal(false);
        },
    );

    const handleSaveAsClientBlock = async () => {
        const itemToSave = localBlockItem;
        if (!itemToSave) return;
        const updatedClientBlock = {
            widget: itemToSave.json?.widget,
            data: itemToSave.json?.data,
            listeners: itemToSave.json?.listeners,
            slots: itemToSave.json?.slots,
        };
        // try {
        //     const response = await monolithStore.runQuery<[true]>(
        //         `AddBlock(name=["${itemToSave.name}"], section=["${
        //             itemToSave.section
        //         }"], helperText=["${
        //             itemToSave.helperText
        //         }"], json=["<encode>${JSON.stringify(
        //             updatedClientBlock,
        //         )}</encode>"]);`,
        //     );

        //     console.log('Save response:', response);
        //     const { output, operationType } = response.pixelReturn[0];

        //     if (operationType.indexOf('ERROR') === -1) {
        //         notification.add({
        //             color: 'success',
        //             message: 'Successfully saved updated block',
        //         });
        //     } else {
        //         notification.add({
        //             color: 'error',
        //             message: output,
        //         });
        //     }
        // } catch (error) {
        //     console.error('Save error:', error);
        //     notification.add({
        //         color: 'error',
        //         message: 'Error occurred while saving block',
        //     });
        // }
        // reset(AddAsClientBlock);
        onClose();
        setShowPreviewModal(false);
    };
    const handleInputValidations = (val: string, field: string) => {
        if (!/^[a-zA-Z_-]*$/.test(val)) {
            return false;
        }
        return true;
    };

    /** html2canvas to PNG conversion */
    const handleCanvasPreview = async () => {
        const block = state.blocks[selected];
        if (block && block.id) {
            const element = getBlockElement(block.id) as HTMLElement;
            if (element) {
                // Capture the element's dimensions
                const elementWidth = element.offsetWidth;
                const elementHeight = element.offsetHeight;

                try {
                    const canvas = await html2canvas(element, {
                        backgroundColor: null,
                    });
                    const dataUrl = canvas.toDataURL('image/png');
                    console.log('Generated Image:', dataUrl);

                    // Scale the dimensions to be 1/2 of the original size
                    const scaledWidth = elementWidth / 2;
                    const scaledHeight = elementHeight / 2;

                    // Set the scaled dimensions
                    setImageDimensions({
                        width: scaledWidth,
                        height: scaledHeight,
                    });
                    setImagePreview(dataUrl);
                    setShowPreviewModal(true);
                } catch (error) {
                    console.error('Error generating image:', error);
                    setShowPreviewModal(false);
                }
            } else {
                console.warn(`No element found with data-block: ${block.id}`);
                setShowPreviewModal(false);
            }
        }
    };

    const handleCloseModals = () => {
        setLocalBlockItem([]);
        setShowPreviewModal(false);
        onClose();
    };

    const handleArrowBack = () => {
        setShowPreviewModal(false); // Close the second modal and show the first modal
    };

    return (
        <>
            <Modal open={isOpen && !showPreviewModal} fullWidth>
                <StyledModalHeading>
                    <StyledTitle variant="h6">
                        {isEdit ? 'Edit Block' : 'Add Block'}
                    </StyledTitle>
                    <IconButton size="small" onClick={handleCloseModals}>
                        <Close />
                    </IconButton>
                </StyledModalHeading>

                <StyledModalContent>
                    {isEdit && (
                        <Box sx={{ gap: '8px' }}>
                            <Typography
                                variant="subtitle1"
                                color="text.secondary"
                            >
                                Block Template
                            </Typography>
                            <CommunityLayers
                                item={localBlockItem}
                                onJsonUpdate={handleLayersPanelUpdate}
                            />
                        </Box>
                    )}
                    <Controller
                        name="name"
                        control={control}
                        render={({ field }) => {
                            return (
                                <Box sx={{ gap: '8px' }}>
                                    <Typography
                                        variant="subtitle1"
                                        color="text.secondary"
                                    >
                                        Block Name
                                    </Typography>
                                    <TextField
                                        value={field.value}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                            handleFieldChange(
                                                'name',
                                                e.target.value,
                                            );
                                        }}
                                        fullWidth
                                        //label="Name"
                                        error={
                                            !handleInputValidations(
                                                field.value,
                                                'name',
                                            )
                                        }
                                        helperText={
                                            !handleInputValidations(
                                                field.value,
                                                'name',
                                            )
                                                ? 'Name should only contain letters, hyphens, and underscores'
                                                : ''
                                        }
                                    />
                                </Box>
                            );
                        }}
                    />
                    <Controller
                        name="section"
                        control={control}
                        render={({ field }) => {
                            return (
                                <Box sx={{ gap: '8px' }}>
                                    <Typography
                                        variant="subtitle1"
                                        color="text.secondary"
                                    >
                                        Section
                                    </Typography>
                                    <Autocomplete
                                        freeSolo
                                        fullWidth
                                        value={field.value}
                                        options={SECTION_ORDER}
                                        onChange={(_, newValue) => {
                                            field.onChange(newValue);
                                            handleFieldChange(
                                                'section',
                                                newValue,
                                            );
                                        }}
                                        onInputChange={(_, newValue) => {
                                            field.onChange(newValue);
                                            handleFieldChange(
                                                'section',
                                                newValue,
                                            );
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                error={
                                                    !handleInputValidations(
                                                        field.value,
                                                        'section',
                                                    )
                                                }
                                                helperText={
                                                    !handleInputValidations(
                                                        field.value,
                                                        'section',
                                                    )
                                                        ? 'Section should only contain letters, hyphens, and underscores'
                                                        : ''
                                                }
                                            />
                                        )}
                                        multiple={false}
                                    />
                                </Box>
                            );
                        }}
                    />
                    {/* This section is commented out since the backend functionality is not implemented yet. */}
                    {/* <Controller
                        name="helperText"
                        control={control}
                        render={({ field }) => {
                            return (
                                <Box sx={{ gap: '8px' }}>
                                    <Typography
                                        variant="subtitle1"
                                        color="text.secondary"
                                    >
                                        Tooltip Description
                                    </Typography>
                                    <TextField
                                        value={field.value}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                            handleFieldChange(
                                                'helperText',
                                                e.target.value,
                                            );
                                        }}
                                        fullWidth
                                    />
                                </Box>
                            );
                        }}
                    />
                    <Controller
                        name="visibility"
                        control={control}
                        render={({ field }) => (
                            <Box sx={{ gap: 0 }}>
                                <Typography variant="subtitle1">
                                    Visibility
                                </Typography>
                                <RadioGroup {...field} row>
                                    <RadioGroup.Item
                                        value="Private"
                                        label="Private"
                                    />
                                    <RadioGroup.Item
                                        value="Public"
                                        label="Public"
                                    />
                                </RadioGroup>
                            </Box>
                        )}
                    /> */}
                    {!isEdit && (
                        <StyledButtonGroupIconButton
                            onClick={handleCanvasPreview}
                        >
                            <PreviewOutlined sx={{ mr: 1 }} /> Preview Block
                        </StyledButtonGroupIconButton>
                    )}
                </StyledModalContent>

                <Modal.Actions>
                    <Button onClick={handleCloseModals} variant="text">
                        Cancel
                    </Button>

                    {isEdit ? (
                        <Button
                            onClick={handleSaveAsClientBlock}
                            variant="contained"
                        >
                            Save
                        </Button>
                    ) : (
                        <Button
                            onClick={handleAddAsClientBlock}
                            variant="contained"
                        >
                            Add
                        </Button>
                    )}
                </Modal.Actions>
            </Modal>

            <Modal open={showPreviewModal} maxWidth={false}>
                <StyledModalHeading>
                    <IconButton size="small" onClick={handleArrowBack}>
                        <ArrowBack />
                    </IconButton>
                    <StyledTitle variant="h6">Add Block</StyledTitle>
                    <IconButton size="small" onClick={handleCloseModals}>
                        <Close />
                    </IconButton>
                </StyledModalHeading>

                <StyledModalContent>
                    {imagePreview && (
                        <Tooltip title={localBlockItem?.helperText || ''} arrow>
                            <img
                                src={imagePreview}
                                alt="Canvas Preview"
                                style={{
                                    width: imageDimensions.width,
                                    height: imageDimensions.height,
                                    border: '1px solid #ccc',
                                    borderRadius: 8,
                                    overflow: 'auto',
                                    cursor: 'pointer', // Optional: show pointer on hover
                                }}
                            />
                        </Tooltip>
                    )}
                </StyledModalContent>

                <Modal.Actions>
                    <Button onClick={handleCloseModals} variant="text">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddAsClientBlock}
                        variant="contained"
                    >
                        Add
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
};
