import React, { useState, useMemo } from 'react';
import { Page } from '@/components/ui';
import { Button, Stack, styled, TextField, Typography } from '@semoss/ui';
import { ImportStorageContext, ImportStorageContextType } from '@/contexts';
import { useImportStorage } from '@/hooks';
import { STORAGE_TYPES } from './storage.constants';
import { formatName } from '@/utils';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));

export const ImportStorage = () => {
    const [storageType, setStorageType] = useState<string>('AMAZON_S3');
    const [step, setStep] = useState<number>(0);

    const setStorage = (val: string) => {
        // Set the storage type
        setStorageType(val);
        // Switch the step
        setStep(1);
    };

    /** Context Value for child components */
    const importStorageValue: ImportStorageContextType = {
        storageType: storageType,
        setStorageType: setStorage,
    };

    return (
        <ImportStorageContext.Provider value={importStorageValue}>
            <Page
                header={
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                    >
                        <Typography variant={'h4'}>Import Storage</Typography>
                    </Stack>
                }
            >
                <StyledContainer>
                    {step === 0 && <StorageType />}
                    {step === 1 && <ImportForm />}
                </StyledContainer>
            </Page>
        </ImportStorageContext.Provider>
    );
};

export const StorageType = () => {
    const { setStorageType } = useImportStorage();

    return (
        <div>
            {STORAGE_TYPES.map((obj, i) => {
                return (
                    <Button
                        key={i}
                        onClick={() => {
                            setStorageType(obj.type);
                        }}
                    >
                        {formatName(obj.type)}
                    </Button>
                );
            })}
        </div>
    );
};

export const ImportForm = () => {
    const { storageType } = useImportStorage();

    const storageFields = useMemo(() => {
        const found = STORAGE_TYPES.find(
            (element) => element.type === storageType,
        );

        debugger;

        if (found) return found.fields;

        return [];
    }, [storageType]);

    return (
        <div>
            {storageFields.map((field, i) => {
                if (field.type === 'input') {
                    return <TextField label={field.label}></TextField>;
                } else {
                    return <span key={i}>{field.label}</span>;
                }
            })}
        </div>
    );
};
