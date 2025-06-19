# SEMOSS

> A playground app built on SEMOSS. Test out and interact with a variety of models.

## Development:

Please install the following prerequisites:

1. Node (at least v18.16.0) - [https://nodejs.org](https://nodejs.org)
2. PNPM (v6.X.X) - [https://pnpm.io/]

Navigate to the `client` folder.

Create a ``.env.local` with the following credentials:

```sh
# ./client/.env.local

# Backend where your application is running
ENDPOINT=

# Backend Module name
MODULE=

# Access key to authenticate (do not commit this)
ACCESS_KEY=

# Secret key to authenticate
SECRET_KEY=

```

Next install the dependencies:

```sh
# ./client

pnpm install
```

Finally, run the development server:

```sh
# ./client

pnpm run dev
```

To make a build:

```sh
# ./client

pnpm run build

# outputs in ./portals
```
