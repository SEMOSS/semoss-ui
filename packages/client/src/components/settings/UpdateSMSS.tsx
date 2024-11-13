import { useState, useEffect, Suspense, lazy } from 'react';
import { styled, useNotification, Button, Paper, Typography } from '@semoss/ui';

import { ALL_TYPES } from '@/types';
import { useRootStore, usePixel, useSettings } from '@/hooks';

const Editor = lazy(() => import('@monaco-editor/react'));

interface UpdateSMSSProps {
    /**
     * Type of setting
     */
    type: ALL_TYPES;

    /**
     * Id of the setting
     */
    id: string;
}

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing(3),
}));

const StyledTopDiv = styled('div')(() => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledPaper = styled(Paper)(() => ({
    height: '360px',
    paddingTop: '1rem',
}));

export const UpdateSMSS = (props: UpdateSMSSProps) => {
    const { type, id } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();

    const [initialValue, setInitialValue] = useState('');
    const [value, setValue] = useState('');
    const [readOnly, setReadOnly] = useState(true);

    const smssDetails = usePixel<string>(
        type === 'DATABASE' ||
            type === 'STORAGE' ||
            type === 'MODEL' ||
            type === 'VECTOR' ||
            type === 'FUNCTION'
            ? adminMode
                ? `AdminGetEngineSMSS(engine=['${id}'])`
                : `GetEngineSMSS(engine=['${id}'])`
            : type === 'APP'
            ? adminMode
                ? `AdminGetProjectSMSS(project=['${id}'])`
                : `GetProjectSMSS(project=['${id}'])`
            : '',
    );

    useEffect(() => {
        if (smssDetails.status !== 'SUCCESS') {
            return;
        }

        setInitialValue(smssDetails.data);
        setValue(smssDetails.data);
    }, [smssDetails.status, smssDetails.data]);

    /**
     * @name updateSMSSProperties
     * @desc hit endpoint to update smss file
     */
    const updateSMSSProperties = () => {
        monolithStore
            .updateDatabaseSmssProperties(id, value)
            .then((resp) => {
                const { data } = resp;

                if (data.success) {
                    setReadOnly(true);
                    setInitialValue(value);
                    notification.add({
                        color: 'success',
                        message: `Successfully updated SMSS Properties`,
                    });
                } else {
                    notification.add({
                        color: 'error',
                        message: `Unable to update SMSS Properties for`,
                    });
                }
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: ` ${error}: Unable to update SMSS Properties`,
                });
            });
    };

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>SMSS Properties</Typography>
                {readOnly ? (
                    <Button
                        variant="contained"
                        size={'small'}
                        onClick={() => setReadOnly(false)}
                    >
                        Edit SMSS
                    </Button>
                ) : (
                    <Button
                        variant={'contained'}
                        size={'small'}
                        disabled={initialValue === value}
                        onClick={() => {
                            updateSMSSProperties();
                        }}
                    >
                        Update SMSS
                    </Button>
                )}
            </StyledTopDiv>
            <StyledPaper elevation={1}>
                <Suspense fallback={<>...</>}>
                    <Editor
                        defaultValue={''}
                        options={{ readOnly: readOnly }}
                        value={value}
                        language={'plaintext'}
                        onChange={(newValue) => {
                            // Handle changes in the editor's content.
                            setValue(newValue);
                        }}
                    />
                </Suspense>
            </StyledPaper>
        </StyledContainer>
    );
};
