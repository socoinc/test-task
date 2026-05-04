import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import {
  clearStoredToken,
  getStoredToken,
  storeToken,
} from './lib/auth-storage';

export function App() {
  const token = getStoredToken();

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          <AuthPage
            token={token}
            onAuthenticated={(nextToken) => storeToken(nextToken)}
          />
        }
      />
      <Route
        path="/"
        element={
          token ? (
            <DashboardPage
              token={token}
              onLogout={() => {
                clearStoredToken();
                window.location.href = '/auth';
              }}
            />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
    </Routes>
  );
}
