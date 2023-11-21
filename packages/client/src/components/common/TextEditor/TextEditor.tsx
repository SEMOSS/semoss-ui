import React, {
    useMemo,
    useEffect,
    useRef,
    useState,
    SyntheticEvent,
} from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { IconButton, Typography, Tabs, styled, keyframes } from '@semoss/ui';
import { File, ControlledFile } from '../';
import { Clear, SaveOutlined } from '@mui/icons-material';
import { Button } from '@semoss/ui';
import { Container } from '../../../../../ui/dist';

import { Icon as FiletypeIcon } from '@mdi/react';

// aded filetype icons
import {
    mdiFileImageOutline,
    mdiFilePdfBox,
    mdiFileWordOutline,
    mdiFileExcelOutline,
    mdiFilePowerpointOutline,
    mdiFileMusicOutline,
    mdiFileVideoOutline,
    mdiLanguageJavascript,
    mdiLanguageTypescript,
    mdiReact,
    mdiLanguageHtml5,
    mdiLanguageCss3,
    mdiSass,
    mdiCodeJson,
    mdiXml,
    mdiLanguageMarkdown,
    mdiLanguagePhp,
    mdiLanguagePython,
    mdiLanguageJava,
    mdiLanguageRuby,
    mdiLanguageSwift,
    mdiLanguageGo,
    mdiLanguageC,
    mdiLanguageCpp,
    mdiLanguageCsharp,
    mdiLanguageKotlin,
    mdiLanguageRust,
    mdiConsole,
    mdiPowershell,
    mdiFolderZipOutline,
    mdiFormatFont,
    mdiFileDelimitedOutline,
    mdiFileOutline,
    mdiFileCodeOutline,
    mdiFileDocumentOutline,
} from '@mdi/js';

const fileIcons: Record<string, string> = {
    // Image files
    jpg: mdiFileImageOutline,
    jpeg: mdiFileImageOutline,
    png: mdiFileImageOutline,
    gif: mdiFileImageOutline,
    bmp: mdiFileImageOutline,
    svg: mdiFileImageOutline,

    // Document files
    pdf: mdiFilePdfBox,
    doc: mdiFileWordOutline,
    docx: mdiFileWordOutline,
    xls: mdiFileExcelOutline,
    xlsx: mdiFileExcelOutline,
    ppt: mdiFilePowerpointOutline,
    pptx: mdiFilePowerpointOutline,
    odt: mdiFileWordOutline,

    // Audio files
    mp3: mdiFileMusicOutline,
    wav: mdiFileMusicOutline,
    ogg: mdiFileMusicOutline,
    flac: mdiFileMusicOutline,

    // Video files
    mp4: mdiFileVideoOutline,
    avi: mdiFileVideoOutline,
    mkv: mdiFileVideoOutline,
    mov: mdiFileVideoOutline,

    // Code files
    js: mdiLanguageJavascript,
    ts: mdiLanguageTypescript,
    tsx: mdiLanguageTypescript,
    jsx: mdiReact,
    html: mdiLanguageHtml5,
    css: mdiLanguageCss3,
    sass: mdiSass,
    json: mdiCodeJson,
    xml: mdiXml,
    md: mdiLanguageMarkdown,
    php: mdiLanguagePhp,
    py: mdiLanguagePython,
    java: mdiLanguageJava,
    rb: mdiLanguageRuby,
    swift: mdiLanguageSwift,
    go: mdiLanguageGo,
    c: mdiLanguageC,
    cpp: mdiLanguageCpp,
    cs: mdiLanguageCsharp,
    kotlin: mdiLanguageKotlin,
    rust: mdiLanguageRust,
    shell: mdiConsole,
    ps1: mdiPowershell,

    // Archive files
    zip: mdiFolderZipOutline,
    tar: mdiFolderZipOutline,
    gz: mdiFolderZipOutline,
    rar: mdiFolderZipOutline,

    // Executable files
    exe: mdiFileOutline,
    msi: mdiFileOutline,

    // Font files
    ttf: mdiFormatFont,
    otf: mdiFormatFont,

    // Spreadsheet files
    csv: mdiFileDelimitedOutline,

    // generic file icons
    file: mdiFileOutline,
    document: mdiFileDocumentOutline,
    code: mdiFileCodeOutline,
};

// Weird thing with Monaco Editor and does not get loaded in correctly from install
// loader.config({
//     paths: {
//         vs: '/monaco-editor/min/vs',
//     },
// });

const StyledFiletypeIcon = styled(FiletypeIcon)(({ theme }) => ({
    color: 'rgba(0, 0, 0, 0.6)',
    height: '24px',
    width: '24px',
    marginRight: '8px',
}));

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
}));

const StyledEmptyFiles = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    alignItems: 'normal',
    textAlign: 'left',
    padding: theme.spacing(5),
    justifyContent: 'space-around',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    color: '#0000008A',
    height: '50px',
    width: '50px',
    fontSize: 'inherit',
}));

const StyledFileTabs = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
}));

const StyledActiveFilePath = styled('div')(({ theme }) => ({
    display: 'flex',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
}));

const StyledTabsItem = styled(Tabs.Item, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if tab is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    backgroundColor: selected ? theme.palette.background.paper : 'inherit',
}));

const StyledTabLabelContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(0.5),
    alignItems: 'center',
}));

const StyledTabLabel = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    alignItems: 'center',
}));

const StyledSaveChangesIndicator = styled('div')(({ theme }) => ({
    color: theme.palette.primary.main,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    textAlign: 'left',
    display: 'block',
}));

interface TextEditorProps {
    /**
     * All Files
     */
    files: File[];
    /**
     * Index of Active File
     */
    activeIndex: number;
    /**
     * Sets the Active Index in parent component
     */
    setActiveIndex: (index: number) => void;
    /**
     * Saves the Asset
     */
    onSave: (asset: ControlledFile) => Promise<boolean>;
    /**
     * Closes indexed file tab in files
     */
    onClose?: (index) => void;
}

const formatFilePath = (activeFileid) => {
    if (activeFileid[activeFileid.length - 1] == '/') {
        activeFileid = activeFileid.slice(0, -1);
    }

    activeFileid = activeFileid.replace('version/assets/', '');
    activeFileid = activeFileid.replace('version/assets', '');

    if (activeFileid[0] == '/') {
        activeFileid = activeFileid.slice(1);
    }

    const splitId = activeFileid.split('/');

    let nonGrayPath = splitId.slice(0, splitId.length - 1).join('/');
    nonGrayPath = nonGrayPath.replace('/', ' / ');

    if (nonGrayPath.length > 0) {
        nonGrayPath = nonGrayPath + ' / ';
    }

    const grayFilename = splitId.slice(-1)[0];

    console.log({ activeFileid, nonGrayPath, grayFilename });

    return (
        <>
            <StyledFiletypeIcon
                path={
                    fileIcons[activeFileid?.split('.').slice(-1)[0]] ||
                    fileIcons.document
                }
                size={1}
            ></StyledFiletypeIcon>
            <Typography
                variant={'body2'}
                sx={{
                    marginLeft: '0px',
                    paddingLeft: '0px',
                }}
            >
                {nonGrayPath.length > 0 && (
                    <Typography
                        variant="body2"
                        sx={{
                            marginLeft: '0px',
                            paddingLeft: '0px',
                            marginRight: '5px',
                            display: 'inline-block',
                        }}
                    >
                        {nonGrayPath}
                    </Typography>
                )}

                <Typography
                    variant="body2"
                    sx={{
                        display: 'inline-block',
                        opacity: 0.6,
                        marginLeft: '0px',
                        paddingLeft: '0px',
                    }}
                >
                    {grayFilename}
                </Typography>
            </Typography>
        </>
    );
};

export const TextEditor = (props: TextEditorProps) => {
    const { files, activeIndex, setActiveIndex, onSave, onClose } = props;

    // Refresh Controlled Values
    const [controlledFiles, setControlledFiles] = useState<ControlledFile[]>(
        [],
    );
    const [counter, setCounter] = useState(0);

    /**
     * Listen for Keyboard Shortcuts, save and --> etc down the road
     */
    useEffect(() => {
        const handleKeyPress = async (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault(); // Prevent the default browser save dialog
                console.log('Ctrl + S pressed');
                saveFile();
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            // Cleanup: Remove the event listener when the component unmounts
            window.removeEventListener('keydown', handleKeyPress);
        };
    });

    /**
     * Adds new files to Controlled structure
     */
    useEffect(() => {
        console.log('files', files);
        console.log('contfiles', controlledFiles);
        if (controlledFiles.length === files.length) return;

        const newControlledFiles = controlledFiles;
        newControlledFiles.push({
            ...files[files.length - 1],
            content: files[files.length - 1].original,
        });

        setControlledFiles(newControlledFiles);
    }, [files.length, activeIndex, controlledFiles.length]);

    /**
     * Handles change with editor
     * @param newContent
     */
    const editFile = (newContent: string) => {
        // Update Controlled Value
        const edittedFile = {
            ...controlledFiles[activeIndex],
            content: newContent,
        };

        const newFiles = controlledFiles;
        newFiles[activeIndex] = edittedFile;

        setControlledFiles(newFiles);

        // Set New Counter to refresh active file based on new controlled files
        let newCounter = counter;
        setCounter((newCounter += 1));
    };

    /**
     * Saves Asset
     *
     */
    const saveFile = async () => {
        // 1. Save Asset with reactor
        // 2. Save the controlled files new original to content
        // 3. Trigger Memoized Val: Set New Counter to refresh active file based on new controlled files

        const saveSuccessful: boolean = await onSave(
            controlledFiles[activeIndex],
        );

        if (saveSuccessful) {
            const updatedControlledFiles = controlledFiles;
            updatedControlledFiles[activeIndex] = {
                ...updatedControlledFiles[activeIndex],
                original: updatedControlledFiles[activeIndex].content,
            };
            setControlledFiles(updatedControlledFiles);

            let newCounter = counter;
            setCounter((newCounter += 1));
        }
    };

    /** ------------------
     * Memoized Values
     *  ------------------
     */

    /**
     * @returns the Active File for display
     */
    const activeFile = useMemo<ControlledFile | null>(() => {
        const af = controlledFiles[activeIndex];
        if (af) return af;
        return null;
    }, [activeIndex, files.length, controlledFiles.length, counter]);

    /**
     * @returns language to interpet in editor based on the Active File
     */
    const fileLanguage = useMemo<string>(() => {
        let interpretedLanguage = '';
        if (files.length) {
            const selectedFileType = files[activeIndex].type;

            if (selectedFileType === 'ts' || selectedFileType === 'tsx') {
                interpretedLanguage = 'typescript';
            } else if (
                selectedFileType === 'js' ||
                selectedFileType === 'jsx'
            ) {
                interpretedLanguage = 'javascript';
            } else if (selectedFileType === 'html') {
                interpretedLanguage = 'html';
            } else if (selectedFileType === 'css') {
                interpretedLanguage = 'css';
            } else if (selectedFileType === 'python') {
                interpretedLanguage = 'python';
            } else if (selectedFileType === 'java') {
                interpretedLanguage = 'java';
            } else if (selectedFileType === 'mdx') {
                interpretedLanguage = 'mdx';
            } else {
                interpretedLanguage = 'markdown';
            }
        }
        return interpretedLanguage;
    }, [activeIndex, files.length, counter]);

    // const memoizedFiles = useMemo(() => {

    // })

    if (!files.length) {
        return (
            <StyledContainer>
                <StyledEmptyFiles>
                    <Container>
                        <StyledTypography variant="h5">
                            Welcome to the Code Editor
                        </StyledTypography>
                        <StyledTypography variant="body1">
                            Get started by selecting a file or
                        </StyledTypography>
                        <Button>Generate Code</Button>
                    </Container>
                    <Container>
                        <Typography variant="h6">
                            Github Documentation
                        </Typography>
                        <ul>
                            <li>Link</li>
                            <li>Link</li>
                            <li>Link</li>
                        </ul>
                    </Container>
                </StyledEmptyFiles>
            </StyledContainer>
        );
    } else {
        if (activeFile) {
            // const tabRefs = files.map(() => useRef());
            return (
                <StyledContainer>
                    <StyledFileTabs>
                        <Tabs
                            value={activeIndex}
                            variant="scrollable"
                            scrollButtons={false}
                            // indicatorColor={'transparent'}
                            onChange={(
                                event: SyntheticEvent,
                                newValue: number,
                            ) => {
                                // tabRefs[newValue].current.scrollIntoView({
                                //     behavior: 'smooth',
                                //     block: 'center',
                                // });

                                setActiveIndex(newValue);
                            }}
                        >
                            {controlledFiles.map((f, i) => {
                                return (
                                    <StyledTabsItem
                                        key={i}
                                        selected={activeIndex === i}
                                        label={
                                            <StyledTabLabelContainer>
                                                <StyledTabLabel>
                                                    <span>{f.name}</span>
                                                    <StyledSaveChangesIndicator>
                                                        {f.content !==
                                                        f.original ? (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                width="8"
                                                                height="8"
                                                                viewBox="0 0 8 8"
                                                                fill="none"
                                                            >
                                                                <circle
                                                                    cx="4"
                                                                    cy="4"
                                                                    r="4"
                                                                    fill="#0471F0"
                                                                />
                                                            </svg>
                                                        ) : (
                                                            <div>&nbsp;</div>
                                                        )}
                                                    </StyledSaveChangesIndicator>
                                                </StyledTabLabel>
                                                <IconButton
                                                    size={'small'}
                                                    sx={{
                                                        fontSize: '16px',
                                                    }}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        console.warn(
                                                            ' closing tab',
                                                            controlledFiles,
                                                        );

                                                        const newControlledFiles =
                                                            controlledFiles;
                                                        newControlledFiles.splice(
                                                            i,
                                                            1,
                                                        );

                                                        setControlledFiles(
                                                            newControlledFiles,
                                                        );

                                                        // close this index, set state of files in parent
                                                        await onClose(i);

                                                        // Refresh Active File Memoized value
                                                        setCounter(counter + 1);
                                                    }}
                                                >
                                                    <Clear
                                                        style={{
                                                            width: '16px',
                                                            height: '16px',
                                                        }}
                                                    />
                                                </IconButton>
                                            </StyledTabLabelContainer>
                                        }
                                    ></StyledTabsItem>
                                );
                            })}
                        </Tabs>
                        <StyledIconButton
                            size={'small'}
                            color={'secondary'}
                            title={'Save'}
                            onClick={() => {
                                saveFile();
                            }}
                        >
                            <SaveOutlined />
                        </StyledIconButton>
                    </StyledFileTabs>
                    <StyledActiveFilePath sx={{ alignItems: 'center' }}>
                        {formatFilePath(activeFile.id)}
                    </StyledActiveFilePath>
                    <Editor
                        // theme={'vs-dark'}
                        width={'100%'}
                        height={'100%'}
                        value={activeFile.content}
                        language={fileLanguage}
                        onChange={(newValue, e) => {
                            // Set new value of file in state, keep old contents
                            editFile(newValue);

                            // onSave for App Renderer??
                            // onChange(newValue);
                        }}
                    ></Editor>
                </StyledContainer>
            );
        } else {
            return <StyledContainer>No active file</StyledContainer>;
        }
    }
};
