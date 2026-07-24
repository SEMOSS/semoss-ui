import { runtimeOutputToJupyterOutputs } from "./utils";

const assert = (condition: unknown, message: string): void => {
	if (!condition) {
		throw new Error(message);
	}
};

const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const outputs = runtimeOutputToJupyterOutputs({
	_repr_png_: () => pngBytes,
});
const firstDisplay = outputs[0];
const displayData =
	firstDisplay?.output_type === "display_data" ? firstDisplay : null;

assert(displayData !== null, "expected display_data output");
assert(
	typeof displayData.data?.["image/png"] === "string",
	"expected image/png data to be serialized as a string",
);
assert(
	String(displayData.data?.["image/png"]).length > 0,
	"expected base64 image payload to be present",
);

const mimebundleOutputs = runtimeOutputToJupyterOutputs({
	_repr_mimebundle_: () => ({
		"image/png": pngBytes,
		"text/plain": "rendered image",
	}),
});
const mimeDisplay =
	mimebundleOutputs[0]?.output_type === "display_data"
		? mimebundleOutputs[0]
		: null;

assert(mimeDisplay !== null, "expected mimebundle display_data output");
assert(
	typeof mimeDisplay.data?.["image/png"] === "string",
	"expected mimebundle image/png data to be serialized",
);

const structuredBundleOutputs = runtimeOutputToJupyterOutputs({
	mimebundle: {
		"image/png": pngBytes,
		"text/plain": "rendered image",
	},
});
const structuredDisplay =
	structuredBundleOutputs[0]?.output_type === "display_data"
		? structuredBundleOutputs[0]
		: null;

assert(
	structuredDisplay !== null,
	"expected structured mimebundle display_data output",
);
assert(
	typeof structuredDisplay.data?.["image/png"] === "string",
	"expected structured mimebundle image/png data to be serialized",
);
