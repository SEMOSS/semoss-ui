# @semoss/renderer v2.0.0

A modern React renderer library with Tailwind CSS styling for building drag-and-drop applications.

## 🎨 What's New in v2

- **Tailwind CSS**: Replaced Material UI with Tailwind CSS for better customization and performance
- **Modern Design System**: Custom color palette and component variants
- **Better Performance**: Reduced bundle size and improved rendering
- **Enhanced Components**: New button, text, input, and card components with Tailwind styling
- **Type Safety**: Improved TypeScript definitions for all components

## 🚀 Quick Start

### Installation

```bash
npm install @semoss/renderer@^2.0.0
```

### Basic Usage

```tsx
import { RendererV2 } from '@semoss/renderer';
import { Env, InsightProvider } from '@semoss/sdk/react';

// Update environment
Env.update({
    MODULE: process.env.MODULE || '',
});

// Your app JSON from the builder
const BLOCKS = {
    "queries": {},
    "blocks": {
        "page-1": {
            "slots": {
                "content": {
                    "children": ["button--1", "text--1"],
                    "name": "content"
                }
            },
            "widget": "page",
            "data": {
                "route": "",
                "style": {
                    "padding": "24px",
                    "fontFamily": "Inter",
                    "flexDirection": "column",
                    "display": "flex",
                    "gap": "16px"
                }
            },
            "id": "page-1"
        },
        "button--1": {
            "id": "button--1",
            "widget": "button",
            "parent": {
                "id": "page-1",
                "slot": "content"
            },
            "data": {
                "label": "Click Me",
                "variant": "primary",
                "size": "md",
                "type": "button"
            },
            "listeners": {
                "onClick": []
            }
        },
        "text--1": {
            "id": "text--1",
            "widget": "text",
            "parent": {
                "id": "page-1",
                "slot": "content"
            },
            "data": {
                "text": "Hello, Tailwind CSS!",
                "variant": "h2",
                "color": "primary"
            }
        }
    },
    "variables": {},
    "executionOrder": [],
    "version": "2.0.0"
};

function App() {
    return (
        <InsightProvider>
            <RendererV2 state={BLOCKS} />
        </InsightProvider>
    );
}
```

## 🎯 Component Variants

### Button Component

```tsx
// Available variants: primary, secondary, success, warning, error, outline, ghost
// Available sizes: sm, md, lg, xl

{
    "widget": "button",
    "data": {
        "label": "Submit",
        "variant": "primary",
        "size": "md",
        "loading": false,
        "disabled": false,
        "type": "button",
        "icon": "check",
        "iconPosition": "left"
    }
}
```

### Text Component

```tsx
// Available variants: h1, h2, h3, h4, h5, h6, body1, body2, caption, overline
// Available colors: primary, secondary, success, warning, error, default
// Available align: left, center, right, justify
// Available weight: light, normal, medium, semibold, bold

{
    "widget": "text",
    "data": {
        "text": "Welcome to our app!",
        "variant": "h1",
        "color": "primary",
        "align": "center",
        "weight": "bold"
    }
}
```

### Input Component

```tsx
// Available types: text, email, password, number, tel, url, search
// Available variants: outline, filled, ghost
// Available sizes: sm, md, lg

{
    "widget": "input",
    "data": {
        "label": "Email",
        "placeholder": "Enter your email",
        "type": "email",
        "required": true,
        "variant": "outline",
        "size": "md"
    }
}
```

### Card Component

```tsx
// Available variants: default, elevated, outlined, filled
// Available sizes: sm, md, lg

{
    "widget": "card",
    "data": {
        "title": "Card Title",
        "subtitle": "Card subtitle",
        "content": "This is the card content",
        "variant": "elevated",
        "size": "md",
        "showHeader": true,
        "showFooter": true,
        "footerContent": "Footer text"
    }
}
```

## 🎨 Customization

### Tailwind Configuration

The renderer includes a custom Tailwind configuration with:

- **Color Palette**: Primary, secondary, success, warning, error colors
- **Typography**: Inter font family with various weights
- **Animations**: Fade-in, slide-up, slide-down, scale-in animations
- **Spacing**: Consistent spacing scale

### Custom Styling

```tsx
import { cn } from '@semoss/renderer';

// Merge Tailwind classes safely
const buttonClasses = cn(
    "bg-primary-500",
    "hover:bg-primary-600",
    "text-white",
    "px-4 py-2",
    "rounded-md"
);
```

### Color Variants

```tsx
import { getColorClasses } from '@semoss/renderer';

// Get color classes for components
const primaryClasses = getColorClasses('primary');
const successClasses = getColorClasses('success');
```

## 🔧 Migration from v1

### Breaking Changes

1. **Import Changes**:
   ```tsx
   // v1
   import { Renderer } from '@semoss/renderer';
   
   // v2
   import { RendererV2 } from '@semoss/renderer';
   ```

2. **Component Variants**:
   ```tsx
   // v1 (Material UI)
   "variant": "contained" | "outlined" | "text"
   
   // v2 (Tailwind)
   "variant": "primary" | "secondary" | "success" | "warning" | "error" | "outline" | "ghost"
   ```

3. **Color System**:
   ```tsx
   // v1
   "color": "primary" | "secondary" | "success" | "warning" | "error"
   
   // v2
   "color": "primary" | "secondary" | "success" | "warning" | "error" | "default"
   ```

### Migration Guide

1. **Update Dependencies**:
   ```bash
   npm install @semoss/renderer@^2.0.0
   ```

2. **Update Imports**:
   ```tsx
   // Replace Renderer with RendererV2
   import { RendererV2 } from '@semoss/renderer';
   ```

3. **Update Component Data**:
   ```tsx
   // Update button variants
   "variant": "primary" // instead of "contained"
   
   // Update text variants
   "variant": "h1" // instead of "h1"
   ```

4. **Add Tailwind CSS**:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

## 📦 Available Components

### Core Components (v2)
- ✅ ButtonBlockV2
- ✅ TextBlockV2
- ✅ InputBlockV2
- ✅ CardBlockV2

### Legacy Components (v1 compatible)
- ✅ GridBlock
- ✅ PageBlock
- ✅ ContainerBlock
- ✅ DividerBlock
- ✅ ImageBlock
- ✅ IframeBlock
- ✅ HTMLBlock
- ✅ MarkdownBlock
- ✅ MermaidBlock
- ✅ AudioBlock
- ✅ AudioInputBlock
- ✅ PDFViewerBlock
- ✅ LogsBlock
- ✅ LLMComparisonBlock

## 🛠️ Development

### Building

```bash
npm run build
```

### Development

```bash
npm run dev
```

### Testing

```bash
npm run test
```

## 📄 License

ISC

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team. 