import './App.css';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes/AppRoutes';
import { HeaderLayout } from "./components/layout/HeaderLayout";
import { Footer } from "./components/layout/Footer";
import i18n from './i18n';
function App() {
  return (

    <AppProviders>
      <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* HEADER */}
        

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full overflow-x-hidden">
          <AppRoutes />
        </main>

        {/* FOOTER */}
        
      </div>
    </AppProviders>
  );
}

export default App;
