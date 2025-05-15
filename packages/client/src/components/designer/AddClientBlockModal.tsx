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

    const collectChildBlocks = (
        slots: Record<string, any>,
        accumulatedSlots: Record<string, any>,
    ): Record<string, any> => {
        Object.entries(slots).forEach(([slotName, slotValue]) => {
            if (slotName === 'children' && Array.isArray(slotValue)) {
                accumulatedSlots[slotName] = slotValue.map((childId) => {
                    const childBlock = state.blocks[childId];
                    if (childBlock && childBlock.slots) {
                        collectChildBlocks(childBlock.slots, {});
                    }
                    const { parent, ...newClientBlock } = childBlock;
                    return newClientBlock ?? {};
                });
            } else if (typeof slotValue === 'object' && slotValue !== null) {
                accumulatedSlots[slotName] = collectChildBlocks(slotValue, {});
            }
        });
        return accumulatedSlots;
    };
    const handleAddAsClientBlock = handleSubmit(
        async (data: AddAsClientBlockTypes) => {
            const block = state.blocks[selected];
            const newClientBlock = {
                widget: block.widget,
                data: block.data,
                listeners: block.listeners,
                slots: collectChildBlocks(block.slots, {}),
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
