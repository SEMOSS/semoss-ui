import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import shikiLangBash from "@shikijs/langs/bash";
import shikiLangCSS from "@shikijs/langs/css";
import shikiLangCSV from "@shikijs/langs/csv";
import shikiLangHTML from "@shikijs/langs/html";
import shikiLangJava from "@shikijs/langs/java";
import shikiLangJavascript from "@shikijs/langs/javascript";
import shikiLangJSON from "@shikijs/langs/json";
import shikiLangJSX from "@shikijs/langs/jsx";
import shikiLangMarkdown from "@shikijs/langs/markdown";
import shikiLangPython from "@shikijs/langs/python";
import shikiLangSH from "@shikijs/langs/sh";
import shikiLangTSV from "@shikijs/langs/tsv";
import shikiLangTSX from "@shikijs/langs/tsx";
import shikiLangTypescript from "@shikijs/langs/typescript";
import shikiLangXML from "@shikijs/langs/xml";
import shikiLangYAML from "@shikijs/langs/yaml";
import shikiLangYML from "@shikijs/langs/yml";
import gitHubDark from "@shikijs/themes/github-dark";
import minLight from "@shikijs/themes/min-light";
import type * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "./theme-provider";

const minLightAccessibleComments = {
	...minLight,
	name: "min-light-accessible-comments",
	tokenColors: [
		...(minLight.tokenColors ?? []),
		{
			scope: ["comment", "punctuation.definition.comment"],
			settings: {
				// Darker comment color for better readability on light backgrounds.
				foreground: "#5f6368",
				fontStyle: "italic",
			},
		},
	],
};

// Create a singleton highlighter instance
let highlighterInstance: Awaited<
	ReturnType<typeof createHighlighterCore>
> | null = null;

const getHighlighter = async () => {
	if (highlighterInstance) {
		return highlighterInstance;
	}

	highlighterInstance = await createHighlighterCore({
		themes: [gitHubDark, minLightAccessibleComments],
		langs: [
			shikiLangTypescript,
			shikiLangJavascript,
			shikiLangHTML,
			shikiLangCSS,
			shikiLangPython,
			shikiLangJSON,
			shikiLangJava,
			shikiLangJSX,
			shikiLangTSX,
			shikiLangMarkdown,
			shikiLangXML,
			shikiLangYAML,
			shikiLangYML,
			shikiLangSH,
			shikiLangBash,
			shikiLangCSV,
			shikiLangTSV,
		],
		engine: createJavaScriptRegexEngine(),
	});

	return highlighterInstance;
};

function CodeContainer({
	className,
	...props
}: React.ComponentProps<"pre">): JSX.Element {
	return (
		<pre
			className={cn(
				"whitespace-pre-wrap rounded p-1 [&_code]:bg-transparent",
				className,
			)}
			{...props}
		/>
	);
}

interface CodeProps extends Omit<React.ComponentProps<"code">, "children"> {
	/** Code to render as code */
	code: string;

	/** Format of the code to render */
	language?:
		| "text"
		| "txt"
		| "jsx"
		| "tsx"
		| "javascript"
		| "js"
		| "typescript"
		| "ts"
		| "html"
		| "css"
		| "python"
		| "py"
		| "json"
		| "java"
		| "markdown"
		| "md"
		| "yaml"
		| "yml"
		| "xml"
		| "sh"
		| "bash"
		| "csv"
		| "tsv"
		| null;
}

function Code({ code, language, className, ...props }: CodeProps): JSX.Element {
	const { theme } = useTheme();
	// store the highlighted coe
	const [highlightedHtml, setHighlightedHTML] = useState<string>("");

	// when it is a mounted, try to highlight
	useEffect(() => {
		let isMounted = true;

		const highlight = async () => {
			if (!language) {
				return;
			}

			// get the highlighter
			const highlighter = await getHighlighter();

			// set the theme
			let activeTheme: "light" | "dark" = "dark";
			if (theme === "system") {
				// Detect system theme preference
				activeTheme = window.matchMedia("(prefers-color-scheme: dark)")
					.matches
					? "dark"
					: "light";
			} else {
				activeTheme = theme;
			}

			const html = highlighter.codeToHtml(code, {
				theme:
					activeTheme === "light"
						? "min-light-accessible-comments"
						: "github-dark",
				lang: language,
				structure: "inline",
			});

			if (isMounted) {
				setHighlightedHTML(html);
			}
		};

		highlight();

		return () => {
			isMounted = false;
		};
	}, [code, theme, language]);

	if (!highlightedHtml) {
		return (
			<code className={cn("w-full text-sm", className)} {...props}>
				{code}
			</code>
		);
	}

	return (
		<code
			className={cn("w-full text-sm", className)}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Intended
			dangerouslySetInnerHTML={{ __html: highlightedHtml }}
			{...props}
		/>
	);
}

export { CodeContainer, Code };
