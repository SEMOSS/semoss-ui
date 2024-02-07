import { useState } from 'react';
import { Grid, IconButton, Modal, useNotification } from '@/component-library';
import { PromptLibraryCards } from './PromptLibraryCards';
import { PromptLibraryList } from './PromptLibraryList';
import { PromptExamples } from './examples';
import { Builder, Token } from '../prompt.types';
import { setBlocksAndOpenUIBuilder } from '../prompt.helpers';
import { useNavigate } from 'react-router-dom';
import { Close } from '@mui/icons-material';
import { useRootStore } from '@/hooks';

export const PromptLibraryDialog = (props: {
    builder: Builder;
    promptLibraryOpen: boolean;
    closePromptLibrary: () => void;
}) => {
    const { monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const [filter, setFilter] = useState('all');

    const filteredPrompts = () => {
        return PromptExamples.filter((prompt) => {
            if (filter == 'all') {
                return true;
            } else {
                return prompt.tags.includes(filter);
            }
        }).sort(function (a, b) {
            const firstTitle = a.title.toLowerCase();
            const secondTitle = b.title.toLowerCase();
            if (firstTitle < secondTitle) {
                return -1;
            }
            if (firstTitle > secondTitle) {
                return 1;
            }
            return 0;
        });
    };

    async function openUIBuilderForTemplate(
        title: string,
        tags: string[],
        inputs: Token[],
        inputTypes: object,
    ) {
        const templateBuilder: Builder = JSON.parse(
            JSON.stringify(props.builder),
        );
        templateBuilder.title.value = templateBuilder.title.value ?? title;
        templateBuilder.tags.value = tags;
        templateBuilder.inputs.value = inputs;
        templateBuilder.inputTypes.value = inputTypes;
        try {
            await setBlocksAndOpenUIBuilder(
                templateBuilder,
                monolithStore,
                navigate,
            );
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    }

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
                        <PromptLibraryList
                            filter={filter}
                            setFilter={setFilter}
                        />
                    </Grid>
                    <Grid item xs={10}>
                        <PromptLibraryCards
                            filter={filter}
                            prompts={filteredPrompts()}
                            openUIBuilderForTemplate={openUIBuilderForTemplate}
                        />
                    </Grid>
                </Grid>
            </Modal.Content>
        </Modal>
    );
};
