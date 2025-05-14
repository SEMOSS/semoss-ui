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

## Common Errors
1. If you are getting an authentication error when running a pixel similar to this 
 <!-- Unexpected token < in JSON at position 0
undefined:1
<!doctype html><html lang="en" ng-app="app"><head><meta content="width=device-width,initial-scale=1" name="viewport"/><meta http-equiv="X-UA-Compatible" content="IE=11"><meta charset="utf-8"><meta name="description" content=""><meta name="keywords" content=""><title></title><link href="packages/legacy/dist/core.9bb463e8e2f24351faaf.css?754050d3264eae070eac" rel="stylesheet"></head><body ng-cloak><root></root><script src="packages/legacy/dist/core.e435c555a854b513ef70.js?754050d3264eae070eac"></script><script src="./packages/legacy/app.constants.js"></script></body></html>
^

SyntaxError: Unexpected token < in JSON at position 0 -->

This needs to be between your trusted token filter and scheduler filter on your web.xml in the backend that you are referencing in the .env file 
<!-- User Access Key Filter -->
<filter>
<filter-name>UserAccessKeyFilter</filter-name>
<filter-class>prerna.web.conf.UserAccessKeyFilter</filter-class>
</filter>
<filter-mapping>
<filter-name>UserAccessKeyFilter</filter-name>
<url-pattern>/*</url-pattern>
</filter-mapping>
