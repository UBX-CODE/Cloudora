import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { RateLimitModal } from './components/common/RateLimitModal';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <RateLimitModal />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
