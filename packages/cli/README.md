# @semoss\cli

@semoss\cli is a small cli that accelerates the process of deploying an app.

## Getting Started:

Install the cli and you are ready to go:

```sh
npm -g install @semoss/cli
```

## Using the cli:

First define a few environment variables:

```.env
MODULE      = ***URL HERE*** # Path to the application server
ACCESS_KEY  = ***KEY HERE*** # Access ID to the application server
SECRET_KEY  = ***KEY HERE*** # Secret Key to the application server
```

Next, initialize the app:

```sh
@semoss/cli init -n="name"
```

Make any changes and deploy by running:

```sh
@semoss/cli deploy
```
