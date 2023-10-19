# First-Time Semoss-UI Setup Instructions

1. create a `.env.local` file and populate with the following, paths may have to be adjusted for your file system, check directory locations

```
    ENDPOINT=../../..
    MODULE=/vha-supply

    THEME_TITLE=SEMOSS
    THEME_FAVICON=./src/assets/favicon.svg

    NODE_ENV=development
```

** Note: in this example the filepath for semoss-ui os `C:\workspace\apache-tomcat-9.0.73\webapps\semoss-ui` and the filepath for vha-supply is `C:\workspace\vha-supply`

2. run `pnpm install` in root directory

3. run `pnpm run dev`, this may take a while, wait until it is finished / compiled, check `package.json` for other pnpm startup scripts

4. make sure your `vha-supply` server is running in eclipse and that you are connected to your VPN

5. open `http://localhost:9090/semoss-ui/packages/client/dist/#/` in your browser and log into Semoss, you should see the application's UI

6. if errors occur when committing changes restructure your commit message, example commit message structure is below

```
git commit -m 'feat: add user comment to request access reactor and modal with a text area input'
```