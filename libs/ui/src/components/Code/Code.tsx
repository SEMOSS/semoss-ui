import { type SxProps, styled, useTheme } from "@mui/material";
import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";
import shikiLangCSS from "@shikijs/langs/css";
import shikiLangHTML from "@shikijs/langs/html";
import shikiLangJava from "@shikijs/langs/java";
import shikiLangJavascript from "@shikijs/langs/javascript";
import shikiLangJSON from "@shikijs/langs/json";
import shikiLangJSX from "@shikijs/langs/jsx";
import shikiLangPython from "@shikijs/langs/python";
import shikiLangTSX from "@shikijs/langs/tsx";
import shikiLangTypescript from "@shikijs/langs/typescript";
import gitHubDark from "@shikijs/themes/github-dark";
//TODO: Dynamic import
import minLight from "@shikijs/themes/min-light";
import { useEffect, useRef, useState } from "react";

const StyledCode = styled("code")(({ theme }) => ({
	...theme.typography.body2,
	background: theme.palette.background.default,
	width: "100%",
}));

export interface CodeProps {
	/** Code to render as code */
	code: string;

	/** Content to render as code */
	language?:
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
		| "txt"
		| null;

	/** custom style object */
	sx?: SxProps;
}

export const Code: React.FC<CodeProps> = ({
	code = "",
	language = null,
	sx,
}) => {
	const { palette } = useTheme();
	// store the highlighted coe
	const [highlightedHtml, setHighlightedHTML] = useState<string>("");
	const highlighterRef = useRef(null);

	// when it is a mounted, try to highlight
	useEffect(() => {
		let isMounted = true;

		const highlight = async () => {
			if (!language) {
				return;
			}

			// get the highlighter
			highlighterRef.current = await createHighlighterCore({
				themes: [gitHubDark, minLight],
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
				],
				engine: createJavaScriptRegexEngine(),
			});

			const html = await highlighterRef.current.codeToHtml(code, {
				theme: palette.mode === "light" ? "min-light" : "github-dark",
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
	}, [code, palette.mode, language]);

	if (!highlightedHtml) {
		return <StyledCode sx={sx}>{code}</StyledCode>;
	}

	return (
		<StyledCode
			sx={sx}
			// biome-ignore lint/security/noDangerouslySetInnerHtml: Intended
			dangerouslySetInnerHTML={{ __html: highlightedHtml }}
		/>
	);
};
