export default interface Loader {
    add: (msg: string) => void;
    remove: () => void;
    update: (msgList: string[]) => void;
    destroy: () => void;
}
