import { useState } from 'react';
import { observer } from 'mobx-react-lite';

import {
    buildTable,
    Button,
    Stack,
    styled,
    Terminal,
    TerminalProps,
    ToggleButton,
    ToggleButtonGroup,
    useNotification,
} from '@semoss/ui';
import { CodeRounded, TerminalRounded } from '@mui/icons-material';

import { runPixel } from '@/api';
import PythonLogo from '@/assets/img/Python-logo.svg';
import RLogo from '@/assets/img/R-logo.svg';

import { Panel } from './Panel';

const StyledImage = styled('img')(({ theme }) => ({
    height: '13px',
    wdith: '13px',
}));

const LANGUAGE = {
    PIXEL: 'Pixel',
    PYTHON: 'Python',
    R: 'R',
    SHELL: 'Shell',
} as const;

interface FrameHeaders {
    headerInfo: {
        headers: {
            alias: string;
            header: string;
            dataType: string;
            adtlType: string;
            qsName: unknown;
        }[];
        joins: unknown[];
    };
}

interface TaskData {
    headerInfo?: {
        alias: string;
    }[];
    data: {
        values: unknown[][];
    };
}

export const TerminalPanel: React.FC = observer(() => {
    const notification = useNotification();

    const [history, setHistory] = useState<TerminalProps['history']>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const [command, setCommand] = useState<string>('');
    const [language, setLanguage] = useState('PIXEL');

    /**
     * Get instructions based on the language
     * @param language - current language
     * @returns instructions
     */
    const getInstructions = (language: string, prefix = '', postfix = '') => {
        let instructions = '';
        if (language === 'PIXEL') {
            instructions = `${prefix}\x1b[34mPixel\x1b[0m${postfix}`;
        } else if (language === 'SHELL') {
            instructions = `${prefix}\x1b[33mShell\x1b[0m${postfix}`;
        } else if (language === 'PYTHON') {
            instructions = `${prefix}\x1b[32mPython\x1b[0m${postfix}`;
        } else if (language === 'R') {
            instructions = `${prefix}\x1b[36mR\x1b[0m${postfix}`;
        }

        return instructions;
    };

    /**
     * Run a command
     * @param command - command to run
     * @param id - ID of the file
     * @param path - path to the file
     */
    const runCommand = async () => {
        try {
            setIsLoading(true);

            const cleaned = command.trim();
            if (!cleaned) {
                throw new Error(`No Command`);
            }

            let pixel = '';
            if (language === 'PIXEL') {
                pixel = cleaned;
            } else if (language === 'SHELL') {
                pixel = `Command("<encode>${cleaned}</encode>");`;
            } else if (language === 'PYTHON') {
                pixel = `Py("<encode>${cleaned}</encode>");`;
            }

            // run the pixel
            // TODO: Fix Insight ID
            const response = await runPixel(pixel);

            const updatedHistory = [...history];
            for (const r of response.pixelReturn) {
                const { output, operationType, timeToRun } = r;

                let postfix = '';
                // only show if longer than 5 seconds
                if (timeToRun > 5000) {
                    const seconds = Math.floor(timeToRun / 1000); // seconds
                    const minutes = Math.floor(timeToRun / 60);
                    postfix = ` in ${minutes
                        .toString()
                        .padStart(2, '0')}:${seconds
                        .toString()
                        .padStart(2, '0')}`;
                }

                let formatted: unknown = output;
                if (operationType.indexOf('TASK_DATA') > -1) {
                    const data = output as TaskData;

                    if (data.headerInfo) {
                        const headers = data.headerInfo.reduce(
                            (acc, val, idx) => {
                                acc[idx] = val.alias;
                                return acc;
                            },
                            {},
                        );

                        const table = data.data.values.map((row) => {
                            return row.reduce((acc, val, idx) => {
                                acc[headers[idx]] = val;
                                return acc;
                            }, {}) as Record<string, unknown>;
                        });

                        formatted = buildTable(table);
                    } else {
                        formatted = buildTable(data.data.values);
                    }
                } else if (operationType.indexOf('FRAME_HEADERSf') > -1) {
                    const data = output as FrameHeaders;

                    formatted = buildTable(data.headerInfo.headers);
                } else if (operationType.indexOf('CODE_EXECUTION') > -1) {
                    if (
                        Array.isArray(output) &&
                        output[0] &&
                        output[0].hasOwnProperty('output')
                    ) {
                        formatted = output[0].output;
                    }
                } else if (operationType.indexOf('INVALID_SYNTAX') > -1) {
                    formatted = `\x1b[31mInvalid Syntax: ${output}\x1b[0m`;
                } else if (operationType.indexOf('ERROR') > -1) {
                    formatted = `\x1b[31mError: ${output}\x1b[0m`;
                }

                updatedHistory.push({
                    instructions: getInstructions(
                        language,
                        'Executed ',
                        postfix,
                    ),
                    command: command,
                    response:
                        typeof formatted !== 'string'
                            ? JSON.stringify(formatted, null, 2)
                            : formatted,
                });
            }

            // update the history
            setHistory(updatedHistory);
        } catch (e) {
            notification.add({
                color: 'error',
                message: e,
            });

            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Panel
            footer={
                <>
                    <ToggleButtonGroup value={language} exclusive size="small">
                        {Object.entries(LANGUAGE).map(([value, name]) => {
                            return (
                                <ToggleButton
                                    key={value}
                                    value={value}
                                    title={`Switch to ${name}`}
                                    color={
                                        language === value
                                            ? 'primary'
                                            : undefined
                                    }
                                    onClick={() => {
                                        setLanguage(value);
                                    }}
                                >
                                    {value === 'PIXEL' && (
                                        <CodeRounded fontSize="inherit" />
                                    )}
                                    {value === 'PYTHON' && (
                                        <StyledImage src={PythonLogo} />
                                    )}
                                    {value === 'R' && (
                                        <StyledImage src={RLogo} />
                                    )}
                                    {value === 'SHELL' && (
                                        <TerminalRounded fontSize="inherit" />
                                    )}
                                </ToggleButton>
                            );
                        })}
                    </ToggleButtonGroup>
                    <Stack flex={1}>&nbsp;</Stack>
                    <Button
                        variant="contained"
                        size={'small'}
                        onClick={() => runCommand()}
                    >
                        Run
                    </Button>
                </>
            }
        >
            <Terminal
                loading={isLoading}
                history={history}
                instructions={getInstructions(language, 'Running ')}
                onRun={() => runCommand()}
                onCommand={(c) => setCommand(c)}
            />
        </Panel>
    );
});
