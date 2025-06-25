# Lakron

Minimal, encrypted, realtime life scheduler built with React and Supabase.

Lakron is a privacy-first task and event manager. All your data is encrypted in the browser before it's stored, and realtime sync keeps your schedule up to date across devices. Built for simplicity, speed, and security.

---

## Features

- 🔐 **End-to-end encryption**: Tasks are encrypted with your password before leaving your device.
- ⚡ **Realtime sync**: Updates instantly across all your devices (Supabase Realtime).
- 🖤 **Minimal, dark UI**: Clean, distraction-free interface.
- 🛠️ **React + Vite + TypeScript**: Modern, fast, and easy to extend.
- 🚀 **Automated deployment**: GitHub Actions + Caddy for zero-downtime deploys.

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/laakri/lakron.git
cd lakron
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root:

VITE_ENCRYPTION_KEY=your-random-salt
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-service-role-key
VITE_SUPABASE_ANON_KEY=your-anon-key

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

### 4. Start the dev server

```bash
npm run dev
```

---

## Database Setup

Create the tables in your Supabase SQL editor:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  time VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  type VARCHAR(10) CHECK (type IN ('task', 'event')) DEFAULT 'task',
  description TEXT,
  profile_id INTEGER REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority INTEGER NOT NULL DEFAULT 2,
  recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  "completedDates" TEXT[]
);

ALTER TABLE tasks
  ADD CONSTRAINT IF NOT EXISTS check_recurrence_rule
  CHECK (
    recurrence_rule IN ('daily', 'weekly', 'monthly', 'yearly', 'custom')
    OR recurrence_rule IS NULL
  );
```

Enable Realtime for the `tasks` table in Supabase:  
Go to **Database → Replication**, find `tasks`, and enable Realtime.

---

## Deployment

Lakron uses GitHub Actions for automated deployment.  
On every push to `main`, the workflow:

1. Installs dependencies and builds the frontend
2. Copies the built files to your server via SCP
3. Reloads Caddy to serve the latest version

Configure your server SSH details as GitHub secrets.

---

## License

MIT

---

**Blog post and more details:**  
[Your blog link here]

---

**Made with React, Supabase, and a focus on privacy.**
