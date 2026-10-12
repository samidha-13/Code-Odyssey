import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/cinzel/latin-400.css';
import '@fontsource/cinzel/latin-600.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource-variable/manrope/wght.css';
import './styles/index.css';

import { ProblemStatementsPage } from './pages/ProblemStatementsPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProblemStatementsPage />
  </StrictMode>,
);
