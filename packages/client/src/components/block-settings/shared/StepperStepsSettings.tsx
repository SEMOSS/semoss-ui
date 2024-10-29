import { useEffect, useState, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { TextField } from '@mui/material';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { Button, IconButton } from '@mui/material';
import { styled } from '@semoss/ui';
import DeleteIcon from '@mui/icons-material/Delete';
import { getValueByPath } from '@/utility';

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
        const { data, setData } = useBlockSettings<D>(id);
        const { control, register, getValues, watch } = useForm<FormValues>({
            defaultValues: {
                steps: [],
            },
        });
        const { fields, append, remove, replace } = useFieldArray<FormValues>({
            control,
            name: 'steps',
        });
        const [nameValue, setNameValue] = useState('');
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

        // get the value of the input
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        useEffect(() => {
            const proxyArr = data.steps;
            const newArr: Title[] = [...(proxyArr as [])];
            replace(newArr);
        }, [computedValue]);

        return (
            <>
                <form>
                    {fields.length ? (
                        <>
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
                                                        onClick={() =>
                                                            remove(index)
                                                        }
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </StyledPaddedFlexDiv>
                                            </StyledStepItem>
                                        );
                                    })}
                                </StyledUlList>
                            </BaseSettingSection>
                        </>
                    ) : (
                        ''
                    )}

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
