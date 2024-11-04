import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Button, Stack, Typography, useNotification, Grid } from '@semoss/ui';
import { Page } from '@/components/ui';
import { useRootStore } from '@/hooks';
import { PromptModal } from './PromptModal';
import { PromptLibraryCards } from '../../components/prompt/library/PromptLibraryCards';
import { Prompt } from '../../components/prompt/prompt.types';
import { PromptLibraryList } from '@/components/prompt/library/PromptLibraryList';

export const PromptPage = observer(() => {
    const { monolithStore } = useRootStore();
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptMode, setPromptMode] = useState('');
    const [promptToEdit, setPromptToEdit] = useState({});
    const [pageReload, setPageReload] = useState(false);

    const [filter, setFilter] = useState('all');
    const [allPrompts, setAllPrompts] = useState([]);

    /**
     * @desc Load prompts
     */
    useEffect(() => {
        init();
    }, [pageReload]);

    /**
     * @desc Gets All prompts
     */
    const init = () => {
        monolithStore.runQuery('ListPrompt()').then((response) => {
            const { output } = response.pixelReturn[0];
            if (output.length > 0) {
                const promptArr = [];
                output.map((prompt) => {
                    promptArr.push({
                        context: prompt.CONTEXT ? prompt.CONTEXT : '',
                        created_by: prompt.CREATED_BY ? prompt.CREATED_BY : '',
                        date_created: prompt.DATE_CREATED
                            ? prompt.DATE_CREATED
                            : '',
                        id: prompt.ID ? prompt.ID : '',
                        intent: prompt.INTENT ? prompt.INTENT : '',
                        title: prompt.TITLE ? prompt.TITLE : '',
                        tags: prompt.tags ? prompt.tags : [],
                    });
                });
                setAllPrompts(promptArr);
            }
        });
    };

    /**
     * @desc Filters our prompts based on filter specified
     * TODO: Have backend handle filtering on ListPrompt()
     */
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

    /**
     * @desc Used on click of prompt card
     */
    async function handlePromptEditClick(p: Prompt) {
        const tempPrompt = {
            title: p.title,
            tags: p.tags,
            context: p.context,
            id: p.id,
            intent: p.intent ? p.intent : '',
        };
        setPromptToEdit(tempPrompt);
        setPromptMode('Edit');
        setIsPromptModalOpen(true);
    }

    return (
        <Page
            header={
                <Stack>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                    >
                        <Stack
                            direction="row"
                            alignItems={'center'}
                            spacing={2}
                        >
                            <Typography
                                data-tour="app-library-title"
                                variant={'h4'}
                            >
                                Prompt Catalog
                            </Typography>
                        </Stack>
                        <Button
                            size={'large'}
                            variant={'contained'}
                            onClick={() => {
                                setPromptMode('Add');
                                setIsPromptModalOpen(true);
                            }}
                            aria-label={`Add Prompt`}
                        >
                            Add Prompt
                        </Button>
                    </Stack>
                    <Stack
                        direction="row"
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        spacing={4}
                        sx={{ paddingTop: '10px' }}
                    >
                        <Typography variant={'subtitle1'}>
                            Our prompt catalog is a versatile library of prompts
                            designed for various use cases. It offers an
                            abstracted interface, allowing developers and data
                            scientists to easily select and integrate the right
                            prompts into their applications. This flexibility
                            ensures optimized workflows and improved outcomes.
                        </Typography>
                    </Stack>
                </Stack>
            }
        >
            <Grid container spacing={2}>
                <Grid item xs={2}>
                    <PromptLibraryList
                        filter={filter}
                        setFilter={setFilter}
                        reload={pageReload}
                    />
                </Grid>
                <Grid item xs={10}>
                    <PromptLibraryCards
                        filter={filter}
                        prompts={filteredPrompts()}
                        onClick={(p: Prompt) => {
                            handlePromptEditClick(p);
                        }}
                    />
                </Grid>
            </Grid>
            <PromptModal
                isOpen={isPromptModalOpen}
                prompt={promptToEdit}
                onClose={(reload) => {
                    setIsPromptModalOpen(false);
                    if (reload) {
                        setPageReload(!pageReload);
                    }
                }}
                mode={promptMode}
            ></PromptModal>
        </Page>
    );
});
