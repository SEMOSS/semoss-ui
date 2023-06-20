### 1. Install **[pnpm](https://pnpm.io/installation)**

### 2. Clone the repository
Navigate to "C:\workspace\apache-tomcat-9.0.76\webapps"
```
git clone https://repo.semoss.org/prototype/components.git
```

### 3. Tailor Project specific endpoint
In the base directory of this project there should be a .env file, change the MODULE to your specific endpoint.
```
MODULE=/Monolith
```
to 
```
MODULE=/Monolith_Dev
```

Now navigate to "./packages/legacy/app.constants.js" somewhere near ln:22 change the mod
```
mod=Monolith
```
to
```
mod=Monolith_Dev
```

### 4. Install Packages
```
pnpm install
```

### 5. Start your FE
```
pnpm dev
```

Access application at (http://localhost:9090/semoss-ui/#!/)

## Useful references

[SEMOSS Design System](https://www.figma.com/file/kZwcxDBSMJbOcFaCin2xbd/MUI-Core-v5.4.0-(Revised)?type=design&node-id=6543-42910&t=GA9k6ctjRIYqdDqw-0)

[TypeScript Documentation](https://www.typescriptlang.org/docs/)

[Generics Typescript video](https://www.youtube.com/watch?v=nViEqpgwxHE)

[React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/docs/basic/setup)

[Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)

[WAI-ARIA Authoring Practices 1.2](https://www.w3.org/TR/wai-aria-practices-1.2/)