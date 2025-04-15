# Unit Testing with Vitest

Add unit test for the @semoss/renderer project here. Files can be in .spec or .test file formats.

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

## `it` vs `test`

Both `it` and `test` functions the same are both aliases of each other. For readability purpose, use `it` when a test "should" do something
like so `it("Should do X")` or `it("Should not do X")`. This can be read as "It should do X" or "It should not do X" etc.
Otherwise, use `test` if it doesn't readility fit the `it` phrasing. An example for `test`, `test("if it does this thing")` or `test("if it does X")` which can be read as "Test if it does this thing" or "Test if it does X"
This is isn't a rule that is enforced, but it should be something that should help us read the code better.