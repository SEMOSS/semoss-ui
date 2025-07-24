# Semoss VSCode Plugin

This VSCode extension is used for creating zip and deploying the assets folder for Semoss applications.

## Features

This VSCode extension is used for creating zip and deploying the assets folder for Semoss applications.

You can right click on the portals, client or py folder in VSCode to zip, deploy or "zip and deploy" applications to your own instance of Semoss.

### Instance Management

The extension now supports multiple Semoss instances with aliases:
- **Authorize New Instance**: Add a new Semoss instance with a custom alias
- **Select Instance**: Switch between saved instances
- **Remove Instance**: Delete saved instances

## Process

### First Time Setup
- In the command prompt (CTRL/COMMAND + SHIFT + P), search for "Semoss: Authorize New Instance"
- Enter an alias for your instance (e.g., "Production", "Development", "Staging")
- Generate an access and a private key from the Semoss instance. You can do that from Settings -> My Profile -> Generate
- Enter the URL that you want to authorize. For e.g., if you want to authenticate "https://workshop.cfg.deloitte.com/cfg-ai-demo/SemossWeb/packages/client/dist/#/", then pass the URL parameter as https://workshop.cfg.deloitte.com/cfg-ai-demo. Remember not to have the last /
- Enter the access and private key that you generated as the next parameters

### Using Multiple Instances
- Use "Semoss: Select Instance" to switch between your saved instances
- The extension will remember your instances across VS Code sessions
- Use "Semoss: Remove Instance" to delete instances you no longer need

### Deployment
- You can right click on client, py or portal folder to zip, deploy or zip and deploy the asset
- The extension will use your currently selected instance for deployment

## Available Commands

- **Semoss: Authorize New Instance** - Add a new Semoss instance
- **Semoss: Select Instance** - Switch between saved instances  
- **Semoss: Remove Instance** - Delete a saved instance
- **Semoss: Zip and Deploy** - Zip project files and deploy to current instance
- **Semoss: Zip Only** - Only create a zip file of the project
- **Semoss: Deploy Only** - Deploy existing zip file to current instance

## Release Notes
### 1.1.0
- Added support for multiple instances with aliases
- Improved instance management with select and remove functionality
- Better error handling and user feedback
- Automatic migration from old single-instance storage

### 1.0.0

- Initial release of Semoss VSCode plugin
- Provide a way to zip folders
- Authenticate for a Semoss instance and deploy code

## Upcoming Updates

- Provide a way to publish it to multiple instances
- Have better error messages