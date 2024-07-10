import React, { useEffect, useState } from 'react';
import {
    styled,
    Button,
    Card,
    Stack,
    Typography,
    Icon,
    IconButton,
    Tooltip,
    Modal,
    TextField,
    Select,
    Slider,
} from '@semoss/ui';
import { TypeLlmConfig } from '../workspace.types';
import { Controller, useForm } from 'react-hook-form';
import { usePixel } from '@/hooks';
import { ModelVariant } from '@/contexts/LLMComparisonContext';

interface VariantModelModalProps {
    /** Open Modal */
    open: boolean;
    /** Callback on modal close */
    onClose: (model?: ModelVariant) => void;
    /** Variable to map to */
    variable: ModelVariant;
}

export const VariantModelModal = (props: VariantModelModalProps) => {
    const { open, variable, onClose } = props;
    const [models, setModels] = useState([]);

    const { handleSubmit, control, setValue } = useForm({
        defaultValues: {
            alias: variable.alias ? variable.alias : '',
            value: variable.value ? variable.value : '',
            database_name: variable.database_name ? variable.database_name : '',
            database_subtype: variable.database_subtype
                ? variable.database_subtype
                : '',
            database_type: variable.database_type ? variable.database_type : '',
            topP: variable.topP ? variable.topP : 0,
            temperature: variable.temperature ? variable.temperature : 0,
            length: variable.length ? variable.length : 0,
        },
    });

    const myModels = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
    MyEngines(engineTypes=["MODEL"]);
    `);

    useEffect(() => {
        if (myModels.status !== 'SUCCESS') {
            return;
        }

        setModels(myModels.data);
    }, [variable, myModels.status, myModels.data]);

    const onSubmit = handleSubmit(async (data) => {
        onClose(data);
    });

    return (
        <Modal open={open} onClose={onClose}>
            <div style={{ width: '600px' }}>
                <Modal.Title>Swap Model</Modal.Title>
                <form onSubmit={onSubmit}>
                    <Modal.Content>
                        <Stack direction={'column'} gap={1}>
                            <Stack direction={'column'} gap={1}>
                                <Typography variant={'body1'}>
                                    Variable name
                                </Typography>
                                <Typography variant={'body2'}>
                                    {variable?.alias}
                                </Typography>
                            </Stack>
                            <Controller
                                name={'value'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <Stack>
                                            <Typography variant={'body1'}>
                                                Model
                                            </Typography>
                                            <Select
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const value =
                                                        e.target.value;

                                                    field.onChange(value);

                                                    const found = models.find(
                                                        (mod) =>
                                                            mod.database_id ===
                                                            value,
                                                    );

                                                    if (found) {
                                                        setValue(
                                                            'database_name',
                                                            found.database_name,
                                                        );
                                                        setValue(
                                                            'database_subtype',
                                                            found.database_subtype,
                                                        );
                                                        setValue(
                                                            'database_type',
                                                            found.database_type,
                                                        );
                                                    }
                                                }}
                                            >
                                                {models.map((model, i) => {
                                                    return (
                                                        <Select.Item
                                                            key={`select-item-${model.database_id}-i`}
                                                            value={
                                                                model.database_id
                                                            }
                                                        >
                                                            {
                                                                model.database_name
                                                            }
                                                        </Select.Item>
                                                    );
                                                })}
                                            </Select>
                                        </Stack>
                                    );
                                }}
                            />
                            {/* <Controller
                                name={'topP'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <Stack>
                                            <Typography variant={'body1'}>
                                                Top P
                                            </Typography>
                                            <Slider
                                                step={0.1}
                                                min={0}
                                                max={1}
                                                marks
                                                valueLabelDisplay="auto"
                                            />
                                        </Stack>
                                    );
                                }}
                            />
                            <Controller
                                name={'temperature'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <Stack>
                                            <Typography variant={'body1'}>
                                                Temperature
                                            </Typography>
                                            <Slider
                                                min={0}
                                                max={1}
                                                step={0.1}
                                                marks
                                                valueLabelDisplay="auto"
                                            />
                                        </Stack>
                                    );
                                }}
                            />
                            <Controller
                                name={'length'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <Stack>
                                            <Typography variant={'body1'}>
                                                Length
                                            </Typography>
                                            <Slider
                                                min={0}
                                                max={10}
                                                marks
                                                valueLabelDisplay="auto"
                                            />
                                        </Stack>
                                    );
                                }}
                            /> */}
                        </Stack>
                    </Modal.Content>
                    <Modal.Actions>
                        <Stack
                            direction="row"
                            spacing={1}
                            paddingX={2}
                            paddingBottom={2}
                        >
                            <Button type="button" onClick={() => onClose()}>
                                Cancel
                            </Button>
                            <Button type="submit" variant={'contained'}>
                                Save
                            </Button>
                        </Stack>
                    </Modal.Actions>
                </form>
            </div>
        </Modal>
    );
};
