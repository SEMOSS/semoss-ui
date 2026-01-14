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
    saveShortcut?: string;
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
