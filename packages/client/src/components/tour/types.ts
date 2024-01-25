export interface TourStep {
    tourAttr: string;
    position: 'right' | 'left' | 'top' | 'bottom';
    highlightPadding: number;
    title: string;
    content: string;
}
