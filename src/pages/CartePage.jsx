import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import OLCesium from 'olcs';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Configuration globale de Cesium
window.Cesium = Cesium;

function CartePage() {
  const mapRef = useRef();
  const [ol3d, setOl3d] = useState(null);
  const [is3D, setIs3D] = useState(false);
  const [tileset, setTileset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Configuration de la source WMS
    const wmsSource = new ImageWMS({
      url: '/geoserver/webSig/wms',
      params: {
        'LAYERS': 'webSig:ehtpshp',
        'FORMAT': 'image/png',
        'TRANSPARENT': true
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    });

    // Couche de fond OSM
    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    // Couche WMS
    const wmsLayer = new ImageLayer({
      source: wmsSource
    });

    // Création de la carte 2D
    const ol2d = new Map({
      target: mapRef.current,
      layers: [baseLayer, wmsLayer],
      view: new View({
        center: fromLonLat([-7.650788, 33.547011]),
        zoom: 17,
      }),
    });

    // Configuration d'OLCesium
    const ol3dInstance = new OLCesium({
      map: ol2d,
      time() {
        return Cesium.JulianDate.now();
      }
    });

    // Configuration de la scène Cesium
    const scene = ol3dInstance.getCesiumScene();
    if (scene) {
      // Configuration optionnelle de la scène 3D
      scene.globe.enableLighting = true;
      
      // Fonction pour charger le tileset 3D
      const loadTileset = async () => {
        setLoading(true);
        setError(null);
        
        try {
          // URLs à tester dans l'ordre de priorité
          const tilesetUrls = [
            'public/3D/tileset.json', // Votre tileset local
             
          ];

          let tileset3D = null;
          let urlUsed = null;

          // Essayer chaque URL jusqu'à ce qu'une fonctionne
          for (const url of tilesetUrls) {
            try {
              console.log(`Tentative de chargement du tileset depuis: ${url}`);
              
              tileset3D = await Cesium.Cesium3DTileset.fromUrl(url, {
                maximumScreenSpaceError: 16,
                maximumNumberOfLoadedTiles: 1000,
                skipLevelOfDetail: true,
                baseScreenSpaceError: 1024,
                skipScreenSpaceErrorFactor: 16,
                skipLevels: 1,
                immediatelyLoadDesiredLevelOfDetail: false,
                loadSiblings: false,
                cullWithChildrenBounds: true
              });

              if (tileset3D) {
                urlUsed = url;
                console.log(`Tileset chargé avec succès depuis: ${url}`);
                break;
              }
            } catch (urlError) {
              console.warn(`Impossible de charger le tileset depuis ${url}:`, urlError);
              continue;
            }
          }

          if (!tileset3D) {
            throw new Error('Aucun tileset 3D n\'a pu être chargé depuis les URLs disponibles');
          }

          // Ajouter le tileset à la scène
          scene.primitives.add(tileset3D);
          
          // Attendre que le tileset soit prêt
          await tileset3D.readyPromise;
          
          console.log('Tileset 3D prêt et ajouté à la scène');
          
          // Centrer la vue sur le tileset
          if (tileset3D.boundingSphere) {
            scene.camera.viewBoundingSphere(
              tileset3D.boundingSphere, 
              new Cesium.HeadingPitchRange(0, -0.5, 0)
            );
          }
          
          setTileset(tileset3D);
          
        } catch (error) {
          console.error('Erreur lors du chargement du tileset 3D:', error);
          setError(`Erreur de chargement: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };

      // Charger le tileset de manière asynchrone
      loadTileset();
    }

    setOl3d(ol3dInstance);

    // Cleanup
    return () => {
      if (ol3dInstance) {
        ol3dInstance.setEnabled(false);
      }
      if (tileset && scene) {
        scene.primitives.remove(tileset);
      }
      ol2d.setTarget(null);
    };
  }, []);

  // Toggle entre 2D et 3D
  const handleToggle = () => {
    if (!ol3d) return;

    const newIs3D = !is3D;
    ol3d.setEnabled(newIs3D);
    
    // Si on passe en 3D et qu'un tileset existe, centrer la vue dessus
    if (newIs3D && tileset) {
      const scene = ol3d.getCesiumScene();
      if (scene && tileset.boundingSphere) {
        // Petit délai pour laisser la 3D s'initialiser
        setTimeout(() => {
          scene.camera.viewBoundingSphere(
            tileset.boundingSphere, 
            new Cesium.HeadingPitchRange(0, -0.5, 100)
          );
        }, 100);
      }
    }
    
    setIs3D(newIs3D);
  };

  return (
    <div>
      <h2>Carte de l'EHTP - 2D / 3D Switch</h2>
      
      <div style={{ margin: '10px' }}>
        <button 
          onClick={handleToggle} 
          disabled={loading}
          style={{ 
            padding: '10px 20px',
            backgroundColor: is3D ? '#ff6b6b' : '#4ecdc4',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            marginRight: '10px'
          }}
        >
          {loading ? 'Chargement...' : (is3D ? 'Passer en 2D' : 'Passer en 3D')}
        </button>
        
        {loading && (
          <span style={{ color: '#666' }}>
            Chargement du tileset 3D...
          </span>
        )}
        
        {error && (
          <span style={{ color: '#ff6b6b', fontSize: '14px' }}>
            {error}
          </span>
        )}
        
        {tileset && !loading && (
          <span style={{ color: '#4ecdc4', fontSize: '14px' }}>
            ✓ Tileset 3D chargé
          </span>
        )}
      </div>
      
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '80vh',
          border: '1px solid #ccc'
        }}
      ></div>
    </div>
  );
}

export default CartePage;





/* import { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import OLCesium from 'olcs';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Configuration globale de Cesium
window.Cesium = Cesium;

function CartePage() {
  const mapRef = useRef();
  const [ol3d, setOl3d] = useState(null);
  const [is3D, setIs3D] = useState(false);
  const [tileset, setTileset] = useState(null);

  useEffect(() => {
    // Configuration de la source WMS
    const wmsSource = new ImageWMS({
      url: '/geoserver/webSig/wms',
      params: {
        'LAYERS': 'webSig:ehtpshp',
        'FORMAT': 'image/png',
        'TRANSPARENT': true
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    });

    // Couche de fond OSM
    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    // Couche WMS
    const wmsLayer = new ImageLayer({
      source: wmsSource
    });

    // Création de la carte 2D
    const ol2d = new Map({
      target: mapRef.current,
      layers: [baseLayer, wmsLayer],
      view: new View({
        center: fromLonLat([-7.650788, 33.547011]),
        zoom: 17,
      }),
    });

    // Configuration d'OLCesium
    const ol3dInstance = new OLCesium({
      map: ol2d,
      time() {
        return Cesium.JulianDate.now();
      }
    });

    // Configuration de la scène Cesium
    const scene = ol3dInstance.getCesiumScene();
    if (scene) {
      // Configuration optionnelle de la scène 3D
      scene.globe.enableLighting = true;
      
      // TEST avec un tileset d'exemple (remplacez par votre URL plus tard)
      try {
        const tileset3D = new Cesium.Cesium3DTileset({
          url: 'https://cesium.com/public/SandcastleSampleData/Cesium3DTiles/Tilesets/Tileset/tileset.json',
          // Ou essayez avec votre fichier local :
          // url: '/tileset.json',
          maximumScreenSpaceError: 16,
          maximumNumberOfLoadedTiles: 1000,
        });
        
        scene.primitives.add(tileset3D);
        
        if (tileset3D.readyPromise) {
          tileset3D.readyPromise.then((tileset) => {
            console.log('Tileset 3D chargé avec succès');
            if (tileset.boundingSphere) {
              scene.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
            }
            setTileset(tileset);
          }).catch((error) => {
            console.error('Erreur lors du chargement du tileset 3D:', error);
          });
        } else {
          console.warn('ReadyPromise non disponible pour le tileset');
          setTileset(tileset3D);
        }
      } catch (error) {
        console.error('Erreur lors de la création du tileset 3D:', error);
      }
    }

    setOl3d(ol3dInstance);

    // Cleanup
    return () => {
      if (ol3dInstance) {
        ol3dInstance.setEnabled(false);
      }
      if (tileset && scene) {
        scene.primitives.remove(tileset);
      }
      ol2d.setTarget(null);
    };
  }, []);

  // Toggle entre 2D et 3D
  const handleToggle = () => {
    if (!ol3d) return;

    const newIs3D = !is3D;
    ol3d.setEnabled(newIs3D);
    
    // Si on passe en 3D et qu'un tileset existe, centrer la vue dessus
    if (newIs3D && tileset) {
      const scene = ol3d.getCesiumScene();
      if (scene) {
        // Petit délai pour laisser la 3D s'initialiser
        setTimeout(() => {
          scene.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 100));
        }, 100);
      }
    }
    
    setIs3D(newIs3D);
  };

  return (
    <div>
      <h2>Carte de l'EHTP - 2D / 3D Switch</h2>
      <button 
        onClick={handleToggle} 
        style={{ 
          margin: '10px', 
          padding: '10px',
          backgroundColor: is3D ? '#ff6b6b' : '#4ecdc4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        {is3D ? 'Passer en 2D' : 'Passer en 3D'}
      </button>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '80vh',
          border: '1px solid #ccc'
        }}
      ></div>
    </div>
  );
}

export default CartePage;


 */

/*  

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
  */