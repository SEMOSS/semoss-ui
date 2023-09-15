export { Action, ActionMessages } from '@/stores';
import { Canvas, Renderer, Widgets } from '@/components';
import { useCanvas } from '@/hooks';

const CanvasNameSpace = Object.assign(Canvas, {
    Renderer: Renderer,
});

export { CanvasNameSpace as Canvas, useCanvas, Widgets };
