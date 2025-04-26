import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar';
import ehtpImage from './assets/EHTP-image.jpg';
import CartePage from './pages/CartePage'; // à créer comme dit avant

function HomePage() {
  return (
    <>
      <div className="full-banner">
        <img src={ehtpImage} alt="Banner" className="ehtp-img" />
        <h1 className="banner-title">EHTP</h1>
      </div>

      <main className="main-content">
        <h1>Bienvenue sur GIS Web</h1>
        <p>Contenu de la page...</p>
      </main>
    </>
  );
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/carte" element={<CartePage />} />
      </Routes>
    </Router>
  );
}

export default App;
