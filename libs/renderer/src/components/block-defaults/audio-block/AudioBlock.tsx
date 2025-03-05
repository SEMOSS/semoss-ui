import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { styled, Button } from "@semoss/ui";

const StyledLabel = styled("span")(({ theme }) => ({
    marginBottom: "4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "4px",
}));

const StyledButton = styled(Button)({
    borderRadius: "50%",
    minWidth: "48px",
    width: "48px",
    height: "48px",
});

export interface AudioBlockDef extends BlockDef<"audio-player"> {
    widget: "audio-player";
    data: {
        label: string;
        autoplay: boolean;
        controls: boolean;
        loop: boolean;
        source: string;
        text: string;
        mode: "audio-player" | "text-to-speech";
        voice: string;
    };
    listeners: {
        onClick: true;
    };
}

const StyledContainer = styled("div")(({ theme }) => ({
    padding: "4px",
}));

export const AudioBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<AudioBlockDef>(id);
    const [speaking, setSpeaking] = useState(false);
    const synth = useRef(window.speechSynthesis);
    const utterance = useRef<SpeechSynthesisUtterance | null>(null);

    // Handle text-to-speech updates
    useEffect(() => {
        if (data.mode === "text-to-speech" && data.text) {
            utterance.current = new SpeechSynthesisUtterance(data.text);
            // utterance.current.rate = data.rate;
            // utterance.current.pitch = data.pitch;

            if (data.voice) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find((v) => v.name === data.voice);
                if (selectedVoice) {
                    utterance.current.voice = selectedVoice;
                }
            } else {
                const defaultVoice = window.speechSynthesis.getVoices()[0];
                if (defaultVoice) {
                    utterance.current.voice = defaultVoice;
                }
            }

            utterance.current.onend = () => setSpeaking(false);
            utterance.current.onerror = () => setSpeaking(false);

            return () => {
                if (synth.current.speaking) {
                    synth.current.cancel();
                    setSpeaking(false);
                }
            };
        }
    }, [data.text, data.voice, data.mode]);

    const handleSpeak = () => {
        if (!data.text) return;

        if (speaking) {
            synth.current.cancel();
            setSpeaking(false);
        } else {
            // Create utterance if it doesn't exist
            if (!utterance.current) {
                utterance.current = new SpeechSynthesisUtterance(data.text);
                if (data.voice) {
                    const voices = window.speechSynthesis.getVoices();
                    const selectedVoice = voices.find(
                        (v) => v.name === data.voice,
                    );
                    if (selectedVoice) {
                        utterance.current.voice = selectedVoice;
                    }
                }
                utterance.current.onend = () => setSpeaking(false);
                utterance.current.onerror = (event) => {
                    console.error("Speech synthesis error:", event);
                    setSpeaking(false);
                };
            }

            synth.current.cancel(); // Cancel any ongoing speech
            synth.current.speak(utterance.current);
            setSpeaking(true);
        }
    };

    // Clean up resources when mode changes
    useEffect(() => {
        return () => {
            if (synth.current.speaking) {
                synth.current.cancel();
                setSpeaking(false);
            }
        };
    }, [data.mode]);

    if (data.mode === "text-to-speech") {
        return (
            <StyledContainer {...attrs}>
                <StyledLabel>{data.label}</StyledLabel>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <StyledButton
                        variant="contained"
                        color={speaking ? "error" : "primary"}
                        onClick={handleSpeak}
                        disabled={!data.text}
                    >
                        {speaking ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </StyledButton>
                    {data.text && (
                        <div style={{ fontSize: "14px", color: "#666" }}>
                            {data.text}
                        </div>
                    )}
                </div>
            </StyledContainer>
        );
    }

    return (
        <StyledContainer {...attrs}>
            <StyledLabel>{data.label}</StyledLabel>
            <audio
                controls={data.controls}
                autoPlay={data.autoplay}
                loop={data.loop}
                src={data.source}
            ></audio>
        </StyledContainer>
    );
});
