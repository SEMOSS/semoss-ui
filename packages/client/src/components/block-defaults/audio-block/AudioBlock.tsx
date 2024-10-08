import { CSSProperties, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface AudioBlockDef extends BlockDef<'audio'> {
    widget: 'audio';
    data: {
        style: CSSProperties;
        src: string;
        title: string;
    };
    slots: never;
}

export const AudioBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<AudioBlockDef>(id);
    const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);

    const fileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const audioURL = URL.createObjectURL(file);
            setUploadedAudio(audioURL);
        }
    };

    return (
        <div
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            <input type="file" accept="audio/*" onChange={fileUpload} />

            {uploadedAudio && (
                <audio controls>
                    <source src={uploadedAudio} type="audio/mpeg" />
                    <source src={uploadedAudio} type="audio/m4a" />
                    <source src={uploadedAudio} type="audio/mp3" />
                    <source src={uploadedAudio} type="audio/aac" />
                    <source src={uploadedAudio} type="audio/flac" />
                    <source src={uploadedAudio} type="audio/wav" />
                    <source src={uploadedAudio} type="audio/aiff" />
                    Your brower does not support the audio element.
                </audio>
            )}
        </div>
    );
});
