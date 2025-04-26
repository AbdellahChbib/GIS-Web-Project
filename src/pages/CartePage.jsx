

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { fromLonLat } from 'ol/proj';

function CartePage() {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [is3D, setIs3D] = useState(false);

  useEffect(() => {
    // Fond de carte OSM
    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    // Couche 2D (exemple : un point simple)
    const feature2D = new Feature({
      geometry: new Point(fromLonLat([-7.650788, 33.547011])),
    });
    feature2D.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: 'blue' }),
          stroke: new Stroke({ color: 'white', width: 2 }),
        }),
      })
    );
    const vectorLayer2D = new VectorLayer({
      source: new VectorSource({
        features: [feature2D],
      }),
    });

    // Couche 3D simulée (autre style, autre point ou forme)
    const feature3D = new Feature({
      geometry: new Point(fromLonLat([-7.650788, 33.547011])),
    });
    feature3D.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 10,
          fill: new Fill({ color: 'red' }),
          stroke: new Stroke({ color: 'yellow', width: 2 }),
        }),
      })
    );
    const vectorLayer3D = new VectorLayer({
      source: new VectorSource({
        features: [feature3D],
      }),
    });

    // Initialiser la carte avec couche 2D
    const initialMap = new Map({
      target: mapRef.current,
      layers: [baseLayer, vectorLayer2D],
      view: new View({
        center: fromLonLat([-7.650788, 33.547011]),
        zoom: 17,
      }),
    });

    // Sauvegarder la carte et les couches
    setMap({
      olMap: initialMap,
      baseLayer,
      vectorLayer2D,
      vectorLayer3D,
    });
  }, []);

  // Toggle 2D <-> 3D
  const handleToggle = () => {
    if (!map) return;

    const { olMap, vectorLayer2D, vectorLayer3D } = map;

    // Supprimer toutes les couches sauf le fond
    const baseLayer = olMap.getLayers().item(0);
    olMap.setLayers([baseLayer]);

    if (!is3D) {
      olMap.addLayer(vectorLayer3D);
    } else {
      olMap.addLayer(vectorLayer2D);
    }

    setIs3D(!is3D);
  };

  return (
    <div>
      <h2>Carte de l’EHTP - 2D / 3D Switch</h2>
      <button onClick={handleToggle} style={{ margin: '10px', padding: '10px' }}>
        {is3D ? 'Afficher la couche 2D' : 'Afficher la couche 3D'}
      </button>
      <div ref={mapRef} style={{ width: '100%', height: '80vh' }}></div>
    </div>
  );
}

export default CartePage;
