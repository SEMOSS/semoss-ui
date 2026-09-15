# Getting Started

| Software    | Version |
| -------- | ------- |
| Node |  v24.4.0|
| pnpm | v10.13.x |

1. Git clone this repository to your `webapps` folder. `git clone git@repo.semoss.org:semoss/semoss-ui.git`

2. Run `pnpm install` in root directory.

3. Create a dev build by running `pnpm run build:dev` or launching the dev-server by running `pnpm run dev`. See `package.json` for additional commands.

# Contributions and Standardized Commits 

## Overview
This repository follows a standardized commit message convention to ensure consistency and clarity in our version control history. We employ CommitLint to enforce these conventions, promoting meaningful commit messages that convey the purpose and impact of each change.


## Commit Message Format

### Type

Must be one of the following:

* **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
* **chore**: Other changes that don't modify src or test files
* **ci**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* **docs**: Documentation only changes
* **feat**: A new feature
* **fix**: A bug fix
* **perf**: A code change that improves performance
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **revert**: Reverts a previous commit
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **test**: Adding missing tests or correcting existing tests

For example I have just created a new feature to the application where different users can now request access to different engines in the Catalog.  As this is new functionality to the users, the type of this commit would be a 'feat'.

### Scope
The scope is optional and free-form (it is not enforced by commitlint). When used, it should be the name of the package affected along with the overlying issue that was resolved with your commit.

Common scopes are the workspace package short names:

* Libraries: **sdk**, **ui**, **i18n**, **shared**, **renderer**
* Applications: **client**, **playground**, **terminal**, **auditlog**, **cli**

This list will expand as the repository continues to grow. Please share your thoughts and suggestions.

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

1. Review the pull request using inline commenting for specific issues.
2. If you are satisfied with the pull request (without any questions or after your questions have been answered), then explicitly state that the pull request is ready to be merged as a comment on the pull request.

### Responsibility

Reviewers don't hold final responsibility for code - the person who wrote the code does. Reviewing is a best effort endeavour. 

## Why

There are many reasons to do code reviews. Here are the reasons that are important for us to do code reviews:

* We have a diverse team of developers with a wide range of professional experience: code reviews are an avenue for knowledge sharing.
* We have a great number of projects and products, but most of us work in particular areas: code reviews provide visibility and insight into what else is happening with our technical product beyond what any one person directly works on.
* It can be easy to get stuck in patterns when writing code and focused on delivery: code reviews open the possibility for collaborative problem solving.
