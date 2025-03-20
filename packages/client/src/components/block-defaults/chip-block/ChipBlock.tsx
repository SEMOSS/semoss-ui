import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';
import { Face } from '@mui/icons-material';
import { Chip } from '@mui/material';
import { Avatar } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { CSSProperties } from 'react';

export interface ChipBlockDef extends BlockDef<'chip'> {
    widget: 'chip';
    data: {
        type: string;
        label: string;
        style: CSSProperties;
        variant: 'filled' | 'outlined';
        disabled?: boolean;
        avatar?: React.ReactElement;
        size: 'small' | 'medium';
        color:
            | 'default'
            | 'primary'
            | 'secondary'
            | 'success'
            | 'warning'
            | 'error';
        clickable?: boolean;
        multiSelect?: boolean;
        link?: string;
        icon?: React.JSX.Element;
        src: string;
        title: string;
    };
    slots: never;
}

export const ChipBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<ChipBlockDef>(id);

    const displayChip = (key): React.ReactNode => {
        const avatar = data?.avatar || 'A';
        const link = data?.link || null;

        const chipProps = {
            label: data.label ?? data.type ?? 'Chip',
            color: data.color,
            size: data.size,
            variant: data.variant,
            clickable: data.clickable,
        };

        switch (key) {
            case 'Chip':
                return <Chip {...chipProps} />;
            case 'Avatar':
                return (
                    <Chip
                        {...chipProps}
                        avatar={
                            <Avatar
                                sx={{ '&&': { backgroundColor: data.color } }}
                            >
                                {avatar}
                            </Avatar>
                        }
                    />
                );
            case 'Icon':
                return <Chip {...chipProps} icon={<Face />} />;
            case 'Link':
                return (
                    <a href={link}>
                        <Chip
                            {...chipProps}
                            onClick={(e) => e.preventDefault()}
                        />
                    </a>
                );
            default:
                return <Chip {...chipProps} />;
        }
    };

    return (
        <div
            {...attrs}
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'fit-content',
                width: 'fit-content',
            }}
        >
            {data.type ? displayChip(data.type) : displayChip('default')}
        </div>
    );
});
