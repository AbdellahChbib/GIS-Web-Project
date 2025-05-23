import React from 'react';
import Card from './Card';
import sigImg from '../assets/SIG.jpg';
import infoImg from '../assets/GI.jpg';
import civilImg from '../assets/Civil.jpg';
import elecImg from '../assets/GE.jpg';
import meteoImg from '../assets/Météo.jpg';
import hydroImg from '../assets/IHE.jpg';
import logistiqueImg from '../assets/GLT.jpg';

const CardGrid = () => (
  <section className="content">
    <h2>Nos Sections</h2>
    <div className="card-grid">
      <Card
        title="Sciences d'information géographique"
        description="Elle enseigne aux étudiants à collecter, analyser et exploiter des données spatiales à l’aide de systèmes d’information géographique (SIG) pour la gestion du territoire et la prise de décision."
        image={sigImg}
      />
      <Card
        title="Génie Informatique"
        description="Cette filière forme des ingénieurs capables de concevoir, développer et maintenir des systèmes informatiques performants et innovants, en réponse aux besoins des entreprises et de la société."
        image={infoImg}
      />
      <Card
        title="Génie Civil"
        description="Elle prépare les étudiants à concevoir, construire et entretenir les infrastructures comme les bâtiments, les routes, les ponts ou les barrages, en intégrant les normes de sécurité et de durabilité."
        image={civilImg}
      />
      <Card
        title="Génie Électrique"
        description="Les étudiants de cette filière apprennent à maîtriser la production, la distribution et l’utilisation de l’énergie électrique dans divers secteurs industriels et technologiques."
        image={elecImg}
      />
      <Card
        title="Météorologie"
        description="Cette filière forme des spécialistes de l’analyse et de la prévision des phénomènes atmosphériques, essentiels pour la sécurité, l’agriculture, l’environnement et l’aéronautique."
        image={meteoImg}
      />
      <Card
        title="Génie Hydraulique, Environnement et Ville"
        description="Cette spécialité forme des ingénieurs à la gestion des ressources en eau, à l’aménagement urbain durable et à la protection de l’environnement."
        image={hydroImg}
      />
      <Card
        title="Génie Logistique et Transports"
        description="Cette filière prépare les futurs ingénieurs à optimiser les flux de marchandises, d’informations et de personnes, en concevant des systèmes logistiques et de transport efficaces et durables."
        image={logistiqueImg}
      />
    </div>
  </section>
);

export default CardGrid;