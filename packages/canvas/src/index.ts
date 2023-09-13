import { Canvas, Error, Loading, Unauthorized, Renderer } from '@/components';
import { useCanvas } from '@/hooks';

const CanvasNameSpace = Object.assign(Canvas, {
    Error: Error,
    Loading: Loading,
    Unauthorized: Unauthorized,
    Renderer: Renderer,
});

export { CanvasNameSpace as Canvas, useCanvas };
