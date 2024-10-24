import { CSSProperties, useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { Button, styled } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

const StyledButton = styled(Button)({
    borderRadius: '50%',
});

export interface AudioInputBlockDef extends BlockDef<'audio-input'> {
    widget: 'audio-input';
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
        disabled?: boolean;
        variant: 'contained' | 'outlined' | 'text';
        color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
        value: string;
    };
}

const StyledContainer = styled('div')(() => ({
    padding: '4px',
}));

export const AudioInputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<AudioInputBlockDef>(id);
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef(null);
    const [primaryBtnColor, setPrimaryBtnColor] = useState(data.color);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Web Speech API is not supported in this browser.');
            return;
        }
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setRecording(true);
            setData('color', 'error');
            setTranscript('');
        };
        recognition.onend = () => {
            setRecording(false);
            setData('color', primaryBtnColor);
        };
        recognition.onresult = (event) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            setTranscript((prev) => prev + final);
            setInterimTranscript(interim);
        };
        recognitionRef.current = recognition;
    }, []);

    useEffect(() => {
        setData('value', transcript + interimTranscript);
    }, [transcript]);

    const handleRecording = (stopRecording = false) => {
        if (recognitionRef.current) {
            if (recording || stopRecording) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
        }
    };

    return (
        <StyledContainer {...attrs}>
            <StyledButton
                size="medium"
                color={data.color}
                variant={data.variant}
                disabled={data?.disabled || data?.loading}
                sx={{
                    ...data.style,
                }}
                onClick={() => {
                    handleRecording();
                }}
            >
                {recording ? <MicOffIcon /> : <MicIcon />}
            </StyledButton>
        </StyledContainer>
    );
});
