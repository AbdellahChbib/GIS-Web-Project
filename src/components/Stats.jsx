import React, { useEffect, useRef, useState } from 'react';
import { FiUsers, FiMap, FiSmile, FiGlobe, FiArrowRight } from 'react-icons/fi';
import styles from '../styles/StatsSection.module.css';

const Stats = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [counts, setCounts] = useState({
    users: 0,
    projects: 0,
    satisfaction: 0,
    partners: 0
  });
  const sectionRef = useRef(null);

  const animateCount = (target, key, duration = 2000) => {
    const steps = 50;
    const stepValue = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setCounts(prev => ({ ...prev, [key]: Math.floor(current) }));
    }, duration / steps);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          animateCount(1000, 'users');
          animateCount(500, 'projects');
          animateCount(98, 'satisfaction');
          animateCount(50, 'partners');
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
  }, [isVisible]);

  return (
    <section className={`${styles.stats} ${isVisible ? styles.visible : ''}`} ref={sectionRef}>
      <div className={styles.statsContainer}>
        <div className={styles.statsHeader}>
          <h2>Nos Chiffres Clés</h2>
          <p>Découvrez l'impact de notre plateforme à travers ces statistiques</p>
        </div>
        
        <div className={styles.counterGrid}>
          <div className={styles.counter}>
            <div className={styles.counterIcon}>
              <FiUsers />
            </div>
            <h3>{counts.users}+</h3>
            <p>Utilisateurs Actifs</p>
            <span className={styles.counterLabel}>
              En croissance
            </span>
          </div>

          <div className={styles.counter}>
            <div className={styles.counterIcon}>
              <FiMap />
            </div>
            <h3>{counts.projects}+</h3>
            <p>Projets Réalisés</p>
            <span className={styles.counterLabel}>
              Succès
            </span>
          </div>

          <div className={styles.counter}>
            <div className={styles.counterIcon}>
              <FiSmile />
            </div>
            <h3>{counts.satisfaction}%</h3>
            <p>Satisfaction Client</p>
            <span className={styles.counterLabel}>
              Excellent
            </span>
          </div>

          <div className={styles.counter}>
            <div className={styles.counterIcon}>
              <FiGlobe />
            </div>
            <h3>{counts.partners}+</h3>
            <p>Partenaires</p>
            <span className={styles.counterLabel}>
              International
            </span>
          </div>
        </div>

        <div className={styles.statsFooter}>
          <a href="#contact" className={styles.statsCta}>
            <span>Commencer maintenant</span>
            <FiArrowRight className={styles.ctaIcon} />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Stats; 