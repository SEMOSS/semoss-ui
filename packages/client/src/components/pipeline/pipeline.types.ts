export type PipelineVariable =
    | {
          type: 'frame';
          value: unknown;
      }
    | {
          type: 'string';
          value: string;
      }
    | {
          type: 'number';
          value: number;
      };

export interface PipelineNodeData {
    /** Corresponding widget that will load the view */
    widget: string;

    /** Paremeters used in the input / output */
    parameters: Record<string, PipelineVariable>;

    /** List of input data */
    input: string[];

    /** List of output data */
    output: string[];
}
