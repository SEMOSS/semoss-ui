import React, { useEffect, useRef } from 'react';
import GoldenLayout from 'golden-layout';
import 'golden-layout/src/css/goldenlayout-base.css';
import 'golden-layout/src/css/goldenlayout-light-theme.css';
import DraggableComponent from './DraggableComponent';

const GoldenLayoutComponent: React.FC = () => {
    const layoutRef = useRef<GoldenLayout | null>(null);

    useEffect(() => {
        // Initialize Golden Layout
        const config = {
            content: [
                {
                    type: 'row',
                    content: [
                        {
                            type: 'react-component',
                            component: 'ComponentType1',
                            title: 'Component 1',
                        },
                        {
                            type: 'react-component',
                            component: 'ComponentType2',
                            title: 'Component 2',
                        },
                    ],
                },
            ],
        };

        layoutRef.current = new GoldenLayout(
            config,
            '#golden-layout-container',
        );

        // Register React components
        layoutRef.current.registerComponent(
            'ComponentType1',
            (container, componentState) => {
                ReactDOM.render(<ComponentType1 />, container.getElement());
            },
        );

        layoutRef.current.registerComponent(
            'ComponentType2',
            (container, componentState) => {
                ReactDOM.render(<ComponentType2 />, container.getElement());
            },
        );

        // Mount the layout
        layoutRef.current.init();

        // Handle drop event
        const handleDrop = (e: DragEvent) => {
            e.preventDefault();
            const componentType = e.dataTransfer.getData('componentType');

            // Create a new item in the layout
            layoutRef.current?.createDragSource(
                e,
                `<div data-golden="${componentType}">Dragged</div>`,
            );

            // Get the updated layout structure
            const updatedLayoutStructure = layoutRef.current?.toConfig();
            console.log(updatedLayoutStructure);
        };

        // Add drop event listener to the layout container
        const layoutContainer = document.getElementById(
            'golden-layout-container',
        );
        layoutContainer?.addEventListener('dragover', (e) =>
            e.preventDefault(),
        );
        layoutContainer?.addEventListener('drop', handleDrop);

        return () => {
            if (layoutRef.current) {
                layoutRef.current.destroy();
            }
            layoutContainer?.removeEventListener('dragover', (e) =>
                e.preventDefault(),
            );
            layoutContainer?.removeEventListener('drop', handleDrop);
        };
    }, []);

    return (
        <div>
            <DraggableComponent />
            <div
                id="golden-layout-container"
                style={{ width: '100%', height: '100vh' }}
            />
        </div>
    );
};

export default GoldenLayoutComponent;
