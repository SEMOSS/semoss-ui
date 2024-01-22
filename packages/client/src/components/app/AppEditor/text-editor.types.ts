export interface File {
    id: string;
    name: string;
    original: string;
    type: string;
}

export interface ControlledFile extends File {
    /**
     * Keep track of edits on file
     */
    content: string;
}
