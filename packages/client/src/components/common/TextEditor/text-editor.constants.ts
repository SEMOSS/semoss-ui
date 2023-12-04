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
    mdiFolderOutline,
    mdiFolderOpenOutline,
} from '@mdi/js';

export const FILE_ICON_MAP: Record<string, string> = {
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
    directory: mdiFolderOutline,
    open: mdiFolderOpenOutline,
};
