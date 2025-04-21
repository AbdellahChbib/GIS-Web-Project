import { useEffect, useRef } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

 


function CartePage() {
  const mapRef = useRef(null);

  useEffect(() => {
    new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
            source: new XYZ({
              url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
              attributions: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            })
          })
      ],
      view: new View({
        center: [-7.650788, 33.547011], // Coordonnées de l’EHTP (EPSG:4326)  


        zoom: 16,
        projection: 'EPSG:4326',
      }),
    });
  }, []);

  return (
    <div>
      <h2>Carte de l’EHTP</h2>
      <div ref={mapRef} style={{ width: '100%', height: '80vh' }}></div>
    </div>
  );
}

export default CartePage;
