import React from 'react';
import { observer } from 'mobx-react-lite';

import { useDesigner } from '@/hooks';
import { ErrorBoundary } from '@/components/common';
import { Renderer } from '@/components/blocks';

import { Screen } from './Screen';
interface DesignerPanelProps {
    /** Id of the designer */
    id: string;
}

export const Designer = observer(
    (props: DesignerPanelProps): React.JSX.Element => {
        const { designer } = useDesigner();
        const id = props.id;

        if (!designer) {
            return null;
        }

        return (
            <Screen>
                <ErrorBoundary title={'Something went wrong!'}>
                    <Renderer id={id} />
                </ErrorBoundary>
            </Screen>
        );
    },
);
