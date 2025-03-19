# Unit Testing with Vitest

Add unit test for the @semoss/client project here. Files can be in .spec or .test file formats.

## Running tests:

To run tests use the following (to run a specific file add the file name to the end):

```
pnpm run test
```

This will run the following script:

```
vitest --watch=false --passWithNoTests --changed
```

Unit testing will also run inside the pre-commit hook after linting.
