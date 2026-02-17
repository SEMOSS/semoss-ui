# SEMOSS Template App

## Overview

This repository provides a starting point for SEMOSS React applications. It includes:

- A structure for connecting a React front-end with a Java back-end.
- Example custom Java reactors and TypeScript components that interact with them.

---

## Prerequisites

Before using this repository, ensure you have the following:

- **SEMOSS installed locally:**  
  [SEMOSS Installation Guide](https://amedeloitte.sharepoint.com/:p:/r/sites/SEMOSS/_layouts/15/Doc.aspx?sourcedoc=%7B4234D7E0-E161-4168-B889-29B4BBE07C67%7D&file=SEMOSS%20DEV%20Install_2024-07-24%20Working%20Version.pptx&action=edit&mobileredirect=true)  
  To verify installation, go to [http://localhost:9090/SemossWeb/packages/client/dist/#/](http://localhost:9090/SemossWeb/packages/client/dist/#/). The SEMOSS UI should load.

- **Basic Git knowledge:**  
  [Using SSH keys with GitHub](https://docs.github.com/en/authentication/connecting-to-github-with-ssh) is recommended for authentication.

- **Install Python as part of the SEMOSS installation**
  You'll need this for parts of the linting pipeline and just generally is a good thing to have. Refer to [Mac Install](https://workshop.cfg.deloitte.com/docs/Advanced%20Installation/Mac%20Developer%20Install#install-python) or [Windows Install](https://workshop.cfg.deloitte.com/docs/windows-developer-install#install-python)

---

## Creating a SEMOSS Pro-Code App

1. **Open the SEMOSS UI:**  
   Go to [http://localhost:9090/SemossWeb/packages/client/dist/#/](http://localhost:9090/SemossWeb/packages/client/dist/#/) (referred to as "the SEMOSS UI").

2. **Create a new app:**
    - Navigate to the "App" page (usually on the left sidebar).
    - Click "Create New App".
    - Choose to develop your app in code (not Drag & Drop).
    - Enter a name and description (e.g., `YourAppName`).
    - Submit to create the app. You'll be taken to the editor page.
    - Note the long string in the URL—this is your app's ID (`your-app-id`), e.g., `1337e31c-2131-4ef4-b942-94bdffa65c3f`.

---

## Understanding the App File Structure

- In the SEMOSS UI editor, you'll see a file explorer showing a `portals` folder.
- The explorer is displaying the contents of the `assets` folder; `portals` is inside `assets`.
- `assets` is the main folder for your app's code.

**On your computer:**

- Go to `workspace/Semoss/project/[YourAppName]_[your-app-id]/app_root/version/`
- Inside `version`, you'll find the `assets` folder, which contains `portals` and `portals/index.html`.
- The `assets` folder in your file system and the one in the SEMOSS UI are the same.

---

## Publishing Your App

To make changes visible to users:

1. In the SEMOSS UI, open and edit `portals/index.html`.
2. Click "Save".
3. Changes are not public until you click "Publish files".
4. After publishing, refresh the App tab to see updates.

> **Note:**  
> The published snapshot is stored at  
> `workspace/apache-tomcat-9.0.102/webapps/Monolith/public_home/your-app-id`.

---

## Creating a React App Using This Repository

### Clone the Template

1. In your file explorer, go to  
   `workspace/Semoss/project/[YourAppName]_[YourAppID]/app_root/version/`
2. Rename `assets` to `old-assets`.
3. Open a terminal in your `app_root/version` folder.
4. Clone this repository:
   `git clone git@github.com:SEMOSS/Template.git`, if using SSH keys
   `git clone https://github.com/SEMOSS/Template.git`, if not using SSH keys
5. Rename the cloned `Template` folder to `assets`.
6. Open `assets` in your code editor (VS Code recommended).

---

## SEMOSS App Structure

- The "Publish files" button in the SEMOSS UI creates a snapshot for users.
- The `portals` folder contains files available to users, including `portals/index.html` (the app's main entry point).
- Front-end source code typically lives in the `client` folder and is bundled into `portals` using Webpack (see `client/README.md` for details).
- Back-end Java reactors are in the `java` folder. When you click "Recompile reactors" in the SEMOSS UI, SEMOSS compiles these and places `.class` files in the `classes` folder (see `java/README.md` for more).

---

## Next Steps

- See `client/README.md` for front-end development instructions.
- See `java/README.md` for back-end/reactor development.
- See `test/README.md` for comprehensive testing guide and workflow.

---

## Support

For questions or issues, contact the SEMOSS team or refer to internal documentation.
