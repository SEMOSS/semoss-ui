import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

import { styled } from '@mui/material';

const StyledLabel = styled('span')(({ theme }) => ({
    marginBottom: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '4px',
}));

export interface AudioBlockDef extends BlockDef<'audio-player'> {
    widget: 'audio-player';
    data: {
        label: string;
        autoplay: boolean;
        controls: boolean;
        loop: boolean;
        source: string;
    };
    listeners: {
        onClick: true;
    };
}

const StyledContainer = styled('div')(({ theme }) => ({
    padding: '4px',
}));

export const AudioBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<AudioBlockDef>(id);

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
