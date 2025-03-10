/* eslint-disable react/jsx-no-undef */
/* eslint-disable no-undef */
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Chip, styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { CSSProperties } from 'react';

export interface ChipBlockDef extends BlockDef<'chip'> {
    widget: 'chip';
    data: {
        type: string;
        label: string;
        variant?: 'filled';
        icon: JSX.Element;
        size: 'small' | 'medium';
        style: CSSProperties;
        color: 'primary' | 'default' | 'pink' | 'green' | 'purple';
        src: string;
        title: string;
    };
    slots: never;
}

// eslint-disable-next-line no-unused-vars
const StyledLabel = styled('span', {
    shouldForwardProp: (prop) => prop !== 'loading',
})<{ loading?: boolean }>(({ loading }) => ({
    visibility: loading ? 'hidden' : 'visible',
}));

// const handleDelete = () => {
//     console.log('fake deleted');
// };

export const ChipBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data /* listeners */ } = useBlock<ChipBlockDef>(id);

    return (
        <div
            {...attrs}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'fit-content',
                width: 'fit-content',
                paddingInline: '10px',
            }}
        >
            {
                // eslint-disable-next-line prettier/prettier
                <Chip
                    label={data.label || null}
                    variant={data.variant || null}
                    color={data.color}
                    size={data.size}
                    icon={data.icon || null} /*onDelete={} onClick={}*/
                />
            }
        </div>
    );
});
