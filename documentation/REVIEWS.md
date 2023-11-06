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
