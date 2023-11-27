export type Role =
    | 'OWNER'
    | 'EDIT'
    | 'VIEWER'
    | 'READ_ONLY'
    | 'DISCOVERABLE'
    | 'EDITOR';

export interface PixelCommand {
    type: string;
    components: any[];
    terminal?: boolean;
    meta?: boolean;
}

/**
 * All types used in the app
 */
export type ALL_TYPES = 'APP' | ENGINE_TYPES;

/**
 * Engine types used in the app
 */
export type ENGINE_TYPES =
    | 'DATABASE'
    | 'STORAGE'
    | 'MODEL'
    | 'VECTOR'
    | 'FUNCTION';

export type Join<K, P> = K extends string | number
    ? P extends string | number
        ? `${K}${'' extends P ? '' : '.'}${P}`
        : never
    : never;

export type Idx<T, K> = K extends keyof T
    ? T[K]
    : number extends keyof T
    ? K extends `${number}`
        ? T[number]
        : never
    : never;

export type Prev = [
    never,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    ...0[],
];

export type Paths<T, D extends number = 10> = [D] extends [never]
    ? never
    : T extends object
    ? {
          [K in keyof T]-?: K extends string | number
              ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
              : never;
      }[keyof T]
    : '';

export type PathValue<
    T,
    P extends Paths<T, 4>,
> = P extends `${infer Key}.${infer Rest}`
    ? Rest extends Paths<Idx<T, Key>, 4>
        ? PathValue<Idx<T, Key>, Rest>
        : never
    : Idx<T, P>;
