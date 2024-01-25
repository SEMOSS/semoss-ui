import { useMemo, useEffect, useState, SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { File, ControlledFile, TextEditorCodeGeneration } from '../';
import { Clear, SaveOutlined } from '@mui/icons-material';
import { Icon as FiletypeIcon } from '@mdi/react';
import { FILE_ICON_MAP } from './text-editor.constants';
import {
    TextArea,
    TextField,
    IconButton,
    Typography,
    Container,
    Checkbox,
    styled,
    Button,
    Modal,
    Tabs,
} from '@semoss/ui';

import Editor from '@monaco-editor/react';

import prettier from 'prettier';
import parserBabel from 'prettier/parser-babel';
import parserHtml from 'prettier/parser-html';
// import parserTypescript from 'prettier/parser-typescript';
import parserCss from 'prettier/parser-postcss';

import { runPixel } from '@/api';
import { LoadingScreen } from '@/components/ui';

const LLMPreview = styled('div')(({ theme }) => ({
    // border: "1px solid blue",
    display: 'block',
}));

interface TextEditorPreviewProps {
    language: string;
    contents: string;
}

export const TextEditorPreview = (props: TextEditorPreviewProps) => {
    const {
        // setControlledFiles,
        // controlledFiles,
        // setActiveIndex,
        // setCounter,
        // activeIndex,
        // onClose,
        // counter,
        // onSave,
        // files,
        language,
        contents,
    } = props;

    // const [LLMStarterModalOpen, setLLMStarterModalOpen] = useState(false);
    // const [LLMLoading, setLLMLoading] = useState(false);
    // const [showLLMStarter, setShowLLMStarter] = useState(true);
    // const [LLMPromptInput, setLLMPromptInput] = useState('');

    const [editorHeight, setEditorHeight] = useState('400px');
    const [previewValue, setPreviewValue] = useState(contents);

    useEffect(() => {
        setPreviewValue(contents);
        const numberOfLines = (previewValue.match(/\n/g) || []).length + 1;
        const minHeight = `${Math.max(3, numberOfLines) * 18}px`;
        setEditorHeight(minHeight);
    });

    useEffect(() => {
        // Calculate the number of lines in the editor content
        setPreviewValue(contents);
        const numberOfLines = (previewValue.match(/\n/g) || []).length + 1;

        // Set the minimum height based on the number of lines
        const minHeight = `${Math.max(3, numberOfLines) * 18}px`; // Adjust the factor as needed

        setEditorHeight(minHeight);
    }, [previewValue]);

    const handlePreviewChange = (value, event) => {
        setPreviewValue(value);
    };

    // to add text decoration plus marks might need to install monaco editor, leaving this commented for now
    // import * as monaco from 'monaco-editor';

    // const GreenPlusEditor = ({ initialValue }) => {
    //     const [editorValue, setEditorValue] = useState(initialValue);

    //     useEffect(() => {
    //       // Add a green plus sign to the left of every line
    //       const decorations = editorValue.split('\n').map((line, index) => ({
    //         range: new monaco.Range(index + 1, 1, index + 1, 1),
    //         options: {
    //           isWholeLine: true,
    //           glyphMarginClassName: 'green-plus', // Define a CSS class for the glyph margin
    //         },
    //       }));

    //       // Apply the decorations
    //       monaco.editor.setModelMarkers(
    //         monaco.editor.getModels()[0],
    //         'green-plus-decorations',
    //         []
    //       );
    //       monaco.editor.deltaDecorations([], decorations);
    //     }, [editorValue]);

    return (
        <LLMPreview>
            <Editor
                width={'100%'}
                height={editorHeight}
                value={`${contents}`}
                language={`${language}`}
                onChange={handlePreviewChange}
                options={{
                    glyphMargin: true,
                    readOnly: true,
                }}
            ></Editor>
        </LLMPreview>
    );
};
