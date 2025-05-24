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
  const [olMap, setOlMap] = useState(null);

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

    setOlMap(ol2d);

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
    
    if (newIs3D && tileset) {
      const scene = ol3d.getCesiumScene();
      if (scene && tileset.boundingSphere) {
        setTimeout(() => {
          scene.camera.viewBoundingSphere(
            tileset.boundingSphere, 
            new Cesium.HeadingPitchRange(0, -0.5, 100)
          );
        }, 100);
      }
    } else if (!newIs3D && olMap) {
      // Utilisation de la référence stockée à la carte
      olMap.getView().animate({
        center: fromLonLat([-7.650788, 33.547011]),
        zoom: 17,
        duration: 200
      });
    }
    
    setIs3D(newIs3D);
  };

  return (
    <div>
      <h2>Carte de l'EHTP - 2D / 3D Switch</h2>
      
      <div style={{ margin: '10px' }}>
        <div 
          style={{ 
            display: 'inline-flex',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            padding: '2px',
            border: '1px solid #ddd'
          }}
        >
          <button 
            onClick={handleToggle}
            disabled={loading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: !is3D ? '#6b46c1' : 'transparent',
              color: !is3D ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              minWidth: '60px'
            }}
          >
            2D
          </button>
          <button 
            onClick={handleToggle}
            disabled={loading}
            style={{ 
              padding: '8px 16px',
              backgroundColor: is3D ? '#6b46c1' : 'transparent',
              color: is3D ? 'white' : '#666',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              minWidth: '60px'
            }}
          >
            3D
          </button>
        </div>
        
        {error && (
          <span style={{ color: '#ff6b6b', fontSize: '14px' }}>
            {error}
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





 