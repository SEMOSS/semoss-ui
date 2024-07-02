# First-Time Semoss-UI Setup Instructions

1. Git clone this repository to your `webapps` folder. `git clone git@repo.semoss.org:semoss/semoss-ui.git`

2. Ensure your BE server is running in eclipse and at a minimum running on a version of pnpm@8.

3. create a `.env.local` file and populate with the following. **Do not change the .env**

```
    ENDPOINT=../../..
    MODULE=/Monolith_Dev

    THEME_TITLE=SEMOSS
    THEME_FAVICON=./src/assets/favicon.svg

    NODE_ENV=development
```

**If you are coming from another client project (within SEMOSS)**, MODULE may have to be adjusted for that client specific endpoint, consult with your client project lead for details on that endpoint.

4. Run `pnpm install` in root directory.

5. Build our component library, go to `packages/ui` and run `pnpm run build`.

6. Upon completion of the build on our component library, navigate back to our root directory and run `pnpm run dev:client`

Application will be accesible at: `http://localhost:9090/semoss-ui/packages/client/dist/#/`

## Common Errors
 1. `Cannot find module @semoss/ui` - This error indicates that our component library is not fully built out which is a required dependency in SemossUI.  To get around this do these steps rerun steps **4** and **5**.

 2. `404` on REST calls to the BE, usually points to an issue with the MODULE you have specified in your `.env.local` file.  Ask your client project lead what endpoint you hit to ensure you have the right pointer specified for MODULE.

 ### Must be on a version of Node 18
1. We use a node version manager to handle swapping between different versions.  https://github.com/coreybutler/nvm-windows, Most members are on version `18.16.0`

# Contributions and Standardized Commits 

## Overview
This repository follows a standardized commit message convention to ensure consistency and clarity in our version control history. We employ CommitLint to enforce these conventions, promoting meaningful commit messages that convey the purpose and impact of each change.


## Commit Message Format

### Type

Must be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests

For example I have just created a new feature to the application where different users can now request access to different engines in the Catalog.  As this is new functionality to the users, the type of this commit would be a 'feat'.

### Scope
The scope should be the name of the package affected along with the overlying issue that was resolved with your commit.

The following is the list of supported scopes:

* **(client):**
* **(legacy):**
* **(playsheet):**
* **(sdk):**
* **(ui):**
* **(environment):**

This list will be expanding as the repository continues to grow. Please share your thoughts and suggestions.

### Subject
The subject contains a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no dot (.) at the end

Continuing off the example provided with Type and Scope, as for the subject of our commit this reflects what has been done with the changes in the code. 'add RequestAccess reactor to the engine catalog at all three levels'.

With the three provided above our final commit message should look something like this.

'feat(client/Catalog): add RequestAccess reactor to the engine catalog at all three levels'

## Benefits
Enforcing a standardized commit message format offers several advantages:

- Clarity: Easily understand the nature and purpose of each commit.
- Collaboration: Facilitate collaboration by providing a common and predictable commit message structure.

By adhering to these commit message conventions and leveraging CommitLint, we aim to enhance the quality and coherence of our version control history. This approach streamlines collaboration and contributes to a more transparent and maintainable codebase.


# Coding Standards

This section serves as a comprehensive guide outlining the coding standards to be adhered to across our codebase. Consistent coding practices ensure readability, maintainability, and collaboration among developers. Please refer to this document when contributing to the project to ensure uniformity in our code and promote a high standard of quality.

## State Management

### Application Level State

In our application, we harness the power of MobX for seamless global state management. We've adopted a centralized store approach, where a single store acts as the conductor orchestrating all other stores. Each individual store encapsulates and manages state for specific functionalities.

By consolidating state logic into dedicated stores, we enhance code maintainability and clarity. The main store serves as the nexus, effortlessly consuming and coordinating the various state slices across our application. This streamlined architecture not only simplifies state management but also promotes consistency and coherence in our codebase.

To facilitate convenient access to our central store in the application, we've implemented a custom React hook called useRootStore. This hook is designed to simplify the process of interacting with the overarching store from any component.

When you employ useRootStore in your component, it seamlessly grants access to the central store and its associated methods. This abstraction shields components from the details of how the store is implemented, promoting a clean and intuitive API for state management.

Here's a brief guide on utilizing the useRootStore hook:

1. Import the Hook:
```
import { useRootStore } from '@/hooks';
```

2. Invoke the Hook:
```
const { configStore, monolithStore } = useRootStore();
```

### Feature Specific State

In our codebase, we leverage the power of React context for efficient state management within specific business features. By creating dedicated contexts, we encapsulate the state logic related to a particular domain, ensuring modularity and clarity in our code architecture.

To seamlessly access and manipulate the state within these contexts, we provide custom hooks. These hooks serve as a bridge, enabling components to interact with the underlying context state in a clean and intuitive manner.

By adopting this approach, we enhance the maintainability and scalability of our application, as each business feature maintains its own state in isolation. Developers can easily understand and extend the functionality of a feature without impacting the broader application state. This modular design fosters a more organized and collaborative development environment.

## Style

In our development practices, we prioritize the use of styled components over inline styles to craft visually appealing and maintainable user interfaces. Styled components offer a powerful and intuitive way to manage styles in React applications.

Rather than scattering styles throughout the JSX code, styled components allow us to encapsulate styles within dedicated components. This not only promotes a cleaner and more readable codebase but also ensures a clear separation of concerns between structure and presentation.

1. Styled component accesing our theme:
```
const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    height: '100%',
    gap: theme.spacing(3),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
}));
```

2. Styled component with props:

```
const StyledPageHeader = styled('div', {
    shouldForwardProp: (prop) => prop !== 'stuck',
})<{
    /** Track if the page header is stuck */
    stuck: boolean;
}>(({ theme, stuck }) => ({
    position: 'sticky',
    top: '-1px',
    paddingTop: theme.spacing(5),
    paddingBottom: theme.spacing(1),
    zIndex: 10,
    borderBottom: stuck ? `solid ${theme.palette.divider}` : 'none',
    backgroundColor: theme.palette.background.paper,
}));
```

## Design Style Guide

## Design Reference / Figma
### Where to find the design files
Figma - https://www.figma.com/files/962061179867410972/team/1025450952149421785

We are following 8px divisible spacing system on most of UI structure, with some case of using 4px.
When you see decimal or value not divisible of 8/4px, please flag the issue to designer!

## Spacing
### Pixel vs rem
In figma, Use dev, and change th unit to 'rem'
- 1rem = 16px
- 1.5rem = 24px
- 2 rem = 32px

### theme.spacing (Padding & Margin)
- theme.spacing(1) = equivalent of 8px
- theme.spacing(2) = equivalent of 16px
- theme.spacing(3) = equivalent of 24px
- theme.spacing(4) = equivalent of 32px
- theme.spacing(5) = equivalent of 40px

### Font?
- h1-6 & paragraph


Contributing Designer - Let us know if you have any question or issue with figma file.
- Natalie
- Sarah
- KT
- Eric
- Jong


# Code reviews

## Submitting code for review

Submitting code for review should follow these steps:

1. Always, always work from a feature or fix branch that is checked out of `dev`.
2. Each feature or fix branch should be focused on a discrete unit of work.
3. When your unit of work is complete, submit a pull request against the `dev` branch on `origin`. Ensure your commit message is communicative.
4. Wait for the CI server to run, validating your build passes on all target environments.
5. If CI is green, ask a colleague to review your pull request.
6. Address any questions from the code review. Sometimes this will involving refactoring, other times it will just mean answering questions.
7. Upon review and merge **If** your branch was a branch on the main repository (usually `origin`), then you must also remove your branch to reduce clutter. 

### Reviewing code in a pull request

Reviewing someone else's code should follow the following steps:

1. Review the pull request, using inline commenting for specific issues.
2. If you are satisfied with the pull request (without any questions, or after your questions have been answered), then explicitly state that the pull request is ready to be merged as a comment on the pull request.

### Responsibility

Reviewers don't hold final responsibility for code - the person who wrote the code does. Reviewing is a best effort endeavour. 

## Why

There are many reasons to do code reviews, here are the reasons that are important for us to do code reviews:

* We have a diverse team of developers with a wide range of professional experience: code reviews are an avenue for knowledge sharing.
* We have a great number of projects and products, but most of us work in particular areas: code reviews provide visibility and insight into what else is happening with our technical product beyond what any one person directly works on.
* It can be easy to get stuck in patterns when writing code and focused on delivery: code reviews open the possibility for collaborative problem solving.
