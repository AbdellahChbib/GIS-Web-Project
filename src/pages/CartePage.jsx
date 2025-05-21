

import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import TileWMS from 'ol/source/TileWMS';
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
    const wmsLayer2D = new TileLayer({
      source: new TileWMS({
        url: 'http://localhost:3000/geoserver/webSig/wms?service=WMS&version=1.1.0&request=GetMap&layers=webSig%3Aehtpshp&bbox=-7.653261%2C33.545894%2C-7.647971%2C33.54987273389861&width=768&height=577&srs=EPSG%3A4326&styles=&format=application/openlayers',
        params: {
          'LAYERS': 'webSig:ehtpshp',
          'TILED': true,
        },
        serverType: 'geoserver',
        transition: 0,
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


    const initialMap = new Map({
  target: mapRef.current,
  layers: [baseLayer, wmsLayer2D], // ici tu utilises ta nouvelle couche
  view: new View({
    center: fromLonLat([-7.650788, 33.547011]),
    zoom: 17,
  }),
});

    

    // Sauvegarder la carte et les couches
    setMap({
   initialMap,
  baseLayer,
    wmsLayer2D, // remplace l'ancien nom
  vectorLayer3D,
});

  }, []);

  // Toggle 2D <-> 3D
  const handleToggle = () => {
    if (!map) return;

    const {initialMap,  wmsLayer2D, vectorLayer3D } = map;

    // Supprimer toutes les couches sauf le fond
    const baseLayer = initialMap.getLayers().item(0);
    initialMap.setLayers([baseLayer]);

    if (!is3D) {
      initialMap.addLayer(vectorLayer3D);
    } else {
      initialMap.addLayer(wmsLayer2D);
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
