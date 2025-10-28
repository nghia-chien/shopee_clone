import './App.css';
import { AppProviders } from './providers/AppProviders';
import { AppRoutes } from './routes/AppRoutes';
import { HeaderLayout } from "./components/layout/HeaderLayout";
import { Footer } from "./components/layout/Footer";

function App() {
  return (

    <AppProviders>
      <div className="flex flex-col min-h-screen">
        {/* HEADER */}
        

        {/* MAIN CONTENT */}
        <main className="flex-1 w-full">
          <AppRoutes />
        </main>

        {/* FOOTER */}
        
      </div>
    </AppProviders>
  );
}

export default App;
