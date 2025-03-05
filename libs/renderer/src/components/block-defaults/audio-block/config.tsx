import { CSSProperties, useEffect, useState, useRef } from "react";
import { BlockConfig, BlockDef, Block } from "../../../store";
import { InputSettings, QueryInputSettings } from "../../block-settings";

import { AudioBlockDef, AudioBlock } from "./AudioBlock";
import HeadsetIcon from "@mui/icons-material/Headset";
import { BLOCK_TYPE_ACTION } from "../block-defaults.constants";
import { SwitchSettings } from "../../block-settings/shared/SwitchSettings";
import { SelectInputSettings } from "../../block-settings/shared/SelectInputSettings";
import { useBlockSettings } from "../../../hooks";
import { Paths, PathValue } from "../../../types";
import { Autocomplete } from "@mui/material";
import { TextField } from "@semoss/ui";
import { BaseSettingSection } from "../../block-settings/BaseSettingSection";

export const DefaultStyles: CSSProperties = {};

const SettingAutocomplete = <D extends BlockDef>({
    id,
    path,
    options,
    initialValue,
    onValueChange,
    label,
}: {
    id: string;
    path: Paths<Block<D>["data"], 4>;
    options: Array<{ label: string; value: string }>;
    label: string;
    initialValue?: string;
    onValueChange?: (value: string) => void;
}) => {
    const { data, setData } = useBlockSettings<D>(id);
    const [selectedValue, setSelectedValue] = useState(
        data[path] || initialValue,
    );
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const setBlockData = (newValue: string | undefined) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        timeoutRef.current = setTimeout(() => {
            try {
                setData(path, newValue as PathValue<D["data"], typeof path>);
                setSelectedValue(newValue);
                if (onValueChange) {
                    onValueChange(newValue || "");
                }
            } catch (e) {
                console.log(e);
            }
        }, 300);
    };

    return (
        <Autocomplete
            fullWidth
            options={options}
            value={options.find((opt) => opt.value === selectedValue) || null}
            onChange={(_, newValue) => {
                setBlockData(newValue?.value);
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size="small"
                    variant="outlined"
                />
            )}
        />
    );
};

const VoiceSelector = ({ id }: { id: string }) => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    useEffect(() => {
        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    if (voices.length === 0) return null;

    const voiceOptions = voices.map((voice) => ({
        label: `${voice.name} (${voice.lang})`,
        value: voice.name,
    }));

    return (
        <BaseSettingSection label="Voice">
            <SettingAutocomplete
                id={id}
                path="voice"
                options={voiceOptions}
                label="Select Voice"
            />
        </BaseSettingSection>
    );
};

// export the config for the block
export const config: BlockConfig<AudioBlockDef> = {
    widget: "audio-player",
    type: BLOCK_TYPE_ACTION,
    data: {
        label: "Audio Player",
        autoplay: false,
        controls: true,
        loop: false,
        source: "",
        text: "",
        mode: "audio-player",
        voice: "",
    },
    listeners: {
        onClick: [],
    },
    slots: {},
    render: AudioBlock,
    icon: HeadsetIcon,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Mode",
                    render: ({ id }) => (
                        <SelectInputSettings
                            id={id}
                            label="Mode"
                            path="mode"
                            options={[
                                {
                                    value: "audio-player",
                                    display: "Audio Player",
                                },
                                {
                                    value: "text-to-speech",
                                    display: "Text to Speech",
                                },
                            ]}
                        />
                    ),
                },
                {
                    description: "Label",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
                {
                    description: "Audio URL",
                    render: ({ id }) => {
                        const { data } = useBlockSettings<AudioBlockDef>(id);
                        if (data.mode !== "audio-player") return null;

                        return (
                            <QueryInputSettings
                                id={id}
                                label="Audio URL"
                                path="source"
                            />
                        );
                    },
                },
                {
                    description: "Text for Speech",
                    render: ({ id }) => {
                        const { data } = useBlockSettings<AudioBlockDef>(id);
                        if (data.mode !== "text-to-speech") return null;

                        return (
                            <QueryInputSettings
                                id={id}
                                label="Text"
                                path="text"
                            />
                        );
                    },
                },
                {
                    description: "Voice Selection",
                    render: ({ id }) => {
                        const { data } = useBlockSettings<AudioBlockDef>(id);
                        if (data.mode !== "text-to-speech") return null;

                        return <VoiceSelector id={id} />;
                    },
                },
                {
                    description: "Autoplay",
                    render: ({ id }) => {
                        const { data } = useBlockSettings<AudioBlockDef>(id);
                        return data.mode === "audio-player" ? (
                            <SwitchSettings
                                id={id}
                                label="Enable Autoplay"
                                path="autoplay"
                                description="This setting will enable autoplay of the audio"
                            />
                        ) : null;
                    },
                },
                {
                    description: "Controls",
                    render: ({ id }) => {
                        const { data } = useBlockSettings<AudioBlockDef>(id);
                        return data.mode === "audio-player" ? (
                            <SwitchSettings
                                id={id}
                                label="Enable controls"
                                path="controls"
                                description="This setting will enable controls like pause, play, volume-control on the audio player"
                            />
                        ) : null;
                    },
                },
                {
                    description: "Loop",
                    render: ({ id }) => {
                        const { data } = useBlockSettings<AudioBlockDef>(id);
                        return data.mode === "audio-player" ? (
                            <SwitchSettings
                                id={id}
                                label="Enable loop"
                                path="loop"
                                description="This setting will play the audio in a loop"
                            />
                        ) : null;
                    },
                },
            ],
        },
    ],
    styleMenu: [],
};
