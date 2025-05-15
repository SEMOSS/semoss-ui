import { useEffect, useState } from 'react';
import { Control, Controller, useForm } from 'react-hook-form';
import { Close } from '@mui/icons-material';

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
} from '@semoss/ui';

import { usePixel, useRootStore } from '@/hooks';
import { useBlocks } from '@semoss/renderer';
import { SECTION_ORDER } from '../blocks-workspace/menus/default-menu';

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
}));

interface EditDetailsModalProps {
    isOpen: boolean;
    selected: any;
    onClose: (reset?: boolean) => void;
}

interface AddAsClientBlockTypes {
    name: string;
    section: string;
    block_json: any;
}

export const AddAsClientBlock: AddAsClientBlockTypes = {
    name: '',
    section: '',
    block_json: {},
};

export const AddClientBlockModal = (props: EditDetailsModalProps) => {
    const { isOpen, selected, onClose } = props;
    const { control, setValue, reset, handleSubmit } =
        useForm<AddAsClientBlockTypes>({ defaultValues: AddAsClientBlock });
    const { monolithStore, configStore } = useRootStore();
    const { registry, state } = useBlocks();
    const notification = useNotification();
    const allowedKeys = ['widget', 'data', 'listeners', 'slots'];

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
                    message: `Successfully added document`,
                });
            } else {
                notification.add({
                    color: 'error',
                    message: output,
                });
            }

            reset(AddAsClientBlock);
            onClose();
        },
    );

    const handleInputValidations = (val: string, field: string) => {
        if (!/^[a-zA-Z_-]*$/.test(val)) {
            return false;
        }
        return true;
    };

    return (
        <Modal open={isOpen} fullWidth>
            <StyledModalHeading>
                <StyledTitle variant="h6">Add as client block</StyledTitle>

                <IconButton size="small" onClick={() => onClose(true)}>
                    <Close />
                </IconButton>
            </StyledModalHeading>

            <StyledModalContent>
                <Controller
                    name="name"
                    control={control}
                    render={({ field }) => {
                        return (
                            <TextField
                                value={field.value}
                                onChange={(val) => field.onChange(val)}
                                fullWidth
                                label="Name"
                                error={
                                    !handleInputValidations(field.value, 'name')
                                }
                                helperText={
                                    !handleInputValidations(field.value, 'name')
                                        ? 'Name should only contain letters, hyphens, and underscores'
                                        : ''
                                }
                            />
                        );
                    }}
                />
                <Controller
                    name="section"
                    control={control}
                    render={({ field }) => {
                        return (
                            <Autocomplete
                                freeSolo
                                fullWidth
                                value={field.value}
                                options={SECTION_ORDER}
                                onChange={(_, newValue) =>
                                    field.onChange(newValue)
                                }
                                onInputChange={(_, newValue) =>
                                    field.onChange(newValue)
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Section"
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
                        );
                    }}
                />
            </StyledModalContent>

            <Modal.Actions>
                <Button onClick={() => onClose(true)} variant="text">
                    Cancel
                </Button>
                <Button onClick={handleAddAsClientBlock} variant="contained">
                    Add
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
