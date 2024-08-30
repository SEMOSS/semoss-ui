import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

import { useBlock } from '@/hooks';
import { BlockComponent, BlockDef } from '@/stores';
import { Stack } from '@semoss/ui';
import * as Babel from '@babel/standalone';

// INSPIRATION
// https://github.com/abi/screenshot-to-code
// https://www.webcrumbs.org/frontend-ai

// WHERE I LEFT OFF
// Unable to add import statements in generated code block with string
// Things like useState and such are inaccessible
// APP TO USE:

// {
//   "queries": {
//       "default": {
//           "id": "default",
//           "cells": [
//               {
//                   "id": "61656",
//                   "widget": "code",
//                   "parameters": {
//                       "code": "LLM(engine=[\"{{code-gen-model}}\"], command=[\"Create me a react component that the UI looks exactly like google search engine.  Requirements: 1. Keep it at one file, no extra files in the import statements.  keep styles inline or use Material styled. 2. Make sure it is a functional component. 3. Get rid of all extra text i want this to be something i can simply copy and paste into my jsx file, im going to take what you give me and render a component programitically so its important to not give me any filler text outside of the code snippet\"])",
//                       "type": "pixel"
//                   }
//               }
//           ]
//       },
//       "Test": {
//           "id": "Test",
//           "cells": [
//               {
//                   "id": "47325",
//                   "widget": "code",
//                   "parameters": {
//                       "code": "LLM(engine=[\"{{gpt-40}}\"], command=[\"tell me a joke\"])",
//                       "type": "pixel"
//                   }
//               }
//           ]
//       }
//   },
//   "blocks": {
//       "welcome-container-block": {
//           "parent": {
//               "id": "page-1",
//               "slot": "content"
//           },
//           "slots": {
//               "children": {
//                   "children": [
//                       "welcome-text-block"
//                   ],
//                   "name": "children"
//               }
//           },
//           "widget": "container",
//           "data": {
//               "style": {
//                   "padding": "4px",
//                   "overflow": "hidden",
//                   "flexWrap": "wrap",
//                   "flexDirection": "column",
//                   "display": "flex",
//                   "gap": "8px"
//               }
//           },
//           "listeners": {},
//           "id": "welcome-container-block"
//       },
//       "page-1": {
//           "slots": {
//               "content": {
//                   "children": [
//                       "welcome-container-block",
//                       "button--2939"
//                   ],
//                   "name": "content"
//               }
//           },
//           "widget": "page",
//           "data": {
//               "style": {
//                   "padding": "24px",
//                   "fontFamily": "roboto",
//                   "flexDirection": "column",
//                   "display": "flex",
//                   "gap": "8px"
//               }
//           },
//           "listeners": {
//               "onPageLoad": []
//           },
//           "id": "page-1"
//       },
//       "welcome-text-block": {
//           "parent": {
//               "id": "welcome-container-block",
//               "slot": "children"
//           },
//           "slots": {},
//           "widget": "text",
//           "data": {
//               "style": {
//                   "padding": "4px",
//                   "whiteSpace": "pre-line",
//                   "overflow": "auto",
//                   "textOverflow": "ellipsis"
//               },
//               "text": "Welcome to the UI Builder! Drag and drop blocks to use in your app."
//           },
//           "listeners": {},
//           "id": "welcome-text-block"
//       },
//       "button--2939": {
//           "id": "button--2939",
//           "widget": "button",
//           "parent": {
//               "id": "page-1",
//               "slot": "content"
//           },
//           "data": {
//               "style": {},
//               "label": "Submit",
//               "loading": false,
//               "disabled": false,
//               "variant": "contained",
//               "color": "primary"
//           },
//           "listeners": {
//               "onClick": [
//                   {
//                       "message": "RUN_QUERY",
//                       "payload": {
//                           "queryId": "default"
//                       }
//                   },
//                   {
//                       "message": "RUN_QUERY",
//                       "payload": {
//                           "queryId": "Test"
//                       }
//                   }
//               ]
//           },
//           "slots": {}
//       }
//   },
//   "variables": {
//       "gpt-40": {
//           "to": "model--9319",
//           "type": "model"
//       },
//       "code-gen-model": {
//           "to": "model--9536",
//           "type": "model"
//       }
//   },
//   "dependencies": {
//       "model--9319": "4acbe913-df40-4ac0-b28a-daa5ad91b172",
//       "model--9536": "3def3347-30e1-4028-86a0-83a1e5ed619c"
//   },
//   "version": "1.0.0-alpha.2"
// }

export interface GeneratedBlockDef extends BlockDef<'generated'> {
    widget: 'generated';
    data: {
        code: string;
    };
}

// const codeString = `
//     import React from "react";
//     import { styled } from "@mui/material/styles";
//     import { InputBase } from "@mui/material";
//     import SearchIcon from "@mui/icons-material/Search";

//     const Search = styled("div")(({ theme }) => ({
//       position: "relative",
//       borderRadius: theme.shape.borderRadius,
//       backgroundColor: "#efefef",
//       "&:hover": {
//         backgroundColor: "#e0e0e0",
//       },
//       marginLeft: 0,
//       width: "100%",
//       [theme.breakpoints.up("sm")]: {
//         marginLeft: theme.spacing(1),
//         width: "auto",
//       },
//     }));

//     const SearchIconWrapper = styled("div")(({ theme }) => ({
//       padding: theme.spacing(0, 2),
//       height: "100%",
//       position: "absolute",
//       pointerEvents: "none",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//     }));

//     const StyledInputBase = styled(InputBase)(({ theme }) => ({
//       color: "inherit",
//       "& .MuiInputBase-input": {
//         padding: theme.spacing(1, 1, 1, 0),
//         paddingLeft: \`calc(1em + \${theme.spacing(4)})\`,
//         transition: theme.transitions.create("width"),
//         width: "100%",
//         [theme.breakpoints.up("sm")]: {
//           width: "12ch",
//           "&:focus": {
//             width: "20ch",
//           },
//         },
//       },
//     }));

//     function GoogleSearch() {
//       return (
//         <Search>
//           <SearchIconWrapper>
//             <SearchIcon />
//           </SearchIconWrapper>
//           <StyledInputBase
//             placeholder="Search…"
//             inputProps={{ "aria-label": "search" }}
//           />
//         </Search>
//       );
//     }
//   `;

// const extractImports = (codeString) => {
//     const importRegex = /import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
//     let match;
//     const imports = [];

//     while ((match = importRegex.exec(codeString)) !== null) {
//         const [_, importedEntities, fromPath] = match;
//         imports.push({ importedEntities, fromPath });
//     }

//     // Remove import statements from code string
//     const codeWithoutImports = codeString.replace(importRegex, '');

//     return { imports, codeWithoutImports };
// };

// const dynamicImportModules = async (imports) => {
//     const modules = {};

//     debugger
//     await Promise.all(
//         imports.map(async ({ importedEntities, fromPath }) => {
//             const module = await import(/* webpackIgnore: true */ fromPath);

//             // Handle different import formats (default, named)
//             importedEntities.split(',').forEach((entity) => {
//                 const entityName = entity.trim().split(' as ').pop(); // handle aliasing
//                 modules[entityName] = module[entityName] || module.default;
//             });
//         }),
//     );

//     return modules;
// };

// const DynamicComponent = ({ codeString }) => {
//     const [Component, setComponent] = React.useState(null);

//     React.useEffect(() => {
//         const processCode = async () => {
//             const { imports, codeWithoutImports } = extractImports(codeString);

//             // // Dynamically import modules
//             // const modules = await dynamicImportModules(imports);

//             debugger
//             // Create the component dynamically
//             const ComponentFunction = new Function(
//                 'React',
//                 // ...Object.keys(modules),
//                 `return ${codeWithoutImports}`,
//             );

//             const DynamicComponent = ComponentFunction(
//                 React,
//                 // ...Object.values(modules),
//             );

//             setComponent(() => DynamicComponent);
//         };

//         processCode();
//     }, [codeString]);

//     return Component ? <Component /> : <div>Loading component...</div>;
// };

const DynamicComponentRenderer = ({ componentString }) => {
    const [Component, setComponent] = useState(null);

    useEffect(() => {
        if (componentString) {
            const transpiledCode = Babel.transform(componentString, {
                presets: ['react'],
            }).code;

            // Convert the string to a functional component
            const ComponentFromString = new Function(
                'React',
                'useState',
                `return ${transpiledCode}`,
            )(React, useState);

            // Set the component to state
            setComponent(() => ComponentFromString);
        }
    }, [componentString]);

    return (
        <div>{Component ? <Component /> : <div>Loading component...</div>}</div>
    );
};

export const GeneratedBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData } = useBlock<GeneratedBlockDef>(id);

    const codeString = `
      () => (
       <div>
        <h1>Hello from dynamic component</h1>
       </div>
      )
    `;

    const codeStr = `
        function GoogleSearch() {
      return (
        <div>
          <div>
          Functional COmponent
          </div>

        </div>
      );
    }
    `;

    const cs = `
    
// Styles (conceptual)
const wrapperStyle = {
  padding: '20px',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  textAlign: 'center'
};

const headerStyle = {
  marginBottom: '20px'
};

const searchBoxStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  marginRight: '10px',
  transition: 'border-color 0.3s'
};

const buttonStyle = {
  padding: '10px 20px',
  borderRadius: '4px',
  border: 'none',
  backgroundColor: '#4285f4',
  color: '#fff',
  cursor: 'pointer',
  transition: 'background-color 0.3s'
};
    function GoogleSearch() {
  // State management for the search input
  const [searchTerm, setSearchTerm] = useState('');

  // Event handler for the search button
  const handleSearch = () => {
    console.log('Searching for:', searchTerm);
  };

  return (
    <div style={wrapperStyle}>
      <header style={headerStyle}>
        <h1>Google Search</h1>
      </header>
      <div style={searchBoxStyle}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleSearch} style={buttonStyle}>
          Search
        </button>
      </div>
    </div>
  );
}
    `;

    return (
        <Stack
            {...attrs}
            style={{ width: '100%', border: 'solid blue' }}
            direction={'column'}
        >
            <>Dynamic Code Example</>
            <DynamicComponentRenderer componentString={codeStr} />
        </Stack>
    );
});
