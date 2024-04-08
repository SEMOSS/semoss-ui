import { BlockComponent } from '@/stores';
import { Stack } from '@semoss/ui';
import {
    AIGenerationSettings,
    CodeEditorSettings,
} from '@/components/block-settings';
import { useBlock } from '@/hooks';

export const HTMLBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    console.log({
        id,
        data,
    });
    return (
        <Stack padding={2} height="100%">
            <CodeEditorSettings id={id} path="html" />

            {/* the AI tool input and button underneath editor is fixed / working */}
            {!data.variation && (
                <AIGenerationSettings
                    id={id}
                    path="html"
                    appendPrompt={`Use the previous user prompt to create code for an HTML file.`}
                    placeholder="Ex: Generate an HTML login page."
                    valueAsObject
                />
            )}
        </Stack>
    );
};
