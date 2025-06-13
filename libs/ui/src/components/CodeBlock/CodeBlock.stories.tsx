import React from "react";

import { CodeBlock } from ".";

export default {
    title: "Components/CodeBlock",
    component: CodeBlock,
};

const BaseTemplate = (args) => {
    console.log(args, "args");
    return <CodeBlock {...args} />;
};

const WrappedTemplate = (args) => {
    return (
        <CodeBlock.Container>
            <CodeBlock {...args} />
        </CodeBlock.Container>
    );
};

export const Default = BaseTemplate.bind({});

Default.args = {
    code: `import java.util.Scanner;

public class HelloWorld {

    public static void main(String[] args) {

        // Creates a reader instance which takes
        // input from standard input - keyboard
        Scanner reader = new Scanner(System.in);
        System.out.print("Enter a number: ");

        // nextInt() reads the next integer from the keyboard
        int number = reader.nextInt();

        // println() prints the following line to the output screen
        System.out.println("You entered: " + number);
    }
}`,
    language: "sql",
    theme: "light",
};
export const Wrapped = WrappedTemplate.bind({});

Wrapped.args = {
    code: `
import React from 'react';

import { SwitchAccessShortcutOutlined } from '@mui/icons-material';
import { styled, CustomPaletteOptions } from '@semoss/ui';

const StyledContainer = styled('div')(({ theme }) => {
    return {
        // width: '50px', height: '50px',
        '.MuiIcon-fontSizeLarge': {
            width: '2em',
            height: '2em',
        },
    };
});

const StyledIcon = styled(SwitchAccessShortcutOutlined)(({ theme }) => {
    return {
        color: theme.palette.pink['300'],
    };
});

export const Function = () => {
    return (
        <StyledContainer>
            <StyledIcon fontSize="large" />
        </StyledContainer>
    );
};
    `,
    language: null,
};
