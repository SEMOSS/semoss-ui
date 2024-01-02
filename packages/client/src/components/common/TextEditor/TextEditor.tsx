import { useMemo, useEffect, SyntheticEvent } from 'react';
import { Link } from 'react-router-dom';
import { File, ControlledFile } from '../';
import { Clear, SaveOutlined } from '@mui/icons-material';
import { Icon as FiletypeIcon } from '@mdi/react';
import { FILE_ICON_MAP } from './text-editor.constants';
import { AutoAwesome } from '@mui/icons-material/';
import {
    Button,
    IconButton,
    Typography,
    Tabs,
    styled,
    Container,
} from '@semoss/ui';

import Editor from '@monaco-editor/react';
import prettier from 'prettier';
import parserBabel from 'prettier/parser-babel'; // Choose the appropriate parser

// Weird thing with Monaco Editor and does not get loaded in correctly from install
// loader.config({
//     paths: {
//         vs: '/monaco-editor/min/vs',
//     },
// });

const StyledHeaderContainer = styled(Container)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
}));

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
    alignItems: 'center',
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

const StyledGenerateButton = styled(Button)(({ theme }) => {
    const palette = theme.palette as unknown as {
        purple: Record<string, string>;
    };

    return {
        backgroundColor: palette.purple['400'],
        color: theme.palette.background.paper,
        width: '180px',
        gap: theme.spacing(1),
        '&:hover': {
            backgroundColor: palette.purple['200'],
        },
    };
});

const StyledTypography = styled(Typography)(({ theme }) => ({
    textAlign: 'left',
    display: 'block',
}));

const StyledClear = styled(Clear)(({ theme }) => ({
    width: theme.spacing(2),
    height: theme.spacing(2),
}));

const StyledCloseTab = styled(IconButton)(({ theme }) => ({
    fontSize: '16px',
}));

const StyledActiveFilePathContainer = styled('div')(({ theme }) => ({
    marginLeft: '0px',
    paddingLeft: '0px',
}));

const StyledNonGrayPath = styled(Typography)(({ theme }) => ({
    marginLeft: '0px',
    paddingLeft: '0px',
    marginRight: '5px',
    display: 'inline-block',
}));

const StyledGrayFileName = styled(Typography)(({ theme }) => ({
    display: 'inline-block',
    opacity: 0.6,
    marginLeft: '0px',
    paddingLeft: '0px',
}));

interface TextEditorProps {
    /**
     * Params factored out to AppEditor parent component to make closing tabs possible on file deletion
     */
    controlledFiles: ControlledFile[];
    setControlledFiles: (controlledFiles: ControlledFile[]) => void;
    counter: number;
    setCounter: (index: number) => void;

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
    nonGrayPath = nonGrayPath.replaceAll('/', ' / ');

    if (nonGrayPath.length > 0) {
        nonGrayPath = nonGrayPath + ' / ';
    }

    const grayFilename = splitId.slice(-1)[0];

    console.log({ activeFileid, nonGrayPath, grayFilename });

    return (
        <>
            <StyledFiletypeIcon
                path={
                    FILE_ICON_MAP[activeFileid?.split('.').slice(-1)[0]] ||
                    FILE_ICON_MAP.document
                }
                size={1}
            ></StyledFiletypeIcon>
            <StyledActiveFilePathContainer>
                {nonGrayPath.length > 0 && (
                    <StyledNonGrayPath variant="body2">
                        {nonGrayPath}
                    </StyledNonGrayPath>
                )}

                <StyledGrayFileName variant="body2">
                    {grayFilename}
                </StyledGrayFileName>
            </StyledActiveFilePathContainer>
        </>
    );
};

export const TextEditor = (props: TextEditorProps) => {
    const {
        files,
        activeIndex,
        setActiveIndex,
        onSave,
        onClose,
        controlledFiles,
        setControlledFiles,
        counter,
        setCounter,
    } = props;

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
     * Get other parsers
     */
    const prettifyFile = () => {
        if (process.env.NODE_ENV == 'development') {
            // const formatted = prettier.format(activeFile.content, {
            //     parser: 'babel', // Use 'babel' for JSX
            //     plugins: [parserBabel], // Use the appropriate parser plugin
            //     semi: false, // Example option: Remove semicolons
            //     singleQuote: true, // Example option: Use single quotes
            // });
            // editFile(formatted);
        }
    };

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
        // 1. Format File
        // 2. Save Asset with reactor
        // 3. Save the controlled files new original to content
        // 4. Trigger Memoized Val: Set New Counter to refresh active file based on new controlled files

        await prettifyFile();

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
                    <StyledHeaderContainer>
                        <div>
                            <StyledTypography variant="h5">
                                Welcome to the Code Editor
                            </StyledTypography>
                            <StyledTypography variant="body1">
                                Get started by selecting a file or
                            </StyledTypography>
                        </div>
                        <StyledGenerateButton
                            variant="contained"
                            color="secondary"
                        >
                            <AutoAwesome />
                            Generate Code
                        </StyledGenerateButton>
                    </StyledHeaderContainer>
                    <Container>
                        <Typography variant="h6">
                            Github Documentation
                        </Typography>
                        <ul>
                            <li>
                                <Link to={'#'}>Code Editor</Link>
                            </li>
                            {/* <li>
                                <Link to={'#'}></Link>
                            </li>
                            <li>
                                <Link to={'#'}>j</Link>
                            </li> */}
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
                            onChange={(
                                event: SyntheticEvent,
                                newValue: number,
                            ) => {
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
                                                <StyledCloseTab
                                                    size={'small'}
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
                                                    <StyledClear />
                                                </StyledCloseTab>
                                            </StyledTabLabelContainer>
                                        }
                                    ></StyledTabsItem>
                                );
                            })}
                        </Tabs>
                        {/* <StyledIconButton
                            size={'small'}
                            color={'secondary'}
                            title={'Prettify'}
                            onClick={() => {
                                prettifyFile();
                            }}
                        >
                            <FormatAlignJustify />
                        </StyledIconButton> */}
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
                    <StyledActiveFilePath>
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
