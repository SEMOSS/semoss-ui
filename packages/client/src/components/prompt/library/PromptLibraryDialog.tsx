import { useState, useEffect } from 'react';
import { Grid, IconButton, Modal, useNotification } from '@semoss/ui';
import { PromptLibraryCards } from './PromptLibraryCards';
import { PromptLibraryList } from './PromptLibraryList';
import { PromptExamples } from './examples';
import { Builder, Token } from '../prompt.types';
import { setBlocksAndOpenUIBuilder } from '../prompt.helpers';
import { useNavigate } from 'react-router-dom';
import { Close } from '@mui/icons-material';
import { useRootStore } from '@/hooks';
import { constants } from 'crypto';
import { Prompt } from '../prompt.types';

export const PromptLibraryDialog = (props: {
    builder: Builder;
    promptLibraryOpen: boolean;
    closePromptLibrary: () => void;
    setBuilderValue: (builderStepKey: string, value: string | string[]) => void;
}) => {
    const { monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const [filter, setFilter] = useState('all');
    const [allPrompts, setAllPrompts] = useState([]);

    const filteredPrompts = () => {
        return allPrompts.length > 0
            ? allPrompts
                  .filter((prompt) => {
                      if (filter == 'all') {
                          return true;
                      } else {
                          return prompt.tags
                              ? prompt.tags.includes(filter)
                              : false;
                      }
                  })
                  .sort(function (a, b) {
                      const firstTitle = a.title.toLowerCase();
                      const secondTitle = b.title.toLowerCase();
                      if (firstTitle < secondTitle) {
                          return -1;
                      }
                      if (firstTitle > secondTitle) {
                          return 1;
                      }
                      return 0;
                  })
            : [];
    };

    const handlePromptTemplateSelection = (prompt: Prompt) => {
        console.log(prompt);
        console.log(props.builder);
        if (prompt.id) {
            props.setBuilderValue(
                'context',
                prompt.context ? prompt.context : '',
            );
            props.setBuilderValue('tags', prompt.tags ? prompt.tags : []);
            props.setBuilderValue('id', prompt.id ? prompt.id : null);
            props.setBuilderValue('title', prompt.title ? prompt.title : '');
            props.closePromptLibrary();
        }
    };

    //Load all the prompts
    useEffect(() => {
        init();
    }, []);

    const init = () => {
        monolithStore.runQuery('ListPrompt()').then((response) => {
            const { output } = response.pixelReturn[0];
            if (output.length > 0) {
                const prompts = [];
                output.map((prompt) => {
                    prompts.push({
                        title: prompt.TITLE,
                        context: prompt.CONTEXT,
                        intent: prompt.INTENT,
                        tags: prompt.tags ? prompt.tags : [],
                        token: prompt.tokens ? prompt.tokens : [],
                        inputTypes: prompt.inputTypes ? prompt.inputTypes : {},
                        id: prompt.ID ? prompt.ID : null,
                    });
                });
                setAllPrompts(prompts);
            }
        });
    };

    // async function openUIBuilderForTemplate(
    //     title: string,
    //     tags: string[],
    //     inputs: Token[],
    //     inputTypes: object,
    // ) {
    //     const templateBuilder: Builder = JSON.parse(
    //         JSON.stringify(props.builder),
    //     );
    //     templateBuilder.title.value = templateBuilder.title.value ?? title;
    //     templateBuilder.tags.value = tags;
    //     templateBuilder.inputs.value = inputs;
    //     templateBuilder.inputTypes.value = inputTypes;
    //     try {
    //         await setBlocksAndOpenUIBuilder(
    //             templateBuilder,
    //             monolithStore,
    //             navigate,
    //         );
    //     } catch (e) {
    //         notification.add({
    //             color: 'error',
    //             message: e.message,
    //         });
    //     }
    // }

    return (
        <Modal
            onClose={(_, reason: string) => {
                if (reason && reason == 'backdropClick') {
                    return;
                }
                props.closePromptLibrary();
            }}
            aria-labelledby="dialog-title"
            fullWidth
            maxWidth="xl"
            open={props.promptLibraryOpen}
        >
            <Modal.Title>Prompt Library</Modal.Title>
            <IconButton
                aria-label="close"
                onClick={() => props.closePromptLibrary()}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <Close />
            </IconButton>
            <Modal.Content sx={{ height: '60vh' }}>
                <Grid container spacing={2}>
                    <Grid item xs={2}>
                        {/* TODO: Needs to play well with what we have */}
                        <PromptLibraryList
                            filter={filter}
                            setFilter={setFilter}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        {/* TODO: onClick needs to play well with Agent Builders openUIBuilderForTemplate  */}
                        <PromptLibraryCards
                            filter={filter}
                            prompts={filteredPrompts()}
                            // openUIBuilderForTemplate={openUIBuilderForTemplate}
                            onClick={(prompt) => {
                                handlePromptTemplateSelection(prompt);
                            }}
                        />
                    </Grid>
                </Grid>
            </Modal.Content>
        </Modal>
    );
};
