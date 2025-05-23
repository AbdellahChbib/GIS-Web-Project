import React from 'react';
import { 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiFacebook, 
  FiTwitter, 
  FiLinkedin,
  FiInfo,
  FiGrid,
  FiMessageSquare,
  FiHeart
} from 'react-icons/fi';
import styles from '../styles/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>
            <FiInfo className={styles.sectionIcon} aria-hidden="true" />
            À propos
          </h3>
          <p>
            GIS-WEB est une plateforme innovante de gestion des informations
            spatiales, conçue pour répondre aux besoins des professionnels
            du secteur. Notre solution combine technologie de pointe et
            facilité d'utilisation.
          </p>
        </div>

        <div className={styles.footerSection}>
          <h3>
            <FiGrid className={styles.sectionIcon} aria-hidden="true" />
            Liens Rapides
          </h3>
          <ul className={styles.footerLinks}>
            <li>
              <a href="/about" aria-label="En savoir plus sur GIS-WEB">
                <span className={styles.linkIcon} aria-hidden="true">→</span>
                À propos
              </a>
            </li>
            <li>
              <a href="/services" aria-label="Découvrir nos services">
                <span className={styles.linkIcon} aria-hidden="true">→</span>
                Services
              </a>
            </li>
            <li>
              <a href="/contact" aria-label="Nous contacter">
                <span className={styles.linkIcon} aria-hidden="true">→</span>
                Contact
              </a>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h3>
            <FiMessageSquare className={styles.sectionIcon} aria-hidden="true" />
            Contact
          </h3>
          <ul className={styles.footerLinks}>
            <li>
              <a href="mailto:contact@gisweb.com" aria-label="Envoyer un email">
                <FiMail className={styles.contactIcon} aria-hidden="true" />
                contact@gisweb.com
              </a>
            </li>
            <li>
              <a href="tel:+212522000000" aria-label="Nous appeler">
                <FiPhone className={styles.contactIcon} aria-hidden="true" />
                +212 522 00 00 00
              </a>
            </li>
            <li>
              <a 
                href="https://goo.gl/maps/EHTP" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Voir notre localisation"
              >
                <FiMapPin className={styles.contactIcon} aria-hidden="true" />
                EHTP, Casablanca
              </a>
            </li>
          </ul>
          <div className={styles.socialLinks}>
            <a 
              href="https://facebook.com/gisweb" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur Facebook"
            >
              <FiFacebook aria-hidden="true" />
            </a>
            <a 
              href="https://twitter.com/gisweb" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur Twitter"
            >
              <FiTwitter aria-hidden="true" />
            </a>
            <a 
              href="https://linkedin.com/company/gisweb" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Suivez-nous sur LinkedIn"
            >
              <FiLinkedin aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {currentYear} GIS-WEB. Tous droits réservés.</p>
        <p className={styles.credits}>
          Conçu avec <FiHeart className={styles.heartIcon} aria-hidden="true" /> par{' '}
          <a 
            href="/team"
            aria-label="En savoir plus sur notre équipe"
          >
            Notre équipe
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 