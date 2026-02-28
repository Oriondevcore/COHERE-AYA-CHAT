# 🔥 COHERE AYA CHAT - FILE SETUP
## Copy These Files EXACTLY (Feb 25, 2026)

---

## 📁 **YOUR PROJECT STRUCTURE SHOULD BE:**

```
C:\Users\Admin\Desktop\COHERE AYA CHAT\
├── src/
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── VoiceRecorder.tsx
│   │   ├── TextToSpeech.tsx
│   │   └── ParticleBackground.tsx
│   ├── styles/
│   │   └── globals.css
│   └── main.tsx
├── index.html                    ← USE THE NEW ONE (not RACK)
├── package.json                  ← USE THE ONE WITH SCRIPTS
├── tsconfig.json                 ← USE THE NEW ONE (not RACK)
├── tsconfig.node.json            ← NEW FILE
├── vite.config.ts                ← USE THE NEW ONE (not RACK)
├── tailwind.config.js            ← NEW FILE
└── node_modules/ (created by npm install)
```

---

## 🚨 **DELETE THESE (They're for RACK, not CHAT):**

- ❌ Old `index.html` (for RACK RATE)
- ❌ Old `tsconfig.json` (for RACK RATE)
- ❌ Old `vite.config.ts` (for RACK RATE)
- ❌ Old `package.json` (if it doesn't have dev/build scripts)

---

## ✅ **COPY THESE NEW FILES (For CHAT app)**

### **1. index.html** (REPLACE the old one)
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="ORION Cohere AYA Chat - Voice-First Luxury Concierge AI" />
    <meta name="theme-color" content="#0f1419" />
    <title>ORION Concierge Chat</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='80' fill='%23d4af37'>◆</text></svg>" />
    <meta name="user-scalable" content="no" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### **2. tsconfig.json** (REPLACE the old one)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### **3. tsconfig.node.json** (NEW FILE - Create it)
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### **4. vite.config.ts** (REPLACE the old one)
```typescript
import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "terser",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

### **5. tailwind.config.js** (NEW FILE - Create it)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          500: '#d4af37',
          600: '#c09a3a',
        },
        slate: {
          900: '#0f1419',
          800: '#1a1f2e',
          700: '#374151',
          600: '#4b5563',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
```

### **6. package.json** (If not already correct)
```json
{
  "name": "orion-chat",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "2.1.1",
    "lucide-react": "^0.575.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^3.7.0",
    "tailwind-merge": "3.4.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "4.1.17",
    "@types/node": "^22.0.0",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "5.1.1",
    "tailwindcss": "4.1.17",
    "typescript": "5.9.3",
    "vite": "7.2.4"
  }
}
```

---

## 🚀 **DO THIS NOW (In PowerShell)**

```powershell
# 1. Navigate to your project
cd C:\Users\Admin\Desktop\COHERE AYA CHAT\

# 2. Delete old node_modules
rm -r node_modules

# 3. Delete old package-lock
rm package-lock.json

# 4. Install fresh
npm install

# 5. Run dev
npm run dev
```

**You should see:**
```
  ➜  Local:   http://localhost:5173/
```

Browser should open automatically.

---

## ✅ **VERIFY EVERYTHING**

After `npm run dev` runs:

- [ ] Browser opens to http://localhost:5173/
- [ ] You see ORION config panel
- [ ] GAS URL input field visible
- [ ] Guest name field visible
- [ ] Room number field visible
- [ ] Language selector visible
- [ ] "Start ORION" button visible
- [ ] No errors in console
- [ ] Page looks beautiful (dark navy with gold accents)

---

## 🎤 **NEXT STEP**

Once `npm run dev` works:

1. Paste your GAS Web App URL into the config
2. Update guest name (or leave as "Victoria Okafor")
3. Click "Start ORION"
4. Click "Start Listening" button
5. Speak into your microphone
6. Watch Cohere AYA respond
7. Click speaker button to hear TTS

---

## 🐛 **IF SOMETHING BREAKS**

### **Error: Missing modules**
```powershell
npm install
```

### **Error: vite not found**
```powershell
npx vite
```

### **Error: Port 5173 in use**
```powershell
npm run dev -- --port 5174
```

### **Error: TypeScript issues**
```powershell
npm run lint
# Shows errors, fix them
```

---

## 💎 **YOU'RE READY**

All files are configured for:
- ✅ React + Vite
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Voice input
- ✅ Real TTS
- ✅ Particle animations
- ✅ Beautiful UI

**Not for RACK. For CHAT.**

Go build. 🔥
