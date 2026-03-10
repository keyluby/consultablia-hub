import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Panel from "./pages/Panel";
import EmitirPage from "./pages/EmitirPage";
import EscanearPage from "./pages/EscanearPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '2rem 3rem', background: 'var(--color-bg)' }}>
        <Routes>
          <Route path="/" element={<Panel />} />
          <Route path="/emitir" element={<EmitirPage />} />
          <Route path="/escanear" element={<EscanearPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
