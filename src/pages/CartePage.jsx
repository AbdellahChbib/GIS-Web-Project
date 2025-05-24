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
import { jsPDF } from 'jspdf';
import Draw from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import Overlay from 'ol/Overlay';

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [measureType, setMeasureType] = useState(null);
  const [showMeasureMenu, setShowMeasureMenu] = useState(false);
  const [measureSource] = useState(new VectorSource());
  const [measureLayer] = useState(new VectorLayer({
    source: measureSource,
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new Stroke({
        color: '#ffcc33',
        width: 2
      }),
      image: new CircleStyle({
        radius: 7,
        fill: new Fill({
          color: '#ffcc33'
        })
      })
    })
  }));

  // Fonction pour exporter la carte en image
  const exportAsImage = () => {
    if (!olMap) return;
    
    const canvas = document.querySelector('.ol-layer canvas');
    if (!canvas) return;

    // Créer un lien temporaire pour le téléchargement
    const link = document.createElement('a');
    link.download = 'carte-ehtp.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    setShowExportMenu(false);
  };

  // Fonction pour exporter la carte en PDF
  const exportAsPDF = () => {
    if (!olMap) return;
    
    const canvas = document.querySelector('.ol-layer canvas');
    if (!canvas) return;

    const pdf = new jsPDF('landscape');
    const imgData = canvas.toDataURL('image/png');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('carte-ehtp.pdf');
    setShowExportMenu(false);
  };

  // Fonction pour exporter la couche en GeoJSON
  const exportAsGeoJSON = async () => {
    try {
      const response = await fetch('/geoserver/webSig/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=webSig:ehtpshp&outputFormat=application/json');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ehtp.geojson';
      link.click();
      window.URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      setError('Erreur lors de l\'export en GeoJSON');
      console.error('Erreur GeoJSON:', error);
    }
  };

  // Fonction pour exporter la couche en Shapefile
  const exportAsShapefile = async () => {
    try {
      const response = await fetch('/geoserver/webSig/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=webSig:ehtpshp&outputFormat=SHAPE-ZIP');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ehtp.zip';
      link.click();
      window.URL.revokeObjectURL(url);
      setShowExportMenu(false);
    } catch (error) {
      setError('Erreur lors de l\'export en Shapefile');
      console.error('Erreur Shapefile:', error);
    }
  };

  // Fonction pour formater la mesure
  const formatMeasurement = (measurement, type) => {
    if (type === 'area') {
      return `${Math.round(measurement)} m²`;
    } else if (type === 'length') {
      return `${Math.round(measurement * 100) / 100} m`;
    }
    return '';
  };

  // Fonction pour activer la mesure 2D
  const activateMeasure2D = (type) => {
    if (!olMap) return;

    // Supprimer les anciennes mesures
    measureSource.clear();
    
    // Supprimer les anciennes interactions
    olMap.getInteractions().forEach((interaction) => {
      if (interaction instanceof Draw) {
        olMap.removeInteraction(interaction);
      }
    });

    if (type === measureType) {
      setMeasureType(null);
      return;
    }

    setMeasureType(type);
    
    const drawType = type === 'area' ? 'Polygon' : 'LineString';
    const draw = new Draw({
      source: measureSource,
      type: drawType,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.5)',
          lineDash: [10, 10],
          width: 2
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.7)'
          }),
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)'
          })
        })
      })
    });

    olMap.addInteraction(draw);

    let measureTooltipElement;
    let measureTooltip;

    const createMeasureTooltip = () => {
      if (measureTooltipElement) {
        measureTooltipElement.parentNode.removeChild(measureTooltipElement);
      }
      measureTooltipElement = document.createElement('div');
      measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
      measureTooltip = new Overlay({
        element: measureTooltipElement,
        offset: [0, -15],
        positioning: 'bottom-center',
        stopEvent: false,
        insertFirst: false
      });
      olMap.addOverlay(measureTooltip);
    };

    createMeasureTooltip();

    let sketch;
    draw.on('drawstart', (evt) => {
      sketch = evt.feature;
      let tooltipCoord = evt.coordinate;

      sketch.getGeometry().on('change', (evt) => {
        const geom = evt.target;
        let measurement;
        if (type === 'area') {
          measurement = getArea(geom);
          tooltipCoord = geom.getInteriorPoint().getCoordinates();
        } else {
          measurement = getLength(geom);
          tooltipCoord = geom.getLastCoordinate();
        }
        measureTooltipElement.innerHTML = formatMeasurement(measurement, type);
        measureTooltip.setPosition(tooltipCoord);
      });
    });

    draw.on('drawend', () => {
      measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
      measureTooltip.setOffset([0, -7]);
      sketch = null;
      measureTooltipElement = null;
      createMeasureTooltip();
    });
  };

  // Fonction pour activer la mesure 3D
  const activateMeasure3D = (type) => {
    if (!ol3d) return;
    
    const scene = ol3d.getCesiumScene();
    if (!scene) return;

    // Désactiver les mesures précédentes
    if (scene.measurementTools) {
      scene.measurementTools.forEach(tool => tool.destroy());
    }
    scene.measurementTools = [];

    if (type === measureType) {
      setMeasureType(null);
      return;
    }

    setMeasureType(type);

    if (type === 'distance3D') {
      const distanceMeasurement = new Cesium.MeasurementTools.DistanceMeasurement({
        scene: scene,
        units: Cesium.MeasurementUnits.METERS
      });
      scene.measurementTools = [distanceMeasurement];
    } else if (type === 'area3D') {
      const areaMeasurement = new Cesium.MeasurementTools.AreaMeasurement({
        scene: scene,
        units: Cesium.MeasurementUnits.SQUARE_METERS
      });
      scene.measurementTools = [areaMeasurement];
    } else if (type === 'volume3D') {
      const volumeMeasurement = new Cesium.MeasurementTools.VolumeMeasurement({
        scene: scene,
        units: Cesium.MeasurementUnits.CUBIC_METERS
      });
      scene.measurementTools = [volumeMeasurement];
    }
  };

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

    // Ajouter la couche de mesure
    ol2d.addLayer(measureLayer);

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
      <h2>Carte de l'EHTP</h2>
      
      <div style={{ margin: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Switch 2D/3D */}
        <div style={{ 
          display: 'inline-flex',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px',
          padding: '2px',
          border: '1px solid #ddd'
        }}>
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

        {/* Bouton de mesure */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMeasureMenu(!showMeasureMenu)}
            onBlur={() => setTimeout(() => setShowMeasureMenu(false), 200)}
            style={{
              padding: '8px 16px',
              backgroundColor: measureType ? '#4CAF50' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 'bold'
            }}
          >
            Mesurer
            <span style={{ fontSize: '12px', marginLeft: '5px' }}>▼</span>
          </button>
          
          {showMeasureMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 1000,
                minWidth: '200px',
                marginTop: '5px'
              }}
            >
              {!is3D ? (
                // Options de mesure 2D
                <>
                  <button
                    onClick={() => activateMeasure2D('length')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      backgroundColor: measureType === 'length' ? '#e3f2fd' : 'white',
                      color: '#333',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Mesurer une distance
                  </button>
                  <button
                    onClick={() => activateMeasure2D('area')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: measureType === 'area' ? '#e3f2fd' : 'white',
                      color: '#333',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Mesurer une surface
                  </button>
                </>
              ) : (
                // Options de mesure 3D
                <>
                  <button
                    onClick={() => activateMeasure3D('distance3D')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      backgroundColor: measureType === 'distance3D' ? '#e3f2fd' : 'white',
                      color: '#333',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Mesurer une distance 3D
                  </button>
                  <button
                    onClick={() => activateMeasure3D('area3D')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      borderBottom: '1px solid #eee',
                      backgroundColor: measureType === 'area3D' ? '#e3f2fd' : 'white',
                      color: '#333',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Mesurer une surface 3D
                  </button>
                  <button
                    onClick={() => activateMeasure3D('volume3D')}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: measureType === 'volume3D' ? '#e3f2fd' : 'white',
                      color: '#333',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Mesurer un volume
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bouton Exporter (visible uniquement en mode 2D) */}
        {!is3D && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 'bold'
              }}
            >
              Exporter
              <span style={{ fontSize: '12px', marginLeft: '5px' }}>▼</span>
            </button>
            
            {showExportMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '0',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  zIndex: 1000,
                  minWidth: '200px',
                  marginTop: '5px'
                }}
              >
                <button
                  onClick={exportAsImage}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    backgroundColor: 'white',
                    color: '#333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#333';
                  }}
                >
                  Exporter en PNG
                </button>
                <button
                  onClick={exportAsPDF}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    backgroundColor: 'white',
                    color: '#333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#333';
                  }}
                >
                  Exporter en PDF
                </button>
                <button
                  onClick={exportAsGeoJSON}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    borderBottom: '1px solid #eee',
                    backgroundColor: 'white',
                    color: '#333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#333';
                  }}
                >
                  Exporter en GeoJSON
                </button>
                <button
                  onClick={exportAsShapefile}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 16px',
                    border: 'none',
                    backgroundColor: 'white',
                    color: '#333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'normal'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f5f5f5';
                    e.target.style.color = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.color = '#333';
                  }}
                >
                  Exporter en Shapefile
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <span style={{ color: '#ff6b6b', fontSize: '14px', marginLeft: '10px' }}>
            {error}
          </span>
        )}
      </div>
      
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '80vh',
          border: '1px solid #ccc',
          marginTop: '10px'
        }}
      ></div>

      {/* Styles CSS pour les tooltips de mesure */}
      <style>
        {`
          .ol-tooltip {
            position: relative;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 4px;
            color: white;
            padding: 4px 8px;
            opacity: 0.7;
            white-space: nowrap;
            font-size: 12px;
          }
          .ol-tooltip-measure {
            opacity: 1;
            font-weight: bold;
          }
          .ol-tooltip-static {
            background-color: #ffcc33;
            color: black;
            border: 1px solid white;
          }
        `}
      </style>
    </div>
  );
}

export default CartePage;





 