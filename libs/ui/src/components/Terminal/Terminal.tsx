import { useRef, useEffect, useState, useCallback } from "react";
import { styled, SxProps } from "@mui/material";

import "@xterm/xterm/css/xterm.css";
import "./terminal.css";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";

import { TerminalSpinner } from "./TerminalSpinner";

const StyledTerminal = styled("div")(({ theme }) => ({
    height: "100%",
    width: "100%",
    overflow: "hidden",
}));

// prompt for new input
const PROMPT = `\x1b[1;30m> \x1b[0m`;
const PROMPT_LENGTH = 2;

export interface TerminalProps {
    /** Default command to display */
    defaultCommand?: string;

    /** Track if the terminal is disabled */
    disabled?: boolean;

    /** Track if the terminal is loading */
    loading?: boolean;

    /** Instructions to show in the terminal with the prompt */
    instructions?: string;

    /** Welcome message to show in the terminal */
    welcome?: string;

    /** History of the terminal */
    history: {
        /** Instructions to show in the terminal with the command */
        instructions?: string;

        /** Command that was executed */
        command: string;

        /** Response after the command */
        response: string;
    }[];

    /** Fired when the command is set */
    onCommand: (command: string) => void;

    /** Callback that is fired when a command is run */
    onRun: () => Promise<void>;

    /** custom style object */
    sx?: SxProps;
}

export const Terminal: React.FC<TerminalProps> = ({
    defaultCommand = "",
    disabled = false,
    loading = false,
    welcome = "",
    history = [],
    instructions = "",
    onCommand = () => null,
    onRun = () => null,
    sx,
}) => {
    // hold at ref to the terminal element
    const terminalRef = useRef<HTMLDivElement>(null);
    const spinnerRef = useRef<TerminalSpinner>(null);

    // create a buffer to store the typed in command, position of the cursor, and idx in history
    const [buffer, setBuffer] = useState<{
        command: string;
        position: number;
    }>({
        command: defaultCommand,
        position: defaultCommand.length,
    });
    const [historyPosition, setHistoryPosition] = useState<number>(
        history.length,
    );

    // save the instance
    const [terminalInstance, setTerminalInstance] = useState<XTerm>(null);

    const isDisabled = loading || disabled;

    // create the terminal on mount
    useEffect(() => {
        if (!terminalRef.current) {
            return;
        }

        // Create terminal instance
        const t = new XTerm({
            cursorBlink: true,
            cursorStyle: "bar",
            allowTransparency: true,
            theme: {
                foreground: "#E9E9E9",
                background: "#262626",
                selectionBackground: "#4E4E4E",
                cursor: "#8BCAFF",

                black: "#000000",
                brightBlack: "#515151",

                red: "#BF0D02",
                brightRed: "#DA291C",

                green: "#00B4A4",
                brightGreen: "#008674",

                yellow: "#EF8326",
                brightYellow: "#FA9F2C",

                blue: "#22A4FF",
                brightBlue: "#0094FF",

                magenta: "#FF4E90",
                brightMagenta: "#D62C71",

                cyan: "#975FE4",
                brightCyan: "#6A32CE",

                white: "#FAFAFA",
                brightWhite: "#FFFFFF",
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.2,
        });

        // create a new spinner for loading
        spinnerRef.current = new TerminalSpinner(t);

        // Create fit addon to ensure terminal resizes properly
        const fitAddon = new FitAddon();
        t.loadAddon(fitAddon);

        // add links
        const webLinksAddon = new WebLinksAddon();
        t.loadAddon(webLinksAddon);

        // add search
        const searchAddon = new SearchAddon();
        t.loadAddon(searchAddon);

        // mount it
        t.open(terminalRef.current);

        // resize
        const observer = new ResizeObserver(() => {
            fitAddon.fit();
        });

        observer.observe(terminalRef.current);

        // initialize size
        fitAddon.fit();

        // save the state
        setTerminalInstance(t);

        // cleanup
        return () => {
            if (t) {
                t.dispose();
            }

            spinnerRef.current?.destroy();

            observer.disconnect();

            setTerminalInstance(null);
        };
    }, []);

    // add the listeners
    useEffect(() => {
        if (!terminalInstance) {
            return;
        }

        // add listeners
        const onData = terminalInstance.onData(async (key: string) => {
            if (isDisabled) {
                return;
            }

            // copy the old buffer into the updated
            let updatedBuffer = {
                ...buffer,
            };

            // copy the old position into the updated
            let updatedHistoryPosition = historyPosition;

            switch (key) {
                // Enter
                case "\r": {
                    // run the command
                    await onRun();

                    // clear it
                    updatedBuffer = {
                        command: "",
                        position: 0,
                    };

                    break;
                }

                // Backspace
                case "\x7F": {
                    if (updatedBuffer.position > 0) {
                        // subtract as the position
                        updatedBuffer.command =
                            updatedBuffer.command.slice(
                                0,
                                updatedBuffer.position - 1,
                            ) +
                            updatedBuffer.command.slice(updatedBuffer.position);

                        // shift the position
                        updatedBuffer.position--;

                        // clear the line, add the buffer, move to the first position and then move to the buffer position
                        terminalInstance.write(
                            `\r\x1b[2K${PROMPT}${updatedBuffer.command}\r\x1b[${
                                PROMPT_LENGTH + updatedBuffer.position
                            }C`,
                        );
                    }

                    break;
                }

                // Arrow Up
                case "\x1b[A": {
                    // decrement and make sure it is always greater than 0
                    updatedHistoryPosition--;
                    if (updatedHistoryPosition < 0) {
                        updatedHistoryPosition = 0;
                    }

                    // set the buffer to the command from the history
                    updatedBuffer.command =
                        history[updatedHistoryPosition].command;
                    updatedBuffer.position =
                        history[updatedHistoryPosition].command.length;

                    // clear the line and add the buffer
                    terminalInstance.write(
                        `\r\x1b[2K${PROMPT}${updatedBuffer.command}`,
                    );
                    break;
                }

                // Arrow Down
                case "\x1b[B": {
                    // increment and make sure it is not longer than the history
                    updatedHistoryPosition++;
                    if (updatedHistoryPosition > history.length) {
                        updatedHistoryPosition = history.length;
                    }

                    // if it is equal to this history, set as empty
                    if (updatedHistoryPosition === history.length) {
                        updatedBuffer.command = "";
                        updatedBuffer.position = 0;
                    } else {
                        // set the buffer to the command from the history
                        updatedBuffer.command =
                            history[updatedHistoryPosition].command;
                        updatedBuffer.position =
                            history[updatedHistoryPosition].command.length;
                    }

                    // clear the line and add the buffer
                    terminalInstance.write(
                        `\r\x1b[2K${PROMPT}${updatedBuffer.command}`,
                    );
                    break;
                }

                // Arrow Left
                case "\x1b[D": {
                    // decrement and make sure it is always greater than or equal to 0
                    updatedBuffer.position--;
                    if (updatedBuffer.position < 0) {
                        updatedBuffer.position = 0;
                    }

                    // move to the first charcter, then move to the buffer position
                    terminalInstance.write(
                        `\r\x1b[${PROMPT_LENGTH + updatedBuffer.position}C`,
                    );

                    break;
                }

                // Arrow Right
                case "\x1b[C": {
                    // increment and make sure it is always greater than or equal to the current one
                    updatedBuffer.position++;
                    if (updatedBuffer.position > updatedBuffer.command.length) {
                        updatedBuffer.position = updatedBuffer.command.length;
                    }

                    // move to the first charcter, then move to the buffer position
                    terminalInstance.write(
                        `\r\x1b[${PROMPT_LENGTH + updatedBuffer.position}C`,
                    );

                    break;
                }

                // check if is a valid alphanumeric by doing a string comparison
                // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than
                default: {
                    if (
                        key >= String.fromCharCode(32) &&
                        key <= String.fromCharCode(126)
                    ) {
                        // insert at the position
                        updatedBuffer.command =
                            updatedBuffer.command.slice(
                                0,
                                updatedBuffer.position,
                            ) +
                            key +
                            updatedBuffer.command.slice(updatedBuffer.position);

                        // shift the position
                        updatedBuffer.position += key.length;

                        // clear the line, add the buffer, move to the first position and then move to the buffer position
                        terminalInstance.write(
                            `\r\x1b[2K${PROMPT}${updatedBuffer.command}\r\x1b[${
                                PROMPT_LENGTH + updatedBuffer.position
                            }C`,
                        );
                    }
                }
            }

            // save the buffer
            setBuffer(updatedBuffer);
            setHistoryPosition(updatedHistoryPosition);

            // update the command
            onCommand(updatedBuffer.command);
        });

        // cleanup
        return () => {
            if (onData) {
                onData.dispose();
            }
        };
    }, [
        terminalInstance,
        isDisabled,
        buffer,
        historyPosition,
        history,
        onRun,
        onCommand,
    ]);

    // render whenever the instance changes
    useEffect(() => {
        if (!terminalInstance) {
            return;
        }

        // reset + clear
        terminalInstance.reset();

        // message
        if (welcome) {
            terminalInstance.writeln(welcome);
            terminalInstance.write(`\n\r`);
        }

        // add the history
        history.forEach((h) => {
            if (h.instructions) {
                terminalInstance.writeln(`${h.instructions}`);
            }
            terminalInstance.writeln(`${PROMPT}${h.command}`);
            terminalInstance.writeln(h.response);
            terminalInstance.write(`\n\r`);
        });

        // add an empty one
        if (instructions) {
            terminalInstance.writeln(`${instructions}`);
        }
        terminalInstance.write(`${PROMPT}${defaultCommand}`);

        setBuffer({
            command: defaultCommand,
            position: defaultCommand.length,
        });
        setHistoryPosition(history.length);
    }, [terminalInstance, welcome, history, instructions, defaultCommand]);

    // trigger loading
    useEffect(() => {
        if (loading) {
            spinnerRef.current?.start();
        } else {
            spinnerRef.current?.stop();
        }
    }, [loading]);

    // // reset historyPosition when history changes
    // useEffect(() => {
    //     setHistoryPosition(history.length);
    // }, [history]);

    // // reset historyPosition when history changes
    // useEffect(() => {
    //     setBuffer(history.length);
    // }, [defaultCommand]);

    return <StyledTerminal ref={terminalRef} sx={sx} />;
};
