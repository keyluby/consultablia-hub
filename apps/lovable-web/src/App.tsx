import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Panel from './pages/Panel';
import EmitirPage from './pages/EmitirPage';
import EscanearPage from './pages/EscanearPage';
import Sidebar from './components/Sidebar';

function AppLayout() {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            {/* Sidebar - fixed left */}
            <Sidebar />

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem 3rem', background: 'var(--color-bg)' }}>
                <Routes>
                    <Route path="/" element={<Panel />} />
                    <Route path="/emitir" element={<EmitirPage />} />
                    <Route path="/escanear" element={<EscanearPage />} />
                    <Route path="*" element={<div style={{ textAlign: 'center', marginTop: '10vh' }}><h2>404 - Página no encontrada</h2><Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Volver al Panel</Link></div>} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppLayout />
        </Router>
    );
}

export default App;
