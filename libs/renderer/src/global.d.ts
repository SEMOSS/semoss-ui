declare module "*.png" {
    const value: unknown;
    export = value;
}

declare module "*.svg" {
    const value: unknown;
    export = value;
}

declare module "*.jpg" {
    const value: unknown;
    export = value;
}

declare module "*.jpeg" {
    const value: unknown;
    export = value;
}

declare module "*.gif" {
    const value: unknown;
    export = value;
}

declare module "!!raw-loader!*" {
    const contents: unknown;
    export = contents;
}

type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;
