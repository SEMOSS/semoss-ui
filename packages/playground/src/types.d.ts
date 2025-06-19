export interface Engine {
    app_id: string;
    app_name: string;
    app_type: 'FUNCTION' | 'DATABASE' | 'KNOWLEDGE';
    description?: string;
}

export interface App {
    project_id: string;
    project_name: string;
    description?: string;
}

/**
 * Instructions from the backend
 */
export interface Instructions {
    /** ID of the instructions */
    id: string;

    /** Description */
    description: string;

    /** Context info */
    context: string;
}

export interface Knowledge {
    /** Id of the tool */
    id: string;

    /** Name of the tool */
    name: string;
}

export interface Tool {
    /** Type of the tool */
    type: 'APP' | 'FUNCTION' | 'DATABASE';

    /** Id of the tool */
    id: string;

    /** Name of the tool */
    name: string;
}

export type MessageResponse =
    | MessageContentResponse
    | MessageCodeResponse
    | MessageFunctionResponse
    | MessageAppResponse
    | MessageConclusionResponse;

export interface MessageContentResponse {
    type: 'CONTENT';
    content: string;
}

export interface MessageConclusionResponse {
    type: 'CONCLUSION';
}

export interface MessageCodeResponse {
    type: 'CODE';
    name: string;
    content: string;
}

export interface MessageFunctionResponse {
    id: string;
    type: 'FUNCTION';
    name: string;
    functionId: string;
    tool_name: string;
    tool_id: string;
    parameters: MessageParameters;
    content: string;
}

export interface MessageAppResponse {
    type: 'APP' | 'PROJECT';
    name: string;
    id: string;
    tool_name: string;
    tool_id: string;
    parameters: MessageParameters;
    // TODO: Maybe update content to MCP Response --> https://modelcontextprotocol.io/docs/concepts/architecture
    content: string;
}

export type MessageParameters = {
    name: string;
    type: 'String';
    value: unknown;
}[];

/**
 * Item from the prompt library
 */
export interface Prompt {
    ID: string;
    CREATED_BY: string;
    DATE_CREATED: string;
    VERSION: number;
    INTENT: string;
    TITLE: string;
    CONTEXT: string;
    tags: string[];
}

export type FileObj =
    | {
          name: string;
          lastModified: number;
          webkitRelativePath: string;
          size: number;
          type: string;
          slice: number;
          stream: number;
          text: number;
          //   arrayBuffer?: string;
      }
    | Record<string, never>;
