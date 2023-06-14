export default interface TrackingAction {
    time: string;
    value: { tab?: string; open?: boolean };
}
