import { observer } from 'mobx-react-lite';
import { styled, Stack, Grid, TextField } from '@semoss/ui';
import { useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';

const StyledContent = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

interface JSONEditorProps {
    view: 'editor' | 'text-field';

    value: Record<string, unknown>;

    onChange: (val: Record<string, unknown>) => void;
}

export const JSONEditor = (props: JSONEditorProps) => {
    const { view, value } = props;

    const [controlledValue, setControlledValue] =
        useState<Record<string, unknown>>(value);

    useEffect(() => {
        console.log('here');
        setControlledValue(value);
    }, [value]);

    return (
        <StyledContent>
            {view === 'editor' ? (
                <>{JSON.stringify(controlledValue)}</>
            ) : (
                <Stack>
                    {Object.entries(controlledValue).map((keyValue) => {
                        const key = keyValue[0];
                        const value = keyValue[1];
                        return (
                            <TextField
                                key={`${Math.random() * 1000}-${key}`}
                                label={key}
                                value={value}
                            />
                        );
                    })}
                    {/* <TextField />
                    <TextField /> */}
                </Stack>
            )}
        </StyledContent>
    );
};
