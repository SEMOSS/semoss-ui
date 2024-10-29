import { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { TextField } from '@mui/material';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { Button, IconButton } from '@mui/material';
import { styled } from '@semoss/ui';
import DeleteIcon from '@mui/icons-material/Delete';

const StyledPaddedFlexDiv = styled('div')({
    display: 'flex',
    alignItems: 'center',
});

const StyledUlList = styled('ul')({
    width: '100%',
    listStyle: 'none',
    marginBottom: '1em',
});

const StyledStepItem = styled('li')({
    marginBottom: '0.5em',
});

const StyledIndexItem = styled('div')({
    marginRight: '1em',
    fontSize: '14px',
});

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

interface Title {
    name: string;
    id?: number;
}

type FormValues = {
    steps: Title[];
};

export const StepperStepsSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        path,
    }: StepperStepsSettings<D>) => {
        const { control, register, getValues, watch } = useForm<FormValues>({
            defaultValues: {
                steps: [],
            },
        });
        const { fields, append, remove } = useFieldArray<FormValues>({
            control,
            name: 'steps',
        });
        const { setData } = useBlockSettings<D>(id);
        // track the value
        const [nameValue, setNameValue] = useState('');

        // watch
        const watchSteps = watch();

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setNameValue(value);
        };

        useEffect(() => {
            const getFormValues = getValues();
            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            if (getFormValues && getFormValues.steps) {
                timeoutRef.current = setTimeout(() => {
                    setData(
                        path,
                        getFormValues.steps as PathValue<
                            D['data'],
                            typeof path
                        >,
                    );
                }, 300);
            }
        }, [watchSteps]);

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
                                                name={`steps.${index}.name`}
                                                control={control}
                                                render={({ field }) => {
                                                    return (
                                                        <TextField
                                                            {...register(
                                                                `steps.${index}.name`,
                                                            )}
                                                            fullWidth
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
