import { useState } from 'react';
import { styled, useNotification, Button, Paper, Typography } from '@semoss/ui';
import Editor from '@monaco-editor/react';
import { useRootStore } from '@/hooks';

interface UpdateSMSSProps {
    id: string;
}

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: theme.spacing(3),
}));

const StyledTopDiv = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    height: '360px',
    paddingTop: '1rem',
}));

export const UpdateSMSS = (props: UpdateSMSSProps) => {
    const { id } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [initialValue, setInitialValue] = useState('');
    const [value, setValue] = useState('');

    /**
     * @name updateSMSSProperties
     * @desc hit endpoint to update smss file
     */
    const updateSMSSProperties = () => {
        monolithStore.updateDatabaseSmssProperties(id, value).then((resp) => {
            const { data } = resp;
            if (data.success) {
                notification.add({
                    color: 'success',
                    message: 'Successfully updated SMSS Properties',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: 'Unsuccessfully updated SMSS Properties',
                });
            }
        });
    };

    return (
        <StyledContainer>
            <StyledTopDiv>
                <Typography variant={'h6'}>SMSS Properties</Typography>
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
            </StyledTopDiv>
            <StyledPaper elevation={1}>
                <Editor
                    defaultValue={''}
                    value={value}
                    language={'plaintext'}
                    onChange={(newValue, e) => {
                        // Handle changes in the editor's content.
                        setValue(newValue);
                    }}
                />
            </StyledPaper>
        </StyledContainer>
    );
};

// Find out how to edit styles of monaco editor
// const monaco = useMonaco();

// useEffect(() => {
//     if(monaco) {
//         setEditorTheme(monaco)
//     }
// }, [monaco])

//   const setEditorTheme = (monaco: any) => {
//     monaco.editor.setTheme('onedark', {
//       base: 'vs-dark',
//       inherit: true,
//       rules: [
//         {
//           token: 'comment',
//           foreground: '#5d7988',
//           fontStyle: 'italic'
//         },
//         { token: 'constant', foreground: '#e06c75' }
//       ],
//       colors: {
//         'editor.background': '#21252b'
//       }
//     });
//   }
