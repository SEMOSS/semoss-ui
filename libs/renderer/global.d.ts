declare module "*.png" {
    const value: any;
    export = value;
}

declare module "*.svg" {
    const value: any;
    export = value;
}

declare module "*.jpg" {
    const value: any;
    export = value;
}

declare module "*.jpeg" {
    const value: any;
    export = value;
}

declare module "*.gif" {
    const value: any;
    export = value;
}

declare module "!!raw-loader!*" {
    const contents: any;
    export = contents;
}

type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;
