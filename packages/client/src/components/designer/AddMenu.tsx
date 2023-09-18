import { observer } from 'mobx-react-lite';
import { WidgetJSON } from '@semoss/canvas';

import { AddMenuItem } from './AddMenuItem';

export const AddMenu = observer(() => {
    return (
        <>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => {
                return (
                    <AddMenuItem
                        key={idx}
                        name={`Add ${idx}`}
                        json={{
                            widget: 'text',
                            data: {
                                style: {
                                    display: 'block',
                                },
                                text: `Add ${idx}`,
                            },
                            slots: {} as WidgetJSON['slots'],
                            listeners: {},
                        }}
                    />
                );
            })}
        </>
    );
});
