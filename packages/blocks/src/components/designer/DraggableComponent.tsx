import React from 'react';
import { Registry } from '@/stores';

import { config as ButtonBlockConfig, ButtonBlockDef } from './button-block';
import {
    config as ContainerBlockConfig,
    ContainerBlockDef,
} from './container-block';
import { config as InputBlockConfig, InputBlockDef } from './input-block';
import { config as PageBlockConfig, PageBlockDef } from './page-block';
import { config as TextBlockConfig, TextBlockDef } from './text-block';
import {
    config as TextFieldBlockConfig,
    TextFieldBlockDef,
} from './text-field-block';

export type DefaultBlockDefinitions =
    | ButtonBlockDef
    | ContainerBlockDef
    | InputBlockDef
    | PageBlockDef
    | TextBlockDef
    | TextFieldBlockDef;

export const DefaultBlocks: Registry<DefaultBlockDefinitions> = {
    [ButtonBlockConfig.widget]: ButtonBlockConfig,
    [ContainerBlockConfig.widget]: ContainerBlockConfig,
    [InputBlockConfig.widget]: InputBlockConfig,
    [PageBlockConfig.widget]: PageBlockConfig,
    [TextBlockConfig.widget]: TextBlockConfig,
    [TextFieldBlockConfig.widget]: TextFieldBlockConfig,
};

const DraggableComponent: React.FC = (block: any) => {
    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('componentType', 'ComponentType3'); // Set the component type you want to create on drop
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            style={{
                width: '100px',
                height: '100px',
                background: 'lightgreen',
                margin: '10px',
            }}
        >
            Draggable Component
        </div>
    );
};

export default DraggableComponent;
