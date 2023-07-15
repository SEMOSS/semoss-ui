import { createElement, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { List } from '@semoss/ui';

import { usePipeline } from '@/hooks';
import { NodeComponent } from './pipeline.types';

export const PipelineNewNodeMenu = observer(() => {
    const { pipeline, registry } = usePipeline();

    // convert to sorted list
    const nodes: NodeComponent[] = useMemo(() => {
        return Object.values(registry).sort((a, b) => {
            if (a.display.name < b.display.name) {
                return -1;
            }
            if (a.display.name > b.display.name) {
                return 1;
            }
            return 0;
        });
    }, [registry]);

    return (
        <List>
            {nodes.map((n) => {
                return (
                    <List.Item key={n.guid} divider>
                        <List.ItemButton
                            onClick={() =>
                                pipeline.addNode(
                                    {
                                        guid: n.guid,
                                        display: n.display,
                                        ...n.config,
                                    },
                                    {
                                        x: 200,
                                        y: 200,
                                    },
                                )
                            }
                        >
                            <List.Icon>{n.display.icon}</List.Icon>
                            <List.ItemText
                                primary={n.display.name}
                                secondary={n.display.description}
                            />
                        </List.ItemButton>
                    </List.Item>
                );
            })}
        </List>
    );
});
