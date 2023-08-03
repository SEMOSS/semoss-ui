import { useEffect, useState } from 'react';
import {
    styled,
    Alert,
    Box,
    Button,
    Stack,
    LinearProgress,
    TextField,
    Typography,
    Paper,
} from '@semoss/ui';
import { useForm, Controller } from 'react-hook-form';
import { useInsight } from '@semoss/sdk';

import { Markdown } from '@/components/common';

const StyledContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: '900px',
    width: '95%',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
}));

export const PolicyPage = () => {
    const { actions } = useInsight();

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [answer, setAnswer] = useState({
        question: '',
        conclusion: '',
        detailed_answer: '',
    });

    const { control, handleSubmit } = useForm({
        defaultValues: {
            QUESTION: '',
        },
    });

    /**
     * Allow the user to ask a question
     */
    const ask = handleSubmit(async (data: { QUESTION: string }) => {
        // turn on loading
        setIsLoading(true);
        setIsAnswered(false);

        if (!data.QUESTION) {
            setError('Question is required');

            // turn of loading
            setIsLoading(false);
            return;
        }

        const pixel = `
            RunPolicy(question=['${data.QUESTION}'])
        `;

        actions
            .run(pixel)
            .then((response) => {
                // turn of loading
                setIsLoading(false);
                setIsAnswered(true);

                let conclusion = '';
                let detailed_answer = '';

                // get the data
                try {
                    const output = response.pixelReturn[0].output as string;

                    const parsed = JSON.parse(output) as {
                        conclusion: string;
                        detailed_answer: string;
                    };

                    conclusion = parsed.conclusion || '';
                    detailed_answer = parsed.detailed_answer || '';
                } catch {
                    // noop
                    conclusion = 'Unable to find conclusion';
                    detailed_answer = '';
                }

                // set answer based on data
                setAnswer({
                    question: data.QUESTION,
                    conclusion,
                    detailed_answer,
                });
            })
            .catch((error) => {
                if (error.message) {
                    setError(error.message);
                } else {
                    setError('Error asking question');
                }

                // turn of loading
                setIsLoading(false);
            });
    });

    useEffect(() => {
        setIsLoading(true);

        const pixel = `
            LoadPolicy();
        `;

        actions
            .run(pixel)
            .then(() => {
                // turn of loading
                setIsLoading(false);
            })
            .catch((error) => {
                if (error.message) {
                    setError(error.message);
                } else {
                    setError('Error loading bot');
                }
            })
            .finally(() => {
                // turn of loading
                setIsLoading(false);
            });
    }, []);

    return (
        <Stack alignItems={'center'} justifyContent={'center'}>
            <StyledContainer>
                <StyledPaper variant={'elevation'} elevation={2} square>
                    <Stack spacing={2}>
                        <Typography variant="h5">AskMe.AI</Typography>
                        <Typography variant="body1">
                            Assists case-workers in answering complex policy,
                            operational procedure, and system questions. This
                            engine takes data such as policy manuals, system
                            documents, process maps, data from case databases as
                            inputs, and uses LLM models to provide answers.
                        </Typography>

                        {error && <Alert color="error">{error}</Alert>}
                        <Controller
                            name={'QUESTION'}
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => {
                                return (
                                    <TextField
                                        label="Enter Question:"
                                        variant="outlined"
                                        fullWidth
                                        value={field.value ? field.value : ''}
                                        onChange={(e) =>
                                            // set the value
                                            field.onChange(e.target.value)
                                        }
                                        multiline
                                        rows={4}
                                    />
                                );
                            }}
                        />
                        <Stack
                            flexDirection={'row'}
                            alignItems={'center'}
                            justifyContent={'center'}
                            gap={1}
                        >
                            <Button
                                variant="contained"
                                disabled={isLoading}
                                onClick={ask}
                                sx={{ flex: 1 }}
                            >
                                Generate Answer
                            </Button>
                        </Stack>
                        {isAnswered && (
                            <Stack>
                                <Typography
                                    variant={'subtitle2'}
                                    sx={{ fontWeight: '600' }}
                                >
                                    Question:
                                </Typography>
                                <Typography variant={'body1'} sx={{ mb: 2 }}>
                                    {answer.question}
                                </Typography>
                                <Typography
                                    variant={'subtitle1'}
                                    sx={{ fontWeight: '600', mb: 0.5 }}
                                >
                                    Policy Extraction Response:
                                </Typography>
                                <Typography
                                    variant={'subtitle2'}
                                    sx={{ color: '#1260DD', fontWeight: '600' }}
                                >
                                    Conclusion:
                                </Typography>
                                <Box sx={{ mb: 2, overflow: 'auto' }}>
                                    <Markdown>{answer.conclusion}</Markdown>
                                </Box>
                                {answer.detailed_answer && (
                                    <>
                                        <Typography
                                            variant={'subtitle2'}
                                            sx={{
                                                color: '#1260DD',
                                                fontWeight: '600',
                                            }}
                                        >
                                            Detailed Response:
                                        </Typography>
                                        <Box sx={{ overflow: 'auto' }}>
                                            <Markdown>
                                                {answer.detailed_answer}
                                            </Markdown>
                                        </Box>
                                    </>
                                )}
                            </Stack>
                        )}
                    </Stack>
                </StyledPaper>
                {isLoading && <LinearProgress />}
            </StyledContainer>
        </Stack>
    );
};
