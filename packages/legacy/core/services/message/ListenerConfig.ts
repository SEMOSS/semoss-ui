export default interface ListenerConfig {
    id: number;
    message: string;
    callback: (...args: any) => void;
    destroy: () => void;
}
