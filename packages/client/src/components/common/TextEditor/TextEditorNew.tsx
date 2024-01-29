import React, { useRef, useEffect } from 'react';
import * as monaco from 'monaco-editor';
// import { TextEditor } from './TextEditor';

export const TextEditorNew = () => {
    const editorRef = useRef(null);

    useEffect(() => {
        if (!editorRef.current) return;

        const editor = monaco.editor.create(editorRef.current, {
            value: [
                '',
                'class Example {',
                '\tprivate m:number;',
                '',
                '\tpublic met(): string {',
                '\t\treturn "Hello world!";',
                '\t}',
                '}',
            ].join('\n'),
            language: 'typescript',
        });

        editorRef.current.editorInstance = editor;

        const actionDisposable = editor.addAction({
            id: 'my-unique-id',
            label: 'My Label!!!',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
                monaco.KeyMod.chord(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM,
                ),
            ],
            precondition: null,
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,

            run: (ed) => {
                const selection = ed.getSelection();
                const selectedText = ed.getModel().getValueInRange(selection);
                alert(`Selected text: ${selectedText}`);
            },
        });

        return () => {
            actionDisposable.dispose();
            editor.dispose();
        };
    }, []);

    return <div ref={editorRef} style={{ height: 400 }} />;
};

// import { useMemo, useEffect, useState, SyntheticEvent } from 'react';
// import { Link } from 'react-router-dom';
// import { File, ControlledFile, TextEditorCodeGeneration } from '../';
// import { Clear, Language, SaveOutlined } from '@mui/icons-material';
// import { Icon as FiletypeIcon } from '@mdi/react';
// import { FILE_ICON_MAP } from './text-editor.constants';
// import {
//     TextArea,
//     TextField,
//     IconButton,
//     Typography,
//     Container,
//     Checkbox,
//     styled,
//     Button,
//     Modal,
//     Tabs,
// } from '@semoss/ui';

// import Editor from '@monaco-editor/react';
// import * as monaco from 'monaco-editor';

// import { TextEditorPreview } from './TextEditorPreview';

// import prettier from 'prettier';
// import parserBabel from 'prettier/parser-babel';
// import parserHtml from 'prettier/parser-html';
// import parserCss from 'prettier/parser-postcss';

// import { runPixel } from '@/api';
// import { LoadingScreen } from '@/components/ui';

// export const TextEditorNew = (props) => {

//     const [LLMStarterModalOpen, setLLMStarterModalOpen] = useState(false);
//     const [LLMPreviewContents, setLLMPreviewContents] = useState('');
//     const [LLMLoading, setLLMLoading] = useState(false);
//     const [showLLMStarter, setShowLLMStarter] = useState(true);
//     const [renderStyledLLMWrapper, setRenderStyledLLMWrapper] = useState(true);
//     const [LLMPromptInput, setLLMPromptInput] = useState('');

//     useEffect(() => {

//         // const executeAction: monaco.editor.IActionDescriptor = {
//         //     id: "run-code",
//         //     label: "Run Code",
//         //     contextMenuOrder: 2,
//         //     contextMenuGroupId: "1_modification",
//         //     keybindings: [
//         //         // KeyMod.CtrlCmd | KeyCode.Enter,
//         //         monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
//         //         monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM
//         //     ],
//         //     // run: runTinker,
//         //     run: function (ed) {
//         //         alert("i'm running => " + ed.getPosition());
//         //     },
//         // }

//         // monaco.editor.addEditorAction(executeAction)

//         alert("new editor mounted!")
//         var editor = monaco.editor.create(document.getElementById("container"), {
//             value: [
//                 "",
//                 "class Example {",
//                 "\tprivate m:number;",
//                 "",
//                 "\tpublic met(): string {",
//                 '\t\treturn "Hello world!";',
//                 "\t}",
//                 "}",
//             ].join("\n"),
//             language: "typescript",
//         });

//         editor.addAction({
//             // An unique identifier of the contributed action.
//             id: "my-unique-id",

//             // A label of the action that will be presented to the user.
//             label: "Test Function",

//             // An optional array of keybindings for the action.
//             keybindings: [
//                 monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10,
//                 // chord
//                 monaco.KeyMod.chord(
//                     monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
//                     monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyM
//                 ),
//             ],

//             // A precondition for this action.
//             precondition: null,

//             // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
//             keybindingContext: null,

//             contextMenuGroupId: "navigation",

//             contextMenuOrder: 1.5,

//             // Method that will be executed when the action is triggered.
//             // @param editor The editor instance is passed in as a convenience
//             run: function (ed) {
//                 // alert("i'm running => " + ed.getPosition());
//                 console.log({ed})
//                 var selection = ed.getSelection();
//                 var selectedText = ed.getModel().getValueInRange(selection);
//                 alert(`Selected text: ${selectedText}`);
//             },
//         });

//       }, []);

//     // const createStarterCode = async () => {
//     //     const promptString += `Create starter code for a file titled ${activeFile.type} based on the following description. '${LLMPromptInput}'`;

//     //     // Notes from Neel
//     //     // focus on comment based prompting
//     //     // user highlights what they want the prompt to be in their code editor
//     //     // they second click to select 'use AI Code Generator' maybe 'prompt AI Code Generator with selected text'
//     //     // then pass prompt unedited with the filetype as a param ideally - need backend folks to address
//     //     // then paste code uncommented below comment and leave comment
//     //     // maybe highlight all pasted code or indicate where code stops at some point
//     //     // maybe mimic merge conflict interface with an 'accept incoming changes' link above highlighted new text

//     //     let pixel = `LLM(engine = "3def3347-30e1-4028-86a0-83a1e5ed619c", command = "${promptString}", paramValues = [ {} ] );`;
//     //     console.log('Prompting LLM', { activeFile, promptString, pixel });

//     //     try {
//     //         const res = await runPixel(pixel);
//     //         const LLMResponse = res.pixelReturn[0].output['response'];
//     //         let trimmedStarterCode = LLMResponse;
//     //         trimmedStarterCode = LLMResponse.replace(/^```|```$/g, ''); // trims off any triple quotes from backend

//     //         trimmedStarterCode = trimmedStarterCode.substring(
//     //             trimmedStarterCode.indexOf('\n') + 1,
//     //         );
//     //         setLLMLoading(false);
//     //         setLLMPreviewContents(trimmedStarterCode);
//     //     } catch {
//     //         setLLMLoading(false);
//     //         alert('LLM error');
//     //     }
//     // };

//     return (
//         <div id="container" style={{height: "100%", border: "1px solid red"}}>HELLOOOOO</div>
//     );
// };
