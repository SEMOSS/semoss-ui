# @semoss\sdk

@semoss\sdk-react is a small react package that accelerates the process of building an deploying an app.

## Getting Started:

First, install the sdk using a package manager:

```sh
npm install @semoss/sdk-react
```

Second, install dependencies using a package manager:

```sh
npm install @semoss/sdk
```

Next, import the `InsightProvider`. This provider will wrap your components and provide an Insight to all of it's children. Insights are temporal workspaces that allow end users to script and interact with a model, storage engine, or database.

```jsx
import { InsightProvider } from '@semoss/sdk-react';

const App = (props) => {
    const { children } = props;

    return <InsightProvider>{children}</InsightProvider>;
};
```

Once the application is wrapped, You can access the insight through the `useInsight` hook;

```jsx
import { useInsight } from '@semoss/sdk-react';

const Child = (props) => {
    const { children } = props;

    const {
        /** Track if it is initialized **/
        isInitialized,
        /** Track if the user is authorized **/ isAuthorized,
        /** Any Insight Errors **/
        error,
        /** System information **/
        system,
        /** Actions to update **/
        actions,
    } = useInsight();

    return <InsightProvider>{children}</InsightProvider>;
};
```

Now you are ready to go. You can do things like

-   Query a LLM and return a result

```js
const { actions } = useInsight();

const ask = (question) => {
    const { pixelReturn } = await actions.run(
        `LLM(engine=["${ENGINE}"], command=["<encode>${question}</encode>"]);`,
    );

    // get the message
    const message = pixelReturn[0].output.response;
    console.log(message);
};
```

-   Run a database query

```js
const { actions } = useInsight();

const getMovies = () => {
    const { pixelReturn } = await actions.query(
        `Database(engine=["${ENGINE}"]) | Select(Movie__Title, Movie__Year) | Collect(-1)`,
    );

    // get the data
    const data = pixelReturn[0].output;

    console.log(data);
};
```

-   Login or Logout

```js
const { actions } = useInsight();

const login = (username, password) => {
    const success = await actions.login({
        type: 'native',
        username: username,
        password: password,
    });

    console.log(success);
};

const logout = (username, password) => {
    const success = await actions.logout();

    console.log(success);
};
```
