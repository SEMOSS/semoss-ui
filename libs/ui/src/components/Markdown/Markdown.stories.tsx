import React from "react";
import { Markdown } from ".";

export default {
    title: "Components/Markdown",
    component: Markdown,
};

const Template = (args) => {
    return <Markdown {...args} />;
};

export const Default = Template.bind({});

Default.args = {
    children:
        '# h1 Heading\n## h2 Heading\n### h3 Heading\n#### h4 Heading\n##### h5 Heading\n###### h6 Heading\n\n\n## Horizontal Rules\n\n___\n\n\n## Emphasis\n\n**This is bold text**\n\n__This is bold text__\n\n*This is italic text*\n\n_This is italic text_\n\n~~Strikethrough~~\n\n\n## Blockquotes\n\n> Blockquotes can also be nested...\n>> ...by using additional greater-than signs right next to each other...\n> > > ...or with spaces between arrows.\n\n\n## Lists\n\nUnordered\n\n+ Create a list by starting a line with `+`, `-`, or `*`\n+ Sub-lists are made by indenting 2 spaces:\n  - Marker character change forces new list start:\n    * Ac tristique libero volutpat at\n    + Facilisis in pretium nisl aliquet\n    - Nulla volutpat aliquam velit\n+ Very easy!\n\nOrdered\n\n1. Lorem ipsum dolor sit amet\n2. Consectetur adipiscing elit\n3. Integer molestie lorem at massa\n\n\n1. You can use sequential numbers...\n1. ...or keep all the numbers as `1.`\n\nStart numbering with offset:\n\n57. foo\n1. bar\n\n\n## Code\n\nInline `code`\n\nIndented code\n\n    // Some comments\n    line 1 of code\n    line 2 of code\n    line 3 of code\n\n\nBlock code "fences"\n\n```\nSample text here...\n```\n\nSyntax highlighting\n\n``` js\nvar foo = function (bar) {\n  return bar++;\n};\n\nconsole.log(foo(5));\n```\n\n## Tables\n\n| Column1 | Column2 |\n| ------ | ----------- |\n| Lorem   | ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. |\n| UT | enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. |\n| Duis    | aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. |\n\n\n## Links\n\n[link text](http://semoss.org)\n\n\n## Images\n\n![Semoss](https://semoss.org/src/resources/img/semoss_logo_dark.svg)',
    components: {},
};

export const Syntax = Template.bind({});

Syntax.args = {
    children: `# Markdown Code Example

This is a demonstration of how to render Markdown with \`inline code\` and code blocks.

## Inline Code

You can use \`const greeting = "Hello World!"\`F inline within your text.

## Block Code

\`\`\`js
// This is a code block
function sayHello() {
  const greeting = "Hello World!";
  console.log(greeting);
  return greeting;
}

// Call the function
sayHello();
\`\`\`

\`\`\`css
/* CSS code block example */
.markdown-content {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

code {
  background-color: #f1f1f1;
  padding: 0.2em 0.4em;
  border-radius: 3px;
}
\`\`\`

## React Component Example

\`\`\`jsx
import React from 'react';

function Button({ text, onClick }) {
  return (
    <button 
      className="px-4 py-2 bg-blue-500 text-white rounded"
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export default Button;
\`\`\`
`,
    components: {},
};

export const HTML = Template.bind({});

HTML.args = {
    children: `
<!-- Comment -->

<div>Hello</d>

World
`,
    components: {},
};
