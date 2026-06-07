import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Ranking from './pages/Ranking';
import MatchMakerPage from './pages/MatchMakerPage';
import History from './pages/History';
import NewPlayer from './pages/NewPlayer';
import PlayerProfile from './pages/PlayerProfile';
import ComparePlayers from './pages/ComparePlayers';
import './App.css';

// Componente para proteger as rotas
const PrivateRoute = ({ children }) => {
    const { user } = useContext(AppContext);
    return user ? children : <Navigate to="/login" />;
};

function AppContent() {
    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <div className="container">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={
                            <PrivateRoute>
                                <Ranking />
                            </PrivateRoute>
                        } />
                        <Route path="/matchmaker" element={
                            <PrivateRoute>
                                <MatchMakerPage />
                            </PrivateRoute>
                        } />
                        <Route path="/history" element={
                            <PrivateRoute>
                                <History />
                            </PrivateRoute>
                        } />
                        <Route path="/new-player" element={
                            <PrivateRoute>
                                <NewPlayer />
                            </PrivateRoute>
                        } />
                        <Route path="/compare" element={
                            <PrivateRoute>
                                <ComparePlayers />
                            </PrivateRoute>
                        } />
                        <Route path="/player/:name" element={
                            <PrivateRoute>
                                <PlayerProfile />
                            </PrivateRoute>
                        } />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
