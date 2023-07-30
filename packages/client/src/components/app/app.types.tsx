/**
 * Define type information for the widget
 */
export interface AppConfig<T extends string = string> {
    /** Type of the app */
    type: T;

    /** Environment variables associated with the app */
    env: Record<string, unknown>;
}

/**
 * App Component
 */
export type AppComponent<T extends AppConfig = AppConfig> =
    React.FunctionComponent<{
        /** Id of the app */
        id: string;

        /** Environment variables associated with the app */
        env: T['env'];
    }> & {
        /** Type of the app */
        type: T['type'];

        /** Environment variables associated with the app */
        env: T['env'];
    };
