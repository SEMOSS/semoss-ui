import React, { useState } from "react";

import { Terminal } from ".";
import { TerminalProps } from "./Terminal";

export default {
    title: "Components/Terminal",
    component: Terminal,
};

const Template = (args) => {
    const [isLoading, setIsLoading] = useState(false);

    const [command, setCommand] = useState("");
    const [history, setHistory] = useState<TerminalProps["history"]>([
        {
            command: "Pixel Command 1",
            response: "1",
            instructions: `\x1b[34mPixel\x1b[0m`,
        },
        {
            command: "Shell Command 2",
            response: "2",
            instructions: `\x1b[33mShell\x1b[0m`,
        },
        {
            command: "Python Command 3",
            response: "3",
            instructions: `\x1b[32mPython\x1b[0m`,
        },
    ]);

    return (
        <div style={{ height: "200px", width: "100%" }}>
            <Terminal
                loading={isLoading}
                history={history}
                onCommand={(command) => {
                    setCommand(command);
                }}
                onRun={async () => {
                    setIsLoading(true);

                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    setHistory([
                        ...history,
                        {
                            command: command,
                            instructions: "pixel",
                            response: `Response ${Math.floor(
                                Math.random() * 10000,
                            )}`,
                        },
                    ]);

                    setIsLoading(false);

                    new Promise((resolve) =>
                        setTimeout(() => {
                            console.log("neel");
                            setCommand("neel");

                            resolve("A");
                        }, 2000),
                    );
                }}
            />
        </div>
    );
};

export const Default = Template.bind({});

Default.args = {
    history: [],
    language: "pixel",
    onRun: () => null,
};
