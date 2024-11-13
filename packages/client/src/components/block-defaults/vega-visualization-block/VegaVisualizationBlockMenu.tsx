import { BlockComponent } from '@/stores';
import { Button, Stack } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
    JsonSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';
import { ChartFeatures } from '@/components/block-settings/shared/ChartFeatures';
import { useState } from 'react';

export const VegaVisualizationBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    const [activeTab, setActiveTab] = useState('json');
    return (
        <Stack padding={2} height="100%">
            {/* CodeEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON */}
            {/* Not sure if we want to delete JsonSettings but it's no longer in use here */}
            {/* <JsonSettings id={id} path="specJson" /> */}
            {/* <ChartFeatures id={id} path="specJson" /> */}
            {/* Tab buttons */}
            <div>
                <Button
                    onClick={() => setActiveTab('json')}
                    className={activeTab === 'json' ? 'active' : ''}
                >
                    JSON Settings
                </Button>
                <Button
                    onClick={() => setActiveTab('features')}
                    className={activeTab === 'features' ? 'active' : ''}
                >
                    Chart Features
                </Button>
            </div>

            {/* Tab content */}
            {activeTab === 'json' && <JsonSettings id={id} path="specJson" />}
            {activeTab === 'features' && (
                <ChartFeatures id={id} path="specJson" />
            )}

            {/* <CodeEditorSettings id={id} path="specJson" /> */}
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="specJson"
                    appendPrompt={
                        'Use vega lite version 5 and make the schema as simple as possible. Return the response as JSON. Ensure "data" is a top-level key in the JSON object.'
                    }
                    placeholder="Ex: Generate a bar graph."
                    valueAsObject
                />
            )}
        </Stack>
    );
};
