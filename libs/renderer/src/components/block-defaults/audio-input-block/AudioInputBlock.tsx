import { CSSProperties, useState, useRef, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

import { Button, styled } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";

const StyledButton = styled(Button)({
    borderRadius: "50%",
});

export interface AudioInputBlockDef extends BlockDef<"audio-input"> {
    widget: "audio-input";
    data: {
        style: CSSProperties;
        label: string;
        loading?: boolean;
        disabled?: boolean;
        variant: "contained" | "outlined" | "text";
        color: "primary" | "secondary" | "success" | "warning" | "error";
        value: string;
        mode: "transcribe" | "record";
        show: string;
    };
    listeners: {
        preProcess: true;
        onComplete: true;
    };
}

const StyledContainer = styled("div")(() => ({
    padding: "4px",
}));

export const AudioInputBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<AudioInputBlockDef>(id);
    const [recording, setRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const recognitionRef = useRef(null);
    const [primaryBtnColor, setPrimaryBtnColor] = useState(data.color);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
        null,
    );
    const chunks = useRef<Blob[]>([]);
    const previousValueRef = useRef(data.value);

    useEffect(() => {
        if (data.mode === "transcribe") {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onstart = () => {
                setRecording(true);
                setData("color", "error");
                setTranscript("");
            };
            recognition.onend = () => {
                setRecording(false);
                setData("color", primaryBtnColor);
            };
            recognition.onresult = (event) => {
                let interim = "";
                let final = "";
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
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        }
    }, [data.mode]);

    useEffect(() => {
        if (data.mode === "transcribe") {
            setData("value", transcript);
        }
    }, [transcript]);

    const handleRecording = (stopRecording = false) => {
        if (data.mode === "transcribe") {
            if (recognitionRef.current) {
                if (recording || stopRecording) {
                    recognitionRef.current.stop();
                } else {
                    recognitionRef.current.start();
                }
            }
        } else {
            if (recording || stopRecording) {
                if (mediaRecorder && mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                }
                setData("color", primaryBtnColor);
                setRecording(false);
            } else {
                chunks.current = []; // Clear chunks before new recording
                navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then((stream) => {
                        const recorder = new MediaRecorder(stream);

                        recorder.ondataavailable = (e) => {
                            if (e.data.size > 0) {
                                chunks.current.push(e.data);
                            }
                        };

                        recorder.onstop = () => {
                            const audioBlob = new Blob(chunks.current, {
                                type: "audio/webm",
                            });

                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64Audio = reader.result as string;
                                setData("value", base64Audio);
                            };
                            reader.readAsDataURL(audioBlob);

                            // Stop and cleanup tracks
                            stream.getTracks().forEach((track) => track.stop());
                        };

                        setMediaRecorder(recorder);
                        recorder.start();
                        setRecording(true);
                        setData("color", "error");
                    })
                    .catch((err) => {
                        console.error("Error getting media stream:", err);
                    });
            }
        }
    };

    const handleDownload = () => {
        if (
            data.mode === "record" &&
            (data.value as string)?.startsWith("data:audio/")
        ) {
            const link = document.createElement("a");
            link.href = data.value as string;
            link.download = `recording-${new Date().toISOString()}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Auto-download effect when recording becomes available
    useEffect(() => {
        if (
            data.mode === "record" &&
            (data.value as string)?.startsWith("data:audio/") &&
            (data.value as string) !== previousValueRef.current &&
            !recording
        ) {
            handleDownload();
        }
        previousValueRef.current = data.value;
    }, [data.value, recording]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (mediaRecorder && mediaRecorder.state !== "inactive") {
                mediaRecorder.stop();
                const tracks = mediaRecorder.stream.getTracks();
                tracks.forEach((track) => track.stop());
            }
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [mediaRecorder]);

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
