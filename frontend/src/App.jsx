import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ResultsProvider } from './context/ResultsContext';
import PageNav from './components/PageNav';
import CoverPage from './pages/CoverPage';
import NotebookPage from './pages/NotebookPage';
import BuildPlanPage from './pages/BuildPlanPage';

function ChromeLayout({ children }) {
  const location = useLocation();
  const hideNav = location.pathname === '/';

  return (
    <>
      {!hideNav && <PageNav />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ResultsProvider>
        <ChromeLayout>
          <Routes>
            <Route path="/" element={<CoverPage />} />
            <Route path="/results" element={<NotebookPage />} />
            <Route path="/products" element={<NotebookPage />} />
            <Route path="/product/:idx" element={<NotebookPage />} />
            <Route path="/build" element={<BuildPlanPage />} />
            <Route path="*" element={<CoverPage />} />
          </Routes>
        </ChromeLayout>
      </ResultsProvider>
    </BrowserRouter>
  );
}
