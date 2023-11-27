# First-Time Semoss-UI Setup Instructions

1. Ensure your BE server is running in eclipse.

2. create a `.env.local` file and populate with the following, MODULE may have to be adjusted for your project specific endpoint.

```
    ENDPOINT=../../..
    MODULE=/Monolith_Dev

    THEME_TITLE=SEMOSS
    THEME_FAVICON=./src/assets/favicon.svg

    NODE_ENV=development
```

3. run `pnpm install` in root directory

4. run `pnpm run dev:ui-client`, this will take some time

- This script first builds out our component library (ui), once components are built the application will be accesible at: `http://localhost:9090/semoss-ui/packages/client/dist/#/`


# Common Errors
 `Cannot find module @semoss/ui` - This error indicates that our component library is not fully built out which is a required dependency in the Applications UI.  To get around this, you