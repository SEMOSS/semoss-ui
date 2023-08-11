/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.png' {
    const value: any;
    export = value;
}

declare module '*.svg' {
    const value: any;
    export = value;
}

declare module '*.jpg' {
    const value: any;
    export = value;
}

declare module '!!raw-loader!*' {
    const contents: string;
    export = contents;
}

interface Window {
    webkitSpeechRecognition: any;
}

/**
 * Make a single key partial
 */
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make a single key required
 */
type RequiredBy<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/**
 * Deeply Partial
 */
type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;
