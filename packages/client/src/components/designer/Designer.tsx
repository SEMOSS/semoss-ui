import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Stack, Paper } from '@semoss/ui';

import { useDesigner } from '@/hooks';
import { ErrorBoundary } from '@/components/common';
import { Renderer } from '@/components/blocks';
import { Screen } from './Screen';

export const Designer = observer((): JSX.Element => {
    const { designer } = useDesigner();

    if (!designer) {
        return null;
    }

    return (
        <Screen>
            <ErrorBoundary title={'Something went wrong!'}>
                <Renderer id={designer.rendered} />
            </ErrorBoundary>
        </Screen>
    );
});
