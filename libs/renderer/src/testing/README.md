# Unit Testing with Vitest

Add unit tests for the @semoss/renderer project here. Files can be in .spec or .test file formats.

## Test Structure:

By design, blocks within the renderer application can only be used within the Notebook. The testing suite mimics this behavior within the testing utility folder. Here, a MockProvider mimics the StateStore and will export a custom render function to properly render each Block outside the notebook. Each test must be rendered using this method. 

Each test must also provide a `blocks` constant that will fit the block with the necessary data to render. See the example below from the Accordion Block test:

```
const blocks = {
    accordion: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
        },
        id: "accordion",
        widget: "accordion",
        slots: {
            header: {
                name: "header",
                children: [],
            },
            content: {
                name: "content",
                children: [],
            },
        },
        listeners: {
            onChange: [],
        },
    },
};
```

## Running tests:

To run all of the tests, use the following inside of renderer:
```
pnpm run test
```
This will run the following script:
```
vitest run
```

To run a specific test, add the file name in full or a single word to filter. For instance, running the following:
```
pnpm run test accordion
```
The above will search all test file names that include the name `accordion` and only run those tests. To ensure that only one specific test runs, the full file name must be provided like so:
```
pnpm run test AccordionBlock.spec.tsx
```

## `it` vs `test`

Both `it` and `test` function the same; both are aliases of each other. For readability purposes, use `it` when a test "should" do something
like so `it("Should do X")` or `it("Should not do X")`. This can be read as "It should do X" or "It should not do X" etc.
Otherwise, use `test` if it doesn't readily fit the `it` phrasing. An example for `test`, `test("if it does this thing")` or `test("if it does X")` which can be read as "Test if it does this thing" or "Test if it does X"
This isn't a rule that is enforced, but it should be something that helps us read the code better.