export enum QueryStructFilterPixelTypes {
    'CONST_DECIMAL' = 'CONST_DECIMAL',
    'CONST_INT' = 'CONST_INT',
    'CONST_STRING' = 'CONST_STRING',
    'CONST_DATE' = 'CONST_DATE',
    'CONST_TIMESTAMP' = 'CONST_TIMESTAMP',
    'BOOLEAN' = 'BOOLEAN',
    'NULL_VALUE' = 'NULL_VALUE',
    'COLUMN' = 'COLUMN',
}

type QueryStructFilterNode =
    | {
          pixelType: QueryStructFilterPixelTypes.COLUMN;
          value: {
              type: 'COLUMN';
              content: {
                  table: string;
                  column: string;
              };
          }[];
      }
    | {
          pixelType:
              | QueryStructFilterPixelTypes.CONST_DECIMAL
              | QueryStructFilterPixelTypes.CONST_INT;
          value: number | number[];
      }
    | {
          pixelType:
              | QueryStructFilterPixelTypes.CONST_STRING
              | QueryStructFilterPixelTypes.CONST_DATE
              | QueryStructFilterPixelTypes.CONST_TIMESTAMP;
          value: string | string[];
      }
    | {
          pixelType: QueryStructFilterPixelTypes.BOOLEAN;
          value: boolean | boolean[];
      }
    | {
          pixelType: QueryStructFilterPixelTypes.NULL_VALUE;
          value: null | null[];
      };

export interface SimpleQueryStructFilter {
    type: 'SIMPLE';
    content: {
        left: QueryStructFilterNode;
        comparator:
            | '>'
            | '<'
            | '<='
            | '>='
            | '!='
            | '?like'
            | '?begins'
            | '?ends'
            | '=='
            | '<>';
        right: QueryStructFilterNode;
    };
}

interface OrQueryStructFilter {
    type: 'OR';
    content: QueryStructFilter;
}

interface AndQueryStructFilter {
    type: 'AND';
    content: QueryStructFilter;
}

export type QueryStructFilter = (
    | SimpleQueryStructFilter
    | OrQueryStructFilter
    | AndQueryStructFilter
)[];

/** Rendered Types */
interface Node {
    key: string;
    parent: string;
    type: string;
}

export interface SimpleNode extends Node {
    type: 'SIMPLE';
    filter: {
        selected:
            | {
                  alias: string; // display name of the node
                  concept: string; // concept of the node (will be souce__column)
                  selector: string; // selector name to query for the data
                  type: string; // data type of the node
                  table: string; // table of the node
                  column: string; // column of the node
              }
            | undefined;
        comparator: SimpleQueryStructFilter['content']['comparator'];
        comparatorOptions: SimpleQueryStructFilter['content']['comparator'][];
        active: '' | 'equality' | 'numerical' | 'date' | 'timestamp' | 'match';
        equality: {
            loading: boolean;
            taskId: boolean;
            model: unknown[];
            options: unknown[];
            search: string;
            limit: number;
            canCollect: boolean;
        };
        numerical: {
            model: number | '';
        };
        date: {
            model: string;
        };
        timestamp: {
            model: string;
        };
        match: {
            loading: boolean;
            taskId: string;
            model: string;
            options: unknown[];
            limit: number;
            canCollect: boolean;
        };
    };
}

export interface GroupNode extends Node {
    type: 'GROUP';
    value: 'AND' | 'OR';
    children: (SimpleNode | GroupNode)[];
}
