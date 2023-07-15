/**
 * Configuration for the config
 */
export interface NodeConfig<G extends string = string> {
    /** Unique identifier for the node */
    guid: G;

    /** Parameters used in the input / output */
    parameters: Record<string, keyof NodeParameters>;
}

/**
 * All of the parameters
 */
export type NodeParameters = {
    frame: {
        type: 'frame';
        value: {
            name: string;
        };
    };
    string: {
        type: 'string';
        value: string;
    };
    number: {
        type: 'number';
        value: number;
    };
    custom: {
        type: 'custom';
        value: unknown;
    };
};

/**
 * Node data in the view
 */
export type NodeData<C extends NodeConfig = NodeConfig> = {
    /** Unique identifier for the node */
    guid: C['guid'];

    /** Display Information */
    display: NodeComponent<C>['display'];

    /** Paremeters used in the input / output / saved */
    parameters: {
        [P in keyof C['parameters']]: NodeParameters[C['parameters'][P]];
    };

    /** List of input data */
    input: (keyof C['parameters'])[];

    /** List of output data */
    output: (keyof C['parameters'])[];
};

/**
 * Widget Props
 */
interface NodeComponentProps<C extends NodeConfig = NodeConfig> {
    /** Paremeters used in the input / output / saved */
    parameters: {
        [P in keyof C['parameters']]: NodeParameters[C['parameters'][P]];
    };

    /** Display Information */
    display: NodeComponent<C>['display'];

    /**
     * Actions to interact with the pipeline
     */
    actions: {
        /**
         * Close the pipeline
         */
        close: () => void;

        /**
         * Run a pixel against the backend
         * @param pixel - pixel to run
         */
        query: (pixel: string) => Promise<unknown>;

        /**
         * run a pixel and return information if the pixel was successful
         * @param parameters - parameters to run
         */
        run: (
            parameters: Partial<NodeData<C>['parameters']>,
        ) => Promise<unknown>;

        /**
         * Save information into the node
         * @param options - options to save in the node
         */
        save: (
            options: Partial<{
                display: Partial<NodeData<C>['display']>;
                parameters: Partial<NodeData<C>['parameters']>;
            }>,
        ) => void;
    };
}

/**
 * Component used to render the node
 */
export type NodeComponent<C extends NodeConfig = NodeConfig> =
    React.FunctionComponent<NodeComponentProps<C>> & {
        /** Unique identifier for the node */
        guid: C['guid'];

        /** Configuration information */
        config: {
            /** Parameter values used in the input / output */
            parameters: {
                [P in keyof C['parameters']]: NodeParameters[C['parameters'][P]];
            };

            /** List of input data */
            input: (keyof C['parameters'])[];

            /** List of output data */
            output: (keyof C['parameters'])[];
        };

        /** Display information */
        display: {
            /** Name of the node */
            name: string;

            /** Description of the node */
            description: string;

            /** Description of the node */
            icon: string;
        };

        /**
         * Convert to a pixel
         * @param parameters - parameters save from the pipeline
         * @returns a pixel representation of the pipeline
         */
        toPixel: (parameters: {
            [P in keyof C['parameters']]: NodeParameters[C['parameters'][P]];
        }) => string;
    };

/**
 * List of all the Nodes in the pipeline
 */
export type NodeRegistry<C extends NodeConfig = NodeConfig> =
    C extends NodeConfig
        ? Record<NodeComponent<C>['guid'], NodeComponent<C>>
        : never;
