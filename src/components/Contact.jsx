import React, { useState, useEffect, useRef } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiUser, FiMessageSquare } from 'react-icons/fi';
import styles from '../styles/ContactSection.module.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({
    message: '',
    type: '' // 'success' ou 'error'
  });
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.name.trim()) {
      setFormStatus({
        message: 'Veuillez entrer votre nom',
        type: 'error'
      });
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      setFormStatus({
        message: 'Veuillez entrer une adresse email valide',
        type: 'error'
      });
      return false;
    }
    if (!formData.message.trim()) {
      setFormStatus({
        message: 'Veuillez entrer votre message',
        type: 'error'
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // Simuler l'envoi du formulaire
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormStatus({
        message: 'Message envoyé avec succès !',
        type: 'success'
      });
      
      setFormData({
        name: '',
        email: '',
        message: ''
      });

      setTimeout(() => {
        setFormStatus({
          message: '',
          type: ''
        });
      }, 5000);
    } catch (error) {
      setFormStatus({
        message: 'Une erreur est survenue. Veuillez réessayer.',
        type: 'error'
      });
    }
  };

  return (
    <section 
      className={`${styles.contactSection} ${isVisible ? styles.visible : ''}`}
      id="contact"
      ref={sectionRef}
      aria-label="Formulaire de contact"
    >
      <div className={styles.contactContainer}>
        <div className={styles.contactHeader}>
          <h2>Contactez-nous</h2>
          <p>Nous sommes là pour répondre à vos questions et vous accompagner dans vos projets</p>
        </div>

        <div className={styles.contactContent}>
          <div className={styles.contactInfo} role="complementary" aria-label="Informations de contact">
            <div className={styles.infoCard}>
              <FiMail className={styles.infoIcon} aria-hidden="true" />
              <h3>Email</h3>
              <a href="mailto:contact@gisweb.com" aria-label="Nous envoyer un email">contact@gisweb.com</a>
            </div>
            <div className={styles.infoCard}>
              <FiPhone className={styles.infoIcon} aria-hidden="true" />
              <h3>Téléphone</h3>
              <a href="tel:+212522000000" aria-label="Nous appeler">+212 522 00 00 00</a>
            </div>
            <div className={styles.infoCard}>
              <FiMapPin className={styles.infoIcon} aria-hidden="true" />
              <h3>Adresse</h3>
              <p>Km 7, Route El Jadida, Casablanca</p>
            </div>
          </div>

          <div className={styles.contactForm}>
            <form onSubmit={handleSubmit} aria-label="Formulaire de contact">
              <div className={styles.formGroup}>
                <div className={styles.inputIcon}>
                  <FiUser aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  aria-required="true"
                  aria-label="Votre nom"
                  aria-invalid={formStatus.type === 'error' && !formData.name}
                />
                <label htmlFor="name">Votre Nom</label>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.inputIcon}>
                  <FiMail aria-hidden="true" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  aria-required="true"
                  aria-label="Votre email"
                  aria-invalid={formStatus.type === 'error' && !formData.email}
                />
                <label htmlFor="email">Votre Email</label>
              </div>

              <div className={styles.formGroup}>
                <div className={styles.inputIcon}>
                  <FiMessageSquare aria-hidden="true" />
                </div>
                <textarea
                  name="message"
                  id="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder=" "
                  required
                  rows="5"
                  aria-required="true"
                  aria-label="Votre message"
                  aria-invalid={formStatus.type === 'error' && !formData.message}
                ></textarea>
                <label htmlFor="message">Votre Message</label>
              </div>

              {formStatus.message && (
                <div 
                  className={`${styles.formMessage} ${styles[formStatus.type]}`}
                  role="alert"
                  aria-live="polite"
                >
                  {formStatus.message}
                </div>
              )}

              <button 
                type="submit" 
                className={styles.submitButton}
                aria-label="Envoyer le message"
              >
                <span>Envoyer le message</span>
                <FiSend className={styles.submitIcon} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact; 