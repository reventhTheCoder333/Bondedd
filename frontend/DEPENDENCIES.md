## Frontend dependencies

Source of truth: `package.json` in this folder. This document explains what each dependency is used for.

### Runtime dependencies

- **react** / **react-dom**  
  - Core React 18 runtime and DOM renderer for the landing page UI.

- **framer-motion**  
  - Animation and interaction library for React. Powers:
    - Hero parallax and button hover states  
    - Scroll-based reveals (fade/slide in)  
    - Logo marquee motion and hub-and-spoke diagram animation  
    - FAQ accordion, footer wordmark reveal, and other microinteractions.

### Dev & tooling dependencies

- **vite**  
  - Dev server and build tool (Vite 6). Provides fast HMR, TypeScript + JSX support, and optimized production builds.

- **@vitejs/plugin-react**  
  - Official Vite plugin that enables React Fast Refresh and JSX/TSX support.

- **typescript**  
  - Type system for the React codebase (`.ts` / `.tsx` files).

- **tailwindcss**  
  - Utility-first CSS framework for layout, typography, and spacing. The theme (colors, fonts, radii) is configured in `tailwind.config.js`.

- **postcss** / **autoprefixer**  
  - CSS processing pipeline used by Tailwind and Vite. Autoprefixer adds vendor prefixes for better browser support.

- **@types/react** / **@types/react-dom**  
  - TypeScript type definitions for React and ReactDOM.

