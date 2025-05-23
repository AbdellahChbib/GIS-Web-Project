import React, { useEffect, useRef } from 'react';
import { FiTarget, FiEye, FiAward } from 'react-icons/fi';
import styles from '../styles/AboutSection.module.css';

const About = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section className={styles.aboutSection} id="about" ref={sectionRef}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>À propos de GIS-WEB</h2>
        <p className={styles.subtitle}>
          Une solution innovante pour la gestion et l'analyse des données géographiques
        </p>
      </div>

      <div className={styles.aboutGrid}>
        <div className={`${styles.aboutCard} ${styles.mission}`}>
          <div className={styles.iconWrapper}>
            <FiTarget className={styles.icon} />
          </div>
          <h3>Notre Mission</h3>
          <p>
            Fournir une plateforme moderne et intuitive pour la gestion et
            l'analyse des données géographiques, permettant aux organisations
            de prendre des décisions éclairées basées sur des données spatiales précises.
          </p>
        </div>

        <div className={`${styles.aboutCard} ${styles.vision}`}>
          <div className={styles.iconWrapper}>
            <FiEye className={styles.icon} />
          </div>
          <h3>Notre Vision</h3>
          <p>
            Devenir la référence en matière de solutions SIG web pour
            la gestion du territoire, en offrant des outils innovants
            qui transforment la façon dont les organisations interagissent
            avec leurs données géographiques.
          </p>
        </div>

        <div className={`${styles.aboutCard} ${styles.values}`}>
          <div className={styles.iconWrapper}>
            <FiAward className={styles.icon} />
          </div>
          <h3>Nos Valeurs</h3>
          <p>
            Innovation, qualité et satisfaction client sont au cœur
            de notre approche. Nous nous engageons à fournir des
            solutions fiables et performantes qui répondent aux
            besoins spécifiques de nos utilisateurs.
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>500+</span>
          <span className={styles.statLabel}>Projets réalisés</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>50+</span>
          <span className={styles.statLabel}>Clients satisfaits</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>10+</span>
          <span className={styles.statLabel}>Années d'expérience</span>
        </div>
      </div>
    </section>
  );
};

export default About; 