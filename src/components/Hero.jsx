import React, { useEffect, useState } from 'react';
import styles from '../styles/HeroSection.module.css';
import { FiArrowRight, FiMapPin, FiDatabase } from 'react-icons/fi';

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={`${styles.hero} ${isVisible ? styles.visible : ''}`}>
      <div className={styles.heroBackground}>
        <div className={styles.overlay}></div>
      </div>
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          <span className={styles.highlight}>GIS-WEB</span>
          <br />
          Plateforme de Gestion
          <br />
          des Données Spatiales
        </h1>
        <p className={styles.description}>
          Explorez, analysez et visualisez vos données géographiques de manière interactive.
          Une solution complète pour la gestion de vos informations spatiales.
        </p>
        <div className={styles.features}>
          <div className={styles.feature}>
            <FiMapPin className={styles.featureIcon} />
            <span>Cartographie avancée</span>
          </div>
          <div className={styles.feature}>
            <FiDatabase className={styles.featureIcon} />
            <span>Gestion des données</span>
          </div>
        </div>
        <div className={styles.cta}>
          <a href="#about" className={styles.heroBtn}>
            <span>Explorer la plateforme</span>
            <FiArrowRight className={styles.btnIcon} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero; 