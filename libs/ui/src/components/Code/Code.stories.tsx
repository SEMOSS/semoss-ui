import React from "react";
import { Code } from ".";

export default {
	title: "Components/Code",
	component: Code,
};

const BaseTemplate = (args) => {
	return <Code {...args} />;
};

const WrappedTemplate = (args) => {
	return (
		<Code.Container>
			<Code {...args} />
		</Code.Container>
	);
};

export const Default = BaseTemplate.bind({});

Default.args = {
	code: `// Using 'typeof' to infer types
const person = { name: "Alice", age: 30 };
type PersonType = typeof person;  // { name: string; age: number }
// 'satisfies' to ensure a type matches but allows more specific types
type Animal = { name: string };
const dog = { name: "Buddy", breed: "Golden Retriever" } satisfies Animal;
// Generics with 'extends' and default values
function identity<T extends number | string = string>(arg: T): T {
  return arg;
}
let str = identity();  // Default type is string
let num = identity(42);  // T inferred as number
// 'extends' with interface and class
interface HasLength {
  length: number;
}
// Using 'typeof' to infer types
const person = { name: "Alice", age: 30 };
type PersonType = typeof person;  // { name: string; age: number }
// 'satisfies' to ensure a type matches but allows more specific types
type Animal = { name: string };
const dog = { name: "Buddy", breed: "Golden Retriever" } satisfies Animal;
// Generics with 'extends' and default values
function identity<T extends number | string = string>(arg: T): T {
  return arg;
}
let str = identity();  // Default type is string
let num = identity(42);  // T inferred as number
// 'extends' with interface and class
interface HasLength {
  length: number;
}
`,
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
