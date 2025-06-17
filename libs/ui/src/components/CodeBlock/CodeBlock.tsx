import { styled, SxProps, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import { getSingletonHighlighterCore } from "@shikijs/core";
import { createJavaScriptRegexEngine } from "@shikijs/engine-javascript";

//TODO: Dynamic import
import shikijsTheme from "@shikijs/themes/min-light";
import shijijsDarkTheme from "@shikijs/themes/github-dark";

import shikiLangJSX from "@shikijs/langs/jsx";
import shikiLangTSX from "@shikijs/langs/tsx";
import shikiLangTypescript from "@shikijs/langs/typescript";
import shikiLangJavascript from "@shikijs/langs/javascript";
import shikiLangHTML from "@shikijs/langs/html";
import shikiLangCSS from "@shikijs/langs/css";
import shikiLangPython from "@shikijs/langs/python";
import shikiLangJSON from "@shikijs/langs/json";
import shikiLangJava from "@shikijs/langs/java";
import { createHighlighterCore, LoadWasmOptionsPlain } from "@shikijs/core";
import gitHubDark from "@shikijs/themes/github-dark";
import minLight from "@shikijs/themes/min-light";
import javascript from "@shikijs/langs/javascript"; //{javascript, TypeScript, Python, Java, CSharp, Cpp, Go, Rust, HTML, CSS}
import typescript from "@shikijs/langs/typescript";
import python from "@shikijs/langs/python";
import java from "@shikijs/langs/java";
import csharp from "@shikijs/langs/csharp";
import cpp from "@shikijs/langs/cpp";
import go from "@shikijs/langs/go";
import html from "@shikijs/langs/html";
import css from "@shikijs/langs/css";
import json from "@shikijs/langs/json";
import c from "@shikijs/langs/c";
import CSharp from "@shikijs/langs/csharp";
import rust from "@shikijs/langs/rust";
import scss from "@shikijs/langs/scss";
import less from "@shikijs/langs/less";
import yaml from "@shikijs/langs/yaml";
import toml from "@shikijs/langs/toml";
import php from "@shikijs/langs/php";
import ruby from "@shikijs/langs/ruby";
import swift from "@shikijs/langs/swift";
import kotlin from "@shikijs/langs/kotlin";
import sql from "@shikijs/langs/sql";

import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export interface CodeBlockProps {
    /** Code to render as code */
    code: string;
    theme: string;

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
        | "c"
        | "c#"
        | "rust"
        | "scss"
        | "less"
        | "yaml"
        | "toml"
        | "php"
        | "ruby"
        | "swift"
        | "kotlin"
        | "sql"
        | null;

    /** custom style object */
    sx?: SxProps;
    copyButtonClicked?: (status: "success" | "error") => void;
}

async function main(codeToBeUpdated, theme, language, highlighter) {
    const code = await highlighter.codeToHtml(codeToBeUpdated, {
        theme: theme == "dark" ? "github-dark" : "min-light",
        lang: language,
    });
    return code;
}

const ShikiFileMainComponent = styled("div")(({ theme }) => ({
    "&.codeblock-container": {
        display: "flex",
        flexDirection: "row",
        justifyContent: "start",
        alignItems: "baseline",
        position: "relative",
        "> .code-wrapped-section": {
            display: "flex",
            flexDirection: "row",
            width: "100%",
        },
    },
    "&.codeblock-container pre": {
        display: "flex",
        position: "relative",
        overflowX: "auto",
        fontFamily: "monospace",
        flexDirection: "row",
        width: "inherit",
        code: {
            display: "flex",
            width: "100%",
            justifyContent: "flex-start",
            alignItems: "baseline",
            ".code-content-block": {
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start",
                justifyContent: "flex-start",
                gap: "8px",
                ".MuiTypography-root": {
                    display: "flex",
                    padding: "10px",
                    alignItems: "flex-start",
                    gap: "10px",
                    alignSelf: "stretch",
                    flexDirection: "column",
                },
            },
        },
    },
    "&.codeblock-container > .copy-code-section": {
        display: "flex",
        position: "absolute",
        justifyContent: "flex-end",
        alignContent: "center",
        flexWrap: "wrap",
        right: "1rem",
        top: "2rem",
        ".icon-button-copy": {
            border: "0.938px solid #E6E6E6",
            background: "transparent",
            borderRadius: "7.5px",
            padding: "3.75px",
        },
    },
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    ...theme.typography.body2,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
}));

export function CodeBlock({
    code,
    theme,
    language,
    sx,
    copyButtonClicked,
}: CodeBlockProps) {
    let codeToBeUpdated = `// Using 'typeof' to infer types
const person = { name: "Alice", age: 30 };
type PersonType = typeof person;  // { name: string; age: number }
// 'satisfies' to ensure a type matches but allows more specific types
type Animal = { name: string };
const dog = { name: "Buddy", breed: "Golden Retriever" } satisfies Animal;
// Generics with 'extends' and default values
function identity<T extends number | string = string>(arg: T): T {
  return arg;
}
let str = identity();  // Default type is string
let num = identity(42);  // T inferred as number
// 'extends' with interface and class
interface HasLength {
  length: number;
}
// Using 'typeof' to infer types
const person = { name: "Alice", age: 30 };
type PersonType = typeof person;  // { name: string; age: number }
// 'satisfies' to ensure a type matches but allows more specific types
type Animal = { name: string };
const dog = { name: "Buddy", breed: "Golden Retriever" } satisfies Animal;
// Generics with 'extends' and default values
function identity<T extends number | string = string>(arg: T): T {
  return arg;
}
let str = identity();  // Default type is string
let num = identity(42);  // T inferred as number
// 'extends' with interface and class
interface HasLength {
  length: number;
}
`;
    codeToBeUpdated = code ? code : codeToBeUpdated;
    const [contentToUpdate, setContentToUpdate] = useState("");
    const [clipboardStatus, setClipboardStatus] = useState<
        "success" | "error" | null
    >(null);
    const codeContainerRef = useRef<HTMLDivElement>(null);
    const highlighterRef = useRef(null);
    //create the highlighter object and update the code content, then dispose the highligter when component unmounts
    useEffect(() => {
        const createHighlighterObj = async () => {
            highlighterRef.current = await createHighlighterCore({
                themes: [gitHubDark, minLight],
                langs: [
                    javascript,
                    typescript,
                    python,
                    java,
                    csharp,
                    cpp,
                    go,
                    html,
                    css,
                    json,
                    csharp,
                    rust,
                    scss,
                    less,
                    yaml,
                    toml,
                    php,
                    ruby,
                    swift,
                    kotlin,
                    sql,
                ],
                engine: createJavaScriptRegexEngine(),
            });
            await main(
                codeToBeUpdated,
                theme,
                language,
                highlighterRef.current,
            ).then((resThenPromise) => {
                setContentToUpdate(resThenPromise);
            });
        };
        createHighlighterObj();
        return () => {
            highlighterRef.current.dispose();
        };
    }, [theme, language]);

    const handleClipBoardClick = async () => {
        try {
            await navigator.clipboard.writeText(codeToBeUpdated);
            setClipboardStatus("success");
            copyButtonClicked && copyButtonClicked("success");
        } catch (err) {
            setClipboardStatus("error");
            copyButtonClicked && copyButtonClicked("error");
        }
    };
    function processLineNumbers(string) {
        if (string.length > 0) {
            const parser = new DOMParser();
            const stringElement = parser.parseFromString(string, "text/html");

            const shikiSection =
                stringElement.getElementsByClassName("shiki")[0];
            const codeSection = shikiSection.getElementsByTagName("CODE");
            const codeChildrens = codeSection[0].children;
            const childrensUpdated = [];
            const lineNumber = [];
            const lineCode = [];
            for (let i = 0; i < codeChildrens.length; i++) {
                lineNumber[i] =
                    "<span class='line-number'>" + (i + 1) + "</span>";
                lineCode[i] = codeChildrens[i].innerHTML
                    ? "<span class='line-code'>" +
                      codeChildrens[i].innerHTML +
                      "</span>"
                    : "<span class='line-code'>&nbsp;</span>";
                childrensUpdated[i] =
                    '<span class="line"><span class="line-number">' +
                    (i + 1) +
                    "</span>" +
                    codeChildrens[i].innerHTML +
                    "</span>";
            }
            const lineNumberSection = (
                <StyledTypography variant="body2">
                    {lineNumber.map((item, i) => (
                        <span
                            key={i}
                            dangerouslySetInnerHTML={{ __html: item }}
                        ></span>
                    ))}
                </StyledTypography>
            );
            const lineCodeSection = (
                <StyledTypography variant="body2">
                    {lineCode.map((item, i) => (
                        <span
                            key={i}
                            dangerouslySetInnerHTML={{ __html: item }}
                        ></span>
                    ))}
                </StyledTypography>
            );
            const lineNumberSectionHtml = parser.parseFromString(
                ReactDOMServer.renderToStaticMarkup(lineNumberSection),
                "text/html",
            );
            const lineCodeSectionHtml = parser.parseFromString(
                ReactDOMServer.renderToStaticMarkup(lineCodeSection),
                "text/html",
            );
            shikiSection.getElementsByTagName(
                "CODE",
            )[0].innerHTML = `<span class="code-content-block">${
                lineNumberSectionHtml.body.firstElementChild.outerHTML +
                lineCodeSectionHtml.body.firstElementChild.outerHTML
            }</span>`;
            if (codeContainerRef.current) {
                codeContainerRef.current.innerHTML =
                    stringElement.getElementsByClassName("shiki")[0].outerHTML;
            }
        }
    }
    // Process line numbers after the content is updated
    useEffect(() => {
        processLineNumbers(contentToUpdate);
    }, [contentToUpdate]);

    const svgIcon =
        theme === "light" ? (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d="M16.5 1H4.5C3.4 1 2.5 1.9 2.5 3V17H4.5V3H16.5V1ZM19.5 5H8.5C7.4 5 6.5 5.9 6.5 7V21C6.5 22.1 7.4 23 8.5 23H19.5C20.6 23 21.5 22.1 21.5 21V7C21.5 5.9 20.6 5 19.5 5ZM19.5 21H8.5V7H19.5V21Z"
                    fill="black"
                    fillOpacity="0.54"
                />
            </svg>
        ) : (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
            >
                <path
                    d="M16.2188 1.6875H4.96875C3.9375 1.6875 3.09375 2.53125 3.09375 3.5625V16.6875H4.96875V3.5625H16.2188V1.6875ZM19.0312 5.4375H8.71875C7.6875 5.4375 6.84375 6.28125 6.84375 7.3125V20.4375C6.84375 21.4688 7.6875 22.3125 8.71875 22.3125H19.0312C20.0625 22.3125 20.9062 21.4688 20.9062 20.4375V7.3125C20.9062 6.28125 20.0625 5.4375 19.0312 5.4375ZM19.0312 20.4375H8.71875V7.3125H19.0312V20.4375Z"
                    fill="white"
                    fillOpacity="0.56"
                />
            </svg>
        );
    return (
        <>
            <ShikiFileMainComponent className="codeblock-container">
                <span ref={codeContainerRef} className="code-wrapped-section">
                    {" "}
                </span>
                <span className="copy-code-section">
                    <IconButton
                        onClick={handleClipBoardClick}
                        size="large"
                        className="icon-button-copy"
                        style={{
                            border:
                                theme === "light"
                                    ? "0.938px solid #E6E6E6"
                                    : "0.938px solid rgba(255, 255, 255, 0.12)",
                        }}
                    >
                        {svgIcon}
                    </IconButton>
                </span>
            </ShikiFileMainComponent>
        </>
    );
}
