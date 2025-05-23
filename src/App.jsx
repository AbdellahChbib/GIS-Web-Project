import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Hero from './components/Hero';
import About from './components/About';
import CardGrid from './components/CardGrid';
import Stats from './components/Stats';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider } from './contexts/AuthContext';
import ehtpImage from './assets/EHTP-image.jpg';
import CartePage from './pages/CartePage';

function HomePage() {
  return (
    <>
      <Navbar />
      <div className="full-banner">
        <img src={ehtpImage} alt="Banner" className="ehtp-img" />
        <h1 className="banner-title">EHTP</h1>
      </div>
      <Hero />
      <About />
      <CardGrid />
      <Stats />
      <Contact />
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/carte" element={<CartePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
