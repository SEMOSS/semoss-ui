import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks, useDebounce } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { TextField } from '@mui/material';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { Button, IconButton } from '@mui/material';
import { styled } from '@semoss/ui';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledPaddedFlexDiv = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledUlList = styled('ul')(({ theme }) => ({
    width: '100%',
    listStyle: 'none',
    marginBottom: '1em',
}));

const StyledStepItem = styled('li')(({ theme }) => ({
    marginBottom: '0.5em',
}));

const StyledIndexItem = styled('div')(({ theme }) => ({
    marginRight: '1em',
    fontSize: '14px',
}));

interface StepperStepsSettings<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Label to pass into the input
     */
    label: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

interface Name {
    name: string;
    id?: number;
}

type FormValues = {
    names: Name[];
};

export const StepperStepsSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        path,
    }: StepperStepsSettings<D>) => {
        const { control, register } = useForm<FormValues>({
            defaultValues: {
                names: [],
            },
        });
        const { fields, append, remove, update } = useFieldArray<FormValues>({
            control,
            name: 'names',
        });
        const { state } = useBlocks();
        const { data, setData, listeners } = useBlockSettings<D>(id);
        // track the value
        const [nameValue, setNameValue] = useState('');

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setNameValue(value);
        };

        useEffect(() => {
            setData(path, fields as PathValue<D['data'], typeof path>);
        }, [fields]);

        return (
            <>
                <form>
                    <BaseSettingSection label={label}>
                        <StyledUlList>
                            {fields.map((field, index) => {
                                return (
                                    <StyledStepItem key={field.id}>
                                        <StyledPaddedFlexDiv>
                                            <StyledIndexItem>{`${
                                                index + 1
                                            })`}</StyledIndexItem>
                                            <Controller
                                                name={`names.${index}.name`}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            {...register(
                                                                `names.${index}.name`,
                                                            )}
                                                            fullWidth
                                                            onChange={(e) => {
                                                                update(index, {
                                                                    name: e
                                                                        .target
                                                                        .value,
                                                                });
                                                            }}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    );
                                                }}
                                            />

                                            <IconButton
                                                color="error"
                                                title="Delete"
                                                onClick={() => remove(index)}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </StyledPaddedFlexDiv>
                                    </StyledStepItem>
                                );
                            })}
                        </StyledUlList>
                    </BaseSettingSection>
                    <BaseSettingSection label="Add Step">
                        <TextField
                            value={nameValue}
                            onChange={(e) => {
                                // sync the data on change
                                onChange(e.target.value);
                            }}
                            size="small"
                            variant="outlined"
                            autoComplete="off"
                        />
                        <Button
                            onClick={() => {
                                append({ name: nameValue });
                                setNameValue('');
                            }}
                            size="medium"
                            variant="contained"
                        >
                            Add
                        </Button>
                    </BaseSettingSection>
                </form>
            </>
        );
    },
);
