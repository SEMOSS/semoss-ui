import Loader from './Loader';

export default interface Poller {
    register: (listener: Loader) => void;
    add: () => void;
    remove: () => void;
    destroy: () => void;
}
