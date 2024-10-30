import { useEffect, useState, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { computed } from 'mobx';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { TextField } from '@mui/material';
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
}

export const StepperStepsSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        path,
    }: StepperStepsSettings<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [nameValue, setNameValue] = useState('');
        const [allSteps, setAllSteps] = useState<Title[]>([]);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // set the value
            setNameValue(value);
        };

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

        const addStep = (): void => {
            setAllSteps([...allSteps, { name: nameValue }]);
            setNameValue('');
        };

        const removeStep = (index): void => {
            setAllSteps(allSteps.filter((step, i) => i !== index));
        };

        const updateStep = (index, value: string): void => {
            setAllSteps((prevFields) =>
                prevFields.map((field, i) =>
                    i === index
                        ? {
                              ...field,
                              name: value,
                          }
                        : field,
                ),
            );
        };

        useEffect(() => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                setData(path, allSteps as PathValue<D['data'], typeof path>);
            }, 300);
        }, [allSteps]);

        useEffect(() => {
            const proxyArr = data.steps;
            const newArr: Title[] = [...(proxyArr as [])];
            setAllSteps(newArr);
        }, [computedValue]);

        return (
            <>
                {allSteps.length ? (
                    <>
                        <BaseSettingSection label={label}>
                            <StyledUlList>
                                {allSteps.map((field, index) => {
                                    return (
                                        <StyledStepItem key={index}>
                                            <StyledPaddedFlexDiv>
                                                <StyledIndexItem>{`${
                                                    index + 1
                                                })`}</StyledIndexItem>

                                                <TextField
                                                    value={field.name}
                                                    onChange={(e) =>
                                                        updateStep(
                                                            index,
                                                            e.target.value,
                                                        )
                                                    }
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                />

                                                <IconButton
                                                    color="error"
                                                    title="Delete"
                                                    onClick={() =>
                                                        removeStep(index)
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
                    <Button onClick={addStep} size="medium" variant="contained">
                        Add
                    </Button>
                </BaseSettingSection>
            </>
        );
    },
);
