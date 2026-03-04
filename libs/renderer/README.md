# About

@semoss/renderer is a package that allows you to quickly embed drag and drop apps that are built within semoss into your own javascript/react applications

# Get Started

Have an idea on what you would like to build in a no code environment. Go to our Drag and Drop App Builder to build out your UI and Backend.

Once you have fully built out your app, within our no code envrionment.

We have given access to a cool development tool that allows you to copy the underlying JSON that is used to make your app function.

Press `ctrl + d` while in the edit mode of the workspace.

After doing this you should see a popup come up that allows you to copy that JSON.

This is where the fun comes in.

# Renderer as a package

We have developed a npm package that makes it easy to embed that very JSON into any react application.

In your React Component:

1. First create a new file to hold your constant that you copied from our developer tools above

`./constants.ts`

```
export const BLOCKS = {
    "queries": {},
    "blocks": {
        "page-1": {
            "slots": {
                "content": {
                    "children": [
                        "text--1967"
                    ],
                    "name": "content"
                }
            },
            "widget": "page",
            "data": {
                "route": "",
                "style": {
                    "padding": "24px",
                    "fontFamily": "roboto",
                    "flexDirection": "column",
                    "display": "flex",
                    "gap": "8px"
                }
            },
            "listeners": {
                "onPageLoad": [
                    {
                        "message": "RUN_QUERY",
                        "payload": {
                            "queryId": "test"
                        }
                    },
                    {
                        "message": "RUN_QUERY",
                        "payload": {
                            "queryId": "di"
                        }
                    }
                ]
            },
            "id": "page-1"
        },
        "text--1967": {
            "id": "text--1967",
            "widget": "text",
            "parent": {
                "id": "page-1",
                "slot": "content"
            },
            "data": {
                "style": {
                    "padding": "4px",
                    "whiteSpace": "pre-line",
                    "textOverflow": "ellipsis"
                },
                "text": "Add Blocks",
                "variant": "h1",
                "route": "text--1967"
            },
            "listeners": {},
            "slots": {}
        }
    },
    "variables": {},
    "executionOrder": [],
    "version": "1.0.0-alpha.4"
}

```

2. Import the necessary libraries and modules

```
import { Renderer, ActionMessages, SerializedState } from '@semoss/renderer';
import { Env, InsightProvider } from '@semoss/sdk/react';

import { BLOCKS } from './constants.ts
```

3. Within your react component, update your Environment using our published sdk. (May be optional for certain projects)

```
Env.update({
    MODULE: process.env.MODULE || '',
});
```

This allows you to hit the necessary endpoints that are used to run pixels within the renderer package

4. Invoke `<InsightProvider />` and `<Renderer />` within the JSX of your react component

```
<InsightProvider>
    <Renderer state={BLOCKS} />
</InsightProvider>
```

State prop represents the constant we have in `./constants.ts`. Reference step 1
