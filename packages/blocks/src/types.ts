export type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
    U[keyof U];

export type DeepPartial2<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export type ExcludeEmpty<T> = T extends AtLeastOne<T> ? T : never;

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
    ...0[]
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

export type PixelReturn<O extends unknown[] | [] = unknown[]> = {
    insightID: string;
    errors: string[];
    pixelReturn: {
        isMeta: boolean;
        operationType: string[];
        output: O[number];
        pixelExpression: string;
        pixelId: string;
        additionalOutput?: unknown;
    }[];
};
export type RunPixel = (subString: string) => Promise<PixelReturn>;
