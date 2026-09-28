import { findStreamingCodeFence } from "./streaming-code";

describe("findStreamingCodeFence", () => {
	it("extracts a growing final fence", () => {
		expect(
			findStreamingCodeFence("Before\n\n```ts\nconst value = 1;"),
		).toEqual({
			before: "Before\n\n",
			code: "const value = 1;",
			language: "ts",
		});
	});

	it("leaves completed and earlier fences with markdown", () => {
		expect(
			findStreamingCodeFence("```js\nfirst()\n```\n\n```py\nsecond()"),
		).toEqual({
			before: "```js\nfirst()\n```\n\n",
			code: "second()",
			language: "py",
		});
		expect(findStreamingCodeFence("```js\nfirst()\n```")).toBeNull();
	});

	it("supports tilde fences and unknown languages", () => {
		expect(findStreamingCodeFence("~~~custom\nvalue")).toEqual({
			before: "",
			code: "value",
			language: "custom",
		});
	});
});
