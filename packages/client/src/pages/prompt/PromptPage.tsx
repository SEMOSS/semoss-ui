import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
    Button,
    Stack,
    Typography,
    TextField,
    styled,
    Box,
    Table,
    useNotification,
    Grid,
} from '@semoss/ui';
import { Page } from '@/components/ui';
import { useRootStore } from '@/hooks';
import { PromptModal } from './PromptModal';
import { PromptLibraryCards } from '../../components/prompt/library/PromptLibraryCards';
import { PromptLibraryList } from '../../components/prompt/library/PromptLibraryList';
import { Builder, Token } from '../../components/prompt/prompt.types';
import { setBlocksAndOpenUIBuilder } from '../../components/prompt/prompt.helpers';

const StyledBox = styled(Box)(() => ({
    height: '500',
    width: '100%',
}));

export const PromptPage = observer(() => {
    const { monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [promptMode, setPromptMode] = useState('');
    const [promptToEdit, setPromptToEdit] = useState({});
    const [pageReload, setPageReload] = useState(false);

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

    async function handlePromptEditClick(
        title: string,
        tags: string[],
        inputs: Token[],
        inputTypes: object,
        context: string,
        intent: string,
        id: string,
    ) {
        let tempPrompt = {
            title: title,
            tags: tags,
            inputs: inputs,
            inputTypes: inputTypes,
            context: context,
            id: id,
            intent: intent ? intent : '',
        };
        setPromptToEdit(tempPrompt);
        setPromptMode('Edit');
        setIsPromptModalOpen(true);
    }

    //Load all the prompts
    useEffect(() => {
        init();
    }, [pageReload]);

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
                                Prompts
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
                        openUIBuilderForTemplate={handlePromptEditClick}
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
