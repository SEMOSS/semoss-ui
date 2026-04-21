import { lazy, Suspense, useEffect, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Muted,
	Spinner,
} from "@semoss/ui/next";

const MonacoEditor = lazy(() =>
	import("@semoss/shared/monaco").then((module) => module.MonacoEditor),
);

export const RDFMapPage = () => {
	const [code, setCode] = useState<string>("");

	useEffect(() => {
		const fetchRDFMap = async () => {
			const response = await runPixel<[string]>(`AdminGetRDFMap()`);
			setCode(response.pixelReturn[0].output || "");
		};
		fetchRDFMap();
	}, []);

	return (
		<Card className="mt-6 min-h-[480px] gap-0 py-0">
			<CardHeader className="!pb-[1px] border-b bg-muted/60 pt-4">
				<CardTitle className="text-sm leading-none">
					RDF_Map.prop
				</CardTitle>
			</CardHeader>
			<CardContent className="px-0">
				<div className="flex h-[460px] w-full flex-col bg-card">
					<Suspense
						fallback={
							<div className="flex h-full w-full items-center justify-center gap-2">
								<Spinner className="text-muted-foreground" />
								<Muted>Loading...</Muted>
							</div>
						}
					>
						<MonacoEditor
							width="100%"
							height="100%"
							value={code}
							language="rdfmap" // custom language
							theme="rdfmapTheme" // custom theme
							options={{
								readOnly: true,
							}}
							onMount={(_editor, monaco) => {
								if (monaco) {
									const getCssVar = (
										name: string,
										fallback: string,
									) => {
										const value = getComputedStyle(
											document.documentElement,
										)
											.getPropertyValue(name)
											.trim();
										return value || fallback;
									};

									const toHex = (
										value: string,
										fallback: string,
									) => {
										if (value.startsWith("#")) {
											return value;
										}
										const match =
											/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/.exec(
												value,
											);
										if (!match) {
											return fallback;
										}
										const red = Number.parseInt(
											match[1] ?? "0",
											10,
										);
										const green = Number.parseInt(
											match[2] ?? "0",
											10,
										);
										const blue = Number.parseInt(
											match[3] ?? "0",
											10,
										);
										const alpha = Number.parseFloat(
											match[4] ?? "1",
										);
										const toHexPair = (num: number) =>
											Math.max(0, Math.min(255, num))
												.toString(16)
												.padStart(2, "0");
										const alphaHex = toHexPair(
											Math.round(
												Math.max(
													0,
													Math.min(1, alpha),
												) * 255,
											),
										);
										const hex = `#${toHexPair(red)}${toHexPair(green)}${toHexPair(blue)}`;
										return alpha < 1
											? `${hex}${alphaHex}`
											: hex;
									};

									const isDark =
										document.documentElement.classList.contains(
											"dark",
										);
									const foreground = toHex(
										getCssVar(
											"--foreground",
											"rgba(10, 10, 10, 1)",
										),
										"#0a0a0a",
									);
									const commentColor = "#6A9955";
									const keyColor = foreground;
									const valueColor = toHex(
										getCssVar(
											"--primary",
											"rgba(5, 112, 240, 1)",
										),
										"#0570f0",
									);
									const background = toHex(
										getCssVar(
											"--card",
											"rgba(255, 255, 255, 1)",
										),
										"#ffffff",
									);

									// Register a custom language if not already registered
									monaco.languages.register({ id: "rdfmap" });

									monaco.languages.setMonarchTokensProvider(
										"rdfmap",
										{
											tokenizer: {
												root: [
													// Comments (# or !)
													[/^\s*[#!].*$/, "comment"],

													// Key-value pairs with whitespace (space or tab)
													[
														/^(\s*)([^\s#!][^\s]*)([ \t]+)(.+)$/,
														[
															"",
															"key",
															"delimiter",
															"value",
														],
													],

													// Key without value
													[
														/^(\s*)([^\s#!][^\s]*)$/,
														["", "key"],
													],

													// Property continuation lines (indented)
													[/^\s+.+$/, "value"],
												],
											},
										},
									);

									// Define theme for custom tokens
									monaco.editor.defineTheme("rdfmapTheme", {
										base: isDark ? "vs-dark" : "vs",
										inherit: false,
										rules: [
											{
												token: "comment",
												foreground: commentColor,
											},
											{
												token: "key",
												foreground: keyColor,
											},
											{
												token: "delimiter",
												foreground: keyColor,
											},
											{
												token: "value",
												foreground: valueColor,
											},
										],
										colors: {
											"editor.background": background,
										},
									});
									monaco.editor.setTheme("rdfmapTheme");
								}
							}}
						/>
					</Suspense>
				</div>
			</CardContent>
		</Card>
	);
};
