import { observer } from 'mobx-react-lite';
import { BlockConfig, BlockJSON } from '@/stores';

import { AddMenuItem } from './AddMenuItem';
import { DefaultBlocks } from '../block-defaults';

export const AddMenu = observer(() => {
    return (
        <>
            {Object.keys(DefaultBlocks).map((key: any) => {
                const { widget, data, slots, listeners, icon } =
                    DefaultBlocks[key];
                return (
                    <AddMenuItem
                        key={key}
                        name={`Add ${key}`}
                        json={{
                            widget: widget,
                            data: data,
                            slots: (slots || {}) as BlockJSON['slots'],
                            listeners: listeners || {},
                        }}
                        icon={DefaultBlocks[key].icon}
                    />
                );
            })}
        </>
    );
});
