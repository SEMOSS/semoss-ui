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
        mode: 'transcribe' | 'record';
    };
}

const StyledContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
    padding: '4px',
}));

export const AudioInputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<AudioInputBlockDef>(id);
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const recognitionRef = useRef(null);
    const [primaryBtnColor, setPrimaryBtnColor] = useState(data.color);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null,
    );
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

    // Clear value when mode changes
    useEffect(() => {
        cleanup();
        setRecording(false);
        setTranscript('');
        setInterimTranscript('');
        setAudioChunks([]);
        setData('value', '');

        if (data.mode === 'transcribe') {
            setupSpeechRecognition();
        } else {
            setupAudioRecording();
        }

        return () => cleanup();
    }, [data.mode]);

    const setupSpeechRecognition = () => {
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
    };

    const setupAudioRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm',
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setAudioChunks((chunks) => [...chunks, e.data]);
                }
            };

            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, {
                    type: 'audio/webm',
                });
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    setData('value', base64data);
                };
                reader.readAsDataURL(audioBlob);
                // Stop all tracks
                stream.getTracks().forEach((track) => track.stop());
            };

            setMediaRecorder(recorder);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    useEffect(() => {
        if (data.mode === 'transcribe') {
            setData('value', transcript);
        }
    }, [transcript]);

    const handleRecording = (stopRecording = false) => {
        if (data.mode === 'transcribe') {
            if (recognitionRef.current) {
                if (recording || stopRecording) {
                    recognitionRef.current.stop();
                } else {
                    recognitionRef.current.start();
                }
            }
        } else {
            if (recording) {
                mediaRecorder?.stop();
                setData('color', primaryBtnColor);
            } else {
                setupAudioRecording().then(() => {
                    setAudioChunks([]);
                    mediaRecorder?.start();
                    setData('color', 'error');
                });
            }
            setRecording(!recording);
        }
    };

    const handleDownload = () => {
        if (
            data.mode === 'record' &&
            (data.value as string)?.startsWith('data:audio/')
        ) {
            const link = document.createElement('a');
            link.href = data.value as string;
            link.download = `recording-${new Date().toISOString()}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const cleanup = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            const tracks = mediaRecorder.stream.getTracks();
            tracks.forEach((track) => track.stop());
        }
        if (recognitionRef.current) {
            recognitionRef.current.stop();
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
            {data.mode === 'record' &&
                (data.value as string)?.startsWith('data:audio/') && (
                    <Button
                        size="small"
                        onClick={handleDownload}
                        variant="text"
                        color={data.color}
                    >
                        Download Recording
                    </Button>
                )}
        </StyledContainer>
    );
});
