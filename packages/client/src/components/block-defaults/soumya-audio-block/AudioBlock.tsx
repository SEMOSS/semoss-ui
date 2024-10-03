import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import ImageSkeleton from '@/assets/img/ImageSkeleton.png';

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

    return (
        <div
            style={{
                ...data.style,
                backgroundImage: `url(${!data.src ? ImageSkeleton : data.src})`,
            }}
            {...attrs}
        />
    );
});
