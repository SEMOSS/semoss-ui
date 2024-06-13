import React, { useState, useEffect } from 'react';
import { Stack, Typography } from '@semoss/ui';
import { BlocksRenderer } from '@/components/blocks-workspace';
import { useBlocks, useLLMComparison } from '@/hooks';
import { SerializedState, Variable } from '@/stores';

export const ABTesting = () => {
    const { state } = useBlocks();
    const { variants } = useLLMComparison();
    const [appState, setAppState] = useState<SerializedState | null>(null);

    /**
     * Add to app state the necessary blocks to show responses for new variants
     * THIS IS NOT AN IDEAL APPROACH, BRUTE FORCE
     */
    // useEffect(() => {
    //     const currentState = state.toJSON();

    //     variants.models.forEach((variant) => {
    //         variant.forEach((model) => {
    //             if (!model) return;
    //             // 1. Create a new dependency and variable for iterated model.  MAKE SURE ITS UNIQ
    //             const dependencyId = `model--${Math.floor(
    //                 Math.random() * 10000,
    //             )}`;
    //             currentState.dependencies[dependencyId] = model.value;

    //             let variableId = `variable--${Math.floor(
    //                 Math.random() * 10000,
    //             )}`;
    //             let uniq = false;

    //             while (!uniq) {
    //                 variableId = `variable--${Math.floor(
    //                     Math.random() * 10000,
    //                 )}`;
    //                 if (!currentState.variables[variableId]) {
    //                     uniq = true;
    //                 }
    //             }

    //             const newVariable: Variable = {
    //                 alias: `${model.alias}--${Math.floor(
    //                     Math.random() * 10000,
    //                 )}`,
    //                 to: dependencyId,
    //                 type: 'model',
    //             };

    //             currentState.variables[variableId] = newVariable;

    //             // 2. What queries in state use this model, get a copy of them, swap out variable reference and add to state
    //             Object.entries(state.toJSON().queries).forEach((q) => {
    //                 const query = q[1];
    //                 const cells = query.cells;
    //                 const cellsCopy = cells;
    //                 let hasChange = false;

    //                 cells.forEach((c, i) => {
    //                     if (c.parameters.code) {
    //                         const code = c.parameters.code as string;
    //                         const codeCopy = code;
    //                         if (code.includes(`{{${model.alias}}}`)) {
    //                             const newCode = codeCopy.replace(
    //                                 new RegExp(`{{${model.alias}}}`, 'g'),
    //                                 `{{${newVariable.alias}}}`,
    //                             );

    //                             cellsCopy[i].parameters.code = newCode;

    //                             hasChange = true;
    //                         }
    //                     }
    //                 });

    //                 if (hasChange) {
    //                     const queryId = q[0];

    //                     let newQueryId;
    //                     let uniqQuery = false;

    //                     while (!uniqQuery) {
    //                         newQueryId = `compare--${queryId}--${Math.floor(
    //                             Math.random() * 10000,
    //                         )}`;
    //                         if (!currentState.queries[newQueryId]) {
    //                             uniqQuery = true;
    //                         }
    //                     }

    //                     // Create new query
    //                     currentState.queries[newQueryId] = {
    //                         cells: cellsCopy,
    //                         id: newQueryId,
    //                     };

    //                     // see if query is tied to a button, if it is add to listener
    //                     Object.entries(currentState.blocks).forEach((block) => {
    //                         const b = block[1];

    //                         if (b.widget === 'button') {
    //                             let newListener;
    //                             b.listeners.onClick.forEach((q) => {
    //                                 if (q.payload['queryId'] === queryId) {
    //                                     newListener = {
    //                                         ...q,
    //                                         payload: {
    //                                             queryId: newQueryId,
    //                                         },
    //                                     };
    //                                 }
    //                             });

    //                             if (newListener) {
    //                                 currentState.blocks[
    //                                     block[0]
    //                                 ].listeners.onClick.push(newListener);
    //                             }
    //                         }
    //                     });

    //                     // 3. Create a new UI block
    //                     Object.entries(currentState.blocks).forEach((block) => {
    //                         const b = block[1];

    //                         let newBlockId;
    //                         let uniqBlockId = false;

    //                         while (!uniqBlockId) {
    //                             newBlockId = `${b.widget}--${Math.floor(
    //                                 Math.random() * 10000,
    //                             )}`;
    //                             if (!currentState.blocks[newBlockId]) {
    //                                 uniqBlockId = true;
    //                             }
    //                         }

    //                         if (b.widget === 'text') {
    //                             const text = b.data.text as string;
    //                             if (text.includes(`{{query.${queryId}`)) {
    //                                 currentState.blocks[newBlockId] = {
    //                                     ...b,
    //                                     data: {
    //                                         ...b.data,
    //                                         text: text.replace(
    //                                             new RegExp(
    //                                                 `{{query.${queryId}`,
    //                                                 'g',
    //                                             ),
    //                                             `{{query.${newQueryId}`,
    //                                         ),
    //                                     },
    //                                 };
    //                                 currentState.blocks[b.parent.id];
    //                                 currentState.blocks[b.parent.id].slots[
    //                                     b.parent.slot
    //                                 ]['children'].push(newBlockId);
    //                             }
    //                         } else if (b.widget === 'markdown') {
    //                             const markdown = b.data.markdown as string;
    //                             if (markdown.includes(`{{query.${queryId}`)) {
    //                                 currentState.blocks[newBlockId] = {
    //                                     ...b,
    //                                     data: {
    //                                         ...b.data,
    //                                         markdown: markdown.replace(
    //                                             new RegExp(
    //                                                 `{{query.${queryId}`,
    //                                                 'g',
    //                                             ),
    //                                             `{{query.${newQueryId}`,
    //                                         ),
    //                                     },
    //                                 };

    //                                 currentState.blocks[b.parent.id].slots[
    //                                     b.parent.slot
    //                                 ]['children'].push(newBlockId);
    //                             }
    //                         }
    //                     });
    //                 }
    //             });
    //         });
    //     });

    //     setAppState(currentState);

    //     return () => {
    //         setAppState(null);
    //     };
    // }, [variants.models.length]);

    return (
        <Stack sx={{ height: '100%' }}>
            {/* <Stack pt={3} pl={3}>
                <Typography variant="body2">Back to Configure</Typography>
            </Stack> */}

            <div style={{ height: '100%', overflowY: 'scroll' }}>
                {appState ? <BlocksRenderer state={appState} /> : 'Loading'}
            </div>
        </Stack>
    );
};
