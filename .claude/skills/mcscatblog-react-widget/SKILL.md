---
name: mcscatblog-react-widget
description: Build and embed a React widget into a Jekyll blog post as a self-contained HTML file
---

# Embed a React Widget in a Blog Post

Build a React (JSX) component into a single self-contained HTML file and embed it in a Jekyll/Chirpy blog post via iframe.

## Key Constraints

- **Jekyll processes all `.html` files through Liquid.** Files without front matter are treated as static files and copied as-is — this is what we want. Never add YAML front matter or `{% raw %}` tags to widget HTML files.
- **Minified JS often contains template-literal syntax** (`${...}`, backticks) that Liquid interprets as tags, causing builds to hang indefinitely. The solution is to let the file be a static file (no front matter = no Liquid processing).
- **Build time:** Jekyll takes ~60 seconds on this repo. That's normal, not a hang. Wait for it.
- **Never put `node_modules` inside the blog repo.** Jekyll copies all static files under `assets/` — thousands of files from `node_modules` will make builds take 10+ minutes. The `exclude` config in `_config.yml` does NOT prevent static files under `assets/` from being copied.

## Build Location

**Keep the widget build project permanently at `C:\Users\kkanjitajdin\widget-builds\<widget-name>\`** — outside the blog repo. This folder keeps `node_modules` installed so rebuilds are fast (~25s instead of 2+ minutes for npm install + build).

```
C:\Users\kkanjitajdin\widget-builds\<widget-name>\
├── package.json
├── vite.config.js
├── index.html
├── node_modules/          ← stays permanently, no reinstall needed
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx            ← copy of the source .jsx from blog assets
    └── components/ui/     ← inline shadcn/ui components if needed
```

The source `.jsx` lives in the blog repo at `assets/posts/<post-slug>/WidgetName.jsx`. Edit it there, then copy to the build folder to rebuild.

### 2. Key dependencies

```json
{
  "dependencies": {
    "preact": "^10.25.0",
    "lucide-react": "^0.475.0"
  },
  "devDependencies": {
    "@preact/preset-vite": "^2.9.0",
    "vite": "^6.0.0",
    "vite-plugin-singlefile": "^2.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0"
  }
}
```

**`vite-plugin-singlefile` is essential** — it inlines all JS and CSS directly into the HTML output. Without it, Vite produces separate `.js` and `.css` files that won't load inside an iframe served from a different path.

**Use Preact, not React** — Preact is a 3KB drop-in replacement for React (140KB). Same JSX, same hooks. The `@preact/preset-vite` plugin aliases `react` and `react-dom` to `preact/compat` automatically, so libraries like `lucide-react` work unchanged.

**Do not use framer-motion** — it adds ~150KB for animations that CSS transitions handle in 3 lines. Use CSS `@keyframes` instead.

### 3. Vite config

```js
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
  plugins: [preact(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  build: { outDir: 'dist' },
})
```

### 3b. Entry point (`src/main.jsx`)

```jsx
import { render } from "preact";
import App from "./App.jsx";
import "./index.css";

render(<App />, document.getElementById("root"));
```

### 4. Handle shadcn/ui imports

The source `.jsx` likely imports from `@/components/ui/card`, `@/components/ui/button`, etc. These are shadcn/ui components that need to be inlined since you can't install the full library in a standalone build.

Create a single file `src/components/ui/card.jsx` that exports all needed components (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `Badge`, `Button`, `Separator`) as minimal Tailwind-styled React components.

Then rewrite the import in `App.jsx`:
```js
// Before (multiple shadcn imports):
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// After (single import):
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Separator } from "@/components/ui/card";
```

### 5. Build and deploy

```powershell
# From the permanent build folder (not the blog repo)
cd C:\Users\kkanjitajdin\widget-builds\<widget-name>

# Copy latest source from blog repo
Copy-Item "C:\Users\kkanjitajdin\mcscatblog\assets\posts\<post-slug>\WidgetName.jsx" "src\App.jsx" -Force

# Fix shadcn imports (if source still has separate imports)
(Get-Content "src\App.jsx" -Raw) -replace 'import \{ Card.*\} from "@/components/ui/card";[\s\S]*?import \{ Separator \} from "@/components/ui/separator";', 'import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Separator } from "@/components/ui/card";' | Set-Content "src\App.jsx" -Encoding utf8

# Build (fast — node_modules already installed)
npm run build
# Output: dist/index.html (single file, ~370KB)

# Copy built HTML back to blog repo assets
Copy-Item "dist\index.html" "C:\Users\kkanjitajdin\mcscatblog\assets\posts\<post-slug>\WidgetName.html" -Force
```

No need to delete anything — the build folder is outside the blog repo and doesn't affect Jekyll.

### 6. Embed in the blog post

Use an iframe with `relative_url` for the baseurl prefix:

```markdown
<iframe src="{{ '/assets/posts/<post-slug>/WidgetName.html' | relative_url }}" 
  width="100%" height="560" frameborder="0" 
  style="border-radius: 12px; border: 1px solid #e2e8f0;"></iframe>
```

### 7. Rebuild Jekyll and test

```powershell
bundle exec jekyll build                        # ~60 seconds
bundle exec jekyll serve --skip-initial-build --livereload
```

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Jekyll build hangs forever | HTML file has front matter → Liquid processes 350KB of minified JS | Remove front matter. File must start with `<!DOCTYPE html>` |
| Jekyll build takes 10+ minutes | `node_modules` exists inside blog repo assets | Keep build folder outside blog repo at `C:\Users\kkanjitajdin\widget-builds\` |
| Widget shows raw JSX text | Build didn't inline properly | Use `vite-plugin-singlefile`, verify `dist/index.html` contains `<script>` and `<style>` tags |
| iframe shows "refused to connect" | Wrong path — missing `/mcscatblog/` baseurl | Use `{{ '...' \| relative_url }}` in the iframe src |
| Widget doesn't render | shadcn imports not resolved | Create inline component file, rewrite imports |

## Rebuilding After Source Changes

Edit the `.jsx` in the blog repo, then:

```powershell
cd C:\Users\kkanjitajdin\widget-builds\<widget-name>
Copy-Item "C:\Users\kkanjitajdin\mcscatblog\assets\posts\<post-slug>\WidgetName.jsx" "src\App.jsx" -Force
# Fix imports if needed (see step 4)
npm run build                                    # ~25 seconds
Copy-Item "dist\index.html" "C:\Users\kkanjitajdin\mcscatblog\assets\posts\<post-slug>\WidgetName.html" -Force
# Then rebuild Jekyll from the blog repo
cd C:\Users\kkanjitajdin\mcscatblog
bundle exec jekyll build                         # ~60 seconds
bundle exec jekyll serve --skip-initial-build --livereload
```

## First-Time Setup for a New Widget

Only needed once per widget:

```powershell
# Create build folder
New-Item -ItemType Directory -Force "C:\Users\kkanjitajdin\widget-builds\<widget-name>\src\components\ui"

# Copy/create: package.json, vite.config.js, index.html, src/main.jsx, src/index.css, src/components/ui/card.jsx
# (See sections 2-4 above for file contents)

# Install dependencies (one time)
cd C:\Users\kkanjitajdin\widget-builds\<widget-name>
npm install
```
