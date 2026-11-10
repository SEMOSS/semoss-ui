import { describe, expectTypeOf, it } from "vitest";
import {
	getPixelAsyncResult,
	type PixelAsyncResult,
	type PixelJobId,
	type PixelResult,
	runPixel,
	runPixelAsync,
} from "./base";
import {
	buildPixel,
	type Pixel,
	type PixelValue,
	readPixelOutput,
} from "./pixel";

describe("buildPixel and runPixel types", () => {
	it("brands the Pixel with its reactor", () => {
		expectTypeOf(
			buildPixel("StopPixelExecution", { id: "job" }),
		).toEqualTypeOf<Pixel<"StopPixelExecution">>();
		expectTypeOf(buildPixel("GetCurrentInsightId")).toEqualTypeOf<
			Pixel<"GetCurrentInsightId">
		>();
	});

	it("infers the output from the reactor, also through variables", () => {
		const pixel = buildPixel("StopPixelExecution", { id: "job" });
		const pixels = { stop: pixel };

		expectTypeOf(runPixel(pixel)).resolves.toEqualTypeOf<
			PixelResult<[string]>
		>();
		expectTypeOf(runPixel(pixels.stop)).resolves.toEqualTypeOf<
			PixelResult<[string]>
		>();
		expectTypeOf(
			runPixel(buildPixel("Echo", { value: 1 })),
		).resolves.toEqualTypeOf<PixelResult<[unknown]>>();
	});

	it("lets an explicit type argument win over the contract", () => {
		const pixel = buildPixel("StopPixelExecution", { id: "job" });

		expectTypeOf(runPixel<[number]>(pixel)).resolves.toEqualTypeOf<
			PixelResult<[number]>
		>();
	});

	it("keeps the legacy types for plain strings", () => {
		const text: string = "GetCurrentInsightId();";

		expectTypeOf(runPixel(text)).resolves.toEqualTypeOf<
			PixelResult<unknown[] | []>
		>();
		expectTypeOf(runPixel<[boolean]>(text)).resolves.toEqualTypeOf<
			PixelResult<[boolean]>
		>();
		// an instantiation expression still names the plain-string signature
		type Legacy<O extends unknown[] | []> = ReturnType<typeof runPixel<O>>;
		expectTypeOf<Legacy<[number]>>().toEqualTypeOf<
			Promise<PixelResult<[number]>>
		>();
		// a branded Pixel is still a string
		expectTypeOf(buildPixel("GetCurrentInsightId")).toExtend<string>();
	});

	it("reads typed outputs", () => {
		const result = {} as PixelResult<[string]>;

		expectTypeOf(readPixelOutput(result)).toEqualTypeOf<string[]>();
	});

	it("types async jobs from the Pixel that started them", async () => {
		const { jobId } = await runPixelAsync(
			buildPixel("StopPixelExecution", { id: "job" }),
		);
		expectTypeOf(jobId).toEqualTypeOf<PixelJobId<[string]>>();
		expectTypeOf(getPixelAsyncResult(jobId)).resolves.toEqualTypeOf<
			PixelAsyncResult<[string]>
		>();
		expectTypeOf(
			readPixelOutput(await getPixelAsyncResult(jobId)),
		).toEqualTypeOf<string[]>();

		// plain strings and explicit type arguments keep the legacy types
		const plain = await runPixelAsync("GetCurrentInsightId();");
		expectTypeOf(plain.jobId).toEqualTypeOf<string>();
		expectTypeOf(
			getPixelAsyncResult<[number]>(plain.jobId),
		).resolves.toEqualTypeOf<PixelAsyncResult<[number]>>();
	});

	it("checks the input against the contract", () => {
		// @ts-expect-error id is required
		buildPixel("StopPixelExecution", {});
		// @ts-expect-error the input is required when a field is required
		buildPixel("StopPixelExecution");
		// @ts-expect-error id is a string
		buildPixel("StopPixelExecution", { id: 1 });
		// @ts-expect-error the reactor has no such input
		buildPixel("StopPixelExecution", { id: "job", other: true });
		// @ts-expect-error there is no such reactor
		buildPixel("NoSuchReactor");
		// @ts-expect-error functions have no Pixel form
		buildPixel("Echo", { value: () => 1 });

		expectTypeOf<PixelValue>().toExtend<unknown>();
	});
});
