import React from "react";

import { CodeBlock } from ".";

export default {
    title: "Components/CodeBlock",
    component: CodeBlock,
};

const BaseTemplate = (args) => {
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
    code: ``,
    language: "javascript",
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
