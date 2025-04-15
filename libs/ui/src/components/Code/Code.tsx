import { styled } from "@mui/material";
import { useEffect, useState } from "react";
import { getSingletonHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";

const StyledPre = styled("pre")(({ theme }) => ({
    whiteSpace: "pre-wrap",
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    background: theme.palette.background.default,

    "& > code": {
        background: "transparent",
    },
}));

const StyledCode = styled("code")(({ theme }) => ({
    ...theme.typography.body2,
    background: theme.palette.background.default,
}));

export interface CodeProps {
    /** Code to render as code */
    code: string;

    /** Content to render as code */
    inline?: boolean;

    /** Content to render as code */
    language?:
        | "javascript"
        | "typescript"
        | "html"
        | "css"
        | "python"
        | "json"
        | "txt";
}

export const Code: React.FC<CodeProps> = ({
    code = "",
    inline = false,
    language = "",
}) => {
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
            const highlighter = await getSingletonHighlighterCore({
                themes: [import("@shikijs/themes/material-theme-lighter")],
                langs: [
                    import("@shikijs/langs/typescript"),
                    import("@shikijs/langs/typescript"),
                    import("@shikijs/langs/javascript"),
                    import("@shikijs/langs/javascript"),
                    import("@shikijs/langs/html"),
                    import("@shikijs/langs/css"),
                    import("@shikijs/langs/python"),
                    import("@shikijs/langs/python"),
                    import("@shikijs/langs/json"),
                ],
                engine: createJavaScriptRegexEngine(),
            });

            const html = highlighter.codeToHtml(code, {
                theme: "material-theme-lighter",
                lang: language,
            });

            if (isMounted) {
                setHighlightedHTML(html);
            }
        };

        highlight();

        return () => {
            isMounted = false;
        };
    }, [code, language]);

    console.log(highlightedHtml, code);
    if (!highlightedHtml) {
        if (inline) {
            return <StyledCode>{code}</StyledCode>;
        }

        return (
            <StyledPre>
                <StyledCode>{code}</StyledCode>
            </StyledPre>
        );
    }

    if (inline) {
        return (
            <StyledCode dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        );
    }

    return (
        <StyledPre>
            <StyledCode dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
        </StyledPre>
    );
};
