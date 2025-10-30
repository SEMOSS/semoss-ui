export type Role =
	| "OWNER"
	| "EDIT"
	| "VIEWER"
	| "READ_ONLY"
	| "DISCOVERABLE"
	| "EDITOR";

export interface PixelCommand {
	type: string;
	components: unknown[];
	terminal?: boolean;
	meta?: boolean;
}

/**
 * All types used in the app
 */
export type ALL_TYPES = "APP" | ENGINE_TYPES;

/**
 * Engine types used in the app
 */
export type ENGINE_TYPES =
	| "DATABASE"
	| "STORAGE"
	| "MODEL"
	| "VECTOR"
	| "FUNCTION";

export type Join<K, P> = K extends string | number
	? P extends string | number
		? `${K}${"" extends P ? "" : "."}${P}`
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

// ---------- helpers ----------
type Keys<T> = Extract<keyof T, string | number>;
type KeyStr<K> = K extends string | number ? `${K}` : never;
type ChildKeys<T> = KeyStr<keyof T>;

type IsObject<T> = T extends object ? true : false;

// ---------- level builders ----------
type L1<T> = KeyStr<Keys<T>>;

type L2<T> = {
	[K1 in Keys<T>]: IsObject<T[K1]> extends true
		? `${KeyStr<K1>}.${ChildKeys<T[K1]>}`
		: never;
}[Keys<T>];

type L3<T> = {
	[K1 in Keys<T>]: IsObject<T[K1]> extends true
		? {
				[K2 in Keys<T[K1]>]: IsObject<T[K1][K2]> extends true
					? `${KeyStr<K1>}.${KeyStr<K2>}.${ChildKeys<T[K1][K2]>}`
					: never;
			}[Keys<T[K1]>]
		: never;
}[Keys<T>];

type L4<T> = {
	[K1 in Keys<T>]: IsObject<T[K1]> extends true
		? {
				[K2 in Keys<T[K1]>]: IsObject<T[K1][K2]> extends true
					? {
							[K3 in Keys<T[K1][K2]>]: IsObject<
								T[K1][K2][K3]
							> extends true
								? `${KeyStr<K1>}.${KeyStr<K2>}.${KeyStr<K3>}.${ChildKeys<T[K1][K2][K3]>}`
								: never;
						}[Keys<T[K1][K2]>]
					: never;
			}[Keys<T[K1]>]
		: never;
}[Keys<T>];

type L5<T> = {
	[K1 in Keys<T>]: IsObject<T[K1]> extends true
		? {
				[K2 in Keys<T[K1]>]: IsObject<T[K1][K2]> extends true
					? {
							[K3 in Keys<T[K1][K2]>]: IsObject<
								T[K1][K2][K3]
							> extends true
								? {
										[K4 in Keys<T[K1][K2][K3]>]: IsObject<
											T[K1][K2][K3][K4]
										> extends true
											? `${KeyStr<K1>}.${KeyStr<K2>}.${KeyStr<K3>}.${KeyStr<K4>}.${ChildKeys<T[K1][K2][K3][K4]>}`
											: never;
									}[Keys<T[K1][K2][K3]>]
								: never;
						}[Keys<T[K1][K2]>]
					: never;
			}[Keys<T[K1]>]
		: never;
}[Keys<T>];

// ---------- exported ----------
export type Paths<T> = L1<T> | L2<T> | L3<T> | L4<T> | L5<T>;

export type PathValue<
	T,
	P extends Paths<T, 4>,
> = P extends `${infer Key}.${infer Rest}`
	? Rest extends Paths<Idx<T, Key>, 4>
		? PathValue<Idx<T, Key>, Rest>
		: never
	: Idx<T, P>;
