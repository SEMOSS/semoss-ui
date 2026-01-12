export type MCPToolProperty = {
    title: string;
    description?: string;
    type: string;
    default?: unknown;
};

export type MCPTool = {
    name: string;
    title: string;
    description?: string;
    inputSchema: {
        properties: Record<string, MCPToolProperty>;
        required: string[];
        title: string;
        type: "object";
    };
    _type: string;
};

export type MCPJsonData = {
    _meta: Record<string, string>;
    tools: MCPTool[];
};

export interface EditorHeaderProps {
    functionCount: number;
    deletedCount?: number;
    searchQuery: string;
    debouncedSearch?: string;
    showExpandAll?: boolean;
    showSave?: boolean;
    showSearch?: boolean;
    expandAll?: boolean;
    hasChanges?: boolean;
    onExpandAll?: () => void;
    onSave?: () => void;
    onSearchChange: (value: string) => void;
    onSearchClear: () => void;
    handleAddEngineMCPTools?: () => void;
    saveShortcut?: string;
}

export interface MetaDataSectionProps {
    metadata: Record<string, string>;
    title?: string;
    columns?: number;
    className?: string;
}

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    className?: string;
}

export interface JsonTextareaProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    height?: string;
    validator?: (value: string) => { valid: boolean; error?: string };
    showValidation?: boolean;
    className?: string;
}

export interface FunctionCardProps {
    tool: MCPTool;
    actualIdx: number;
    isExpanded: boolean;
    isDeleted: boolean;
    onToggleExpand: (toolName: string) => void;
    onDelete: (idx: number) => void;
    onRestore: (idx: number) => void;
    onUpdateTool: (index: number, value: Partial<MCPTool>) => void;
    onUpdateToolProp: (
        toolIdx: number,
        propKey: string,
        changes: Partial<MCPToolProperty>,
    ) => void;
    onRequiredToggle: (
        toolIdx: number,
        propKey: string,
        isRequired: boolean,
    ) => void;
    onTypeChange: (toolIdx: number, propKey: string, newType: string) => void;
    onDefaultChange: (
        toolIdx: number,
        propKey: string,
        newDefault: string,
        propType: string,
    ) => void;
    onJsonTextChange: (
        toolIdx: number,
        propKey: string,
        newText: string,
    ) => void;
    getJsonTextValue: (
        toolIdx: number,
        propKey: string,
        defaultValue: unknown,
    ) => string;
    jsonErrors: Record<string, string>;
    showDelete?: boolean;
    showRestore?: boolean;
}
