# @semoss\sdk

@semoss\sdk is a small utility package that accelerates the process of building an deploying an app.

## Getting Started:

First, install the sdk using a package manager:

```sh
npm install @semoss/sdk
```

Next, import the `Insight` from the SDK and create a new instance of it. Insights are temporal workspaces that allow end users to script and interact with a model, storage engine, or database.

```js
import { Insight } from '@semoss/sdk';

const insight = new Insight();
```

Once the application is mounted, initialize the insight and load your data app into the insight;

```js
await insight.initialize();
```

Now you are ready to go. You can do things like

-   Query a LLM and return a result

```js
const ask = (question) => {
    const { pixelReturn } = await insight.actions.run(
        `LLM(engine=["${ENGINE}"], command=["<encode>${question}</encode>"]);`,
    );

    // get the message
    const message = pixelReturn[0].output.response;
    console.log(message);
};
```

-   Run a database query

```js
const getMovies = () => {
    const { pixelReturn } = await insight.actions.query(
        `Database(engine=["${ENGINE}"]) | Select(Movie__Title, Movie__Year) | Collect(-1)`,
    );

    // get the data
    const data = pixelReturn[0].output;

    console.log(data);
};
```

-   Login or Logout

```js
const login = (username, password) => {
    const success = await insight.actions.login({
        type: 'native',
        username: username,
        password: password,
    });

    console.log(success);
};

const logout = (username, password) => {
    const success = await insight.actions.logout();

    console.log(success);
};
```