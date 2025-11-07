import './App.css';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes/AppRoutes';

function App() {
  return (
    <AppProviders>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 w-full">
          <AppRoutes />
        </main>
      </div>
    </AppProviders>
  );
}

export default App;
