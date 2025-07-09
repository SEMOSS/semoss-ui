import { styled, SxProps, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { createHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";

//TODO: Dynamic import
import minLight from "@shikijs/themes/min-light";
import gitHubDark from "@shikijs/themes/github-dark";

import shikiLangJSX from "@shikijs/langs/jsx";
import shikiLangTSX from "@shikijs/langs/tsx";
import shikiLangTypescript from "@shikijs/langs/typescript";
import shikiLangJavascript from "@shikijs/langs/javascript";
import shikiLangHTML from "@shikijs/langs/html";
import shikiLangCSS from "@shikijs/langs/css";
import shikiLangPython from "@shikijs/langs/python";
import shikiLangJSON from "@shikijs/langs/json";
import shikiLangJava from "@shikijs/langs/java";

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
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
    );
};
