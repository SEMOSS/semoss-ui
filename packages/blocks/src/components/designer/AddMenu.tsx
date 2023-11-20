import { observer } from 'mobx-react-lite';
import { BlockJSON } from '@/stores';

import { AddMenuItem } from './AddMenuItem';
import { DefaultBlocks } from '../block-defaults';

export const AddMenu = observer(() => {
    function getBlockDisplay(key: string) {
        const words = key.split('-');
        for (let i = 0; i < words.length; i++) {
            words[i] = words[i][0].toUpperCase() + words[i].substring(1);
        }
        return words.join(' ');
    }
    return (
        <>
            {Object.keys(DefaultBlocks).map((key: any) => {
                const { widget, data, slots, listeners, icon } =
                    DefaultBlocks[key];
                return (
                    <AddMenuItem
                        key={key}
                        name={`Add ${getBlockDisplay(key)}`}
                        json={{
                            widget: widget,
                            data: data,
                            slots: (slots || {}) as BlockJSON['slots'],
                            listeners: listeners || {},
                        }}
                        icon={icon}
                    />
                );
            })}
        </>
    );
});
