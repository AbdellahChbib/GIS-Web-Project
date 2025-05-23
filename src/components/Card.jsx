import React from 'react';

const Card = ({ title, description, image }) => (
  <div className="card">
    <div className="card-image-container">
      <img 
        src={image} 
        alt={title} 
        className="card-image"
        loading="lazy"
      />
      <div className="image-overlay"></div>
    </div>
    <div className="card-content">
      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
    </div>
  </div>
);

export default Card;