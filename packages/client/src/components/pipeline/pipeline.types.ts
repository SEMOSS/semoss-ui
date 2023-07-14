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
};

/**
 * Node data in the view
 */
export type NodeData<C extends NodeConfig = NodeConfig> = {
    /** Unique identifier for the node */
    guid: C['guid'];

    /** Unique identifier for the node */
    name: string;

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

    /**
     * Save the parameters
     * @param parameters - updated parameters
     */
    saveParameters: (
        parameters: Partial<{
            [P in keyof C['parameters']]: NodeParameters[C['parameters'][P]];
        }>,
    ) => void;

    /**
     * Close the node
     * @param name - Updated name of the node
     */
    closeNode: (name: string) => void;
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
            /** Name of the node */
            name: string;

            /** Parameter values used in the input / output */
            parameters: {
                [P in keyof C['parameters']]: NodeParameters[C['parameters'][P]];
            };

            /** List of input data */
            input: (keyof C['parameters'])[];

            /** List of output data */
            output: (keyof C['parameters'])[];
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
