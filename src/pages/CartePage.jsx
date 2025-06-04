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
import GeoJSON from 'ol/format/GeoJSON';

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
  const [measureOverlays, setMeasureOverlays] = useState([]);
  const [popupOverlay, setPopupOverlay] = useState(null);
  const popupRef = useRef(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [highlightLayer, setHighlightLayer] = useState(null);
  const [hoverOverlay, setHoverOverlay] = useState(null);
  const hoverRef = useRef(null);

  // Style de surbrillance amélioré
  const highlightStyle = new Style({
    fill: new Fill({
      color: 'rgba(0, 123, 255, 0.3)'  // Bleu semi-transparent
    }),
    stroke: new Stroke({
      color: '#007bff',  // Bleu plus foncé pour le contour
      width: 3
    })
  });

  // Style de surbrillance pour le hover
  const hoverStyle = new Style({
    fill: new Fill({
      color: 'rgba(0, 153, 255, 0.4)'  // Bleu plus vif et plus opaque
    }),
    stroke: new Stroke({
      color: '#0099ff',  // Bleu vif
      width: 3,          // Bordure plus épaisse
      lineDash: null     // Ligne continue
    }),
    zIndex: 2           // S'assurer que c'est au-dessus des autres couches
  });

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

  // Fonction pour nettoyer toutes les mesures 2D
  const clearAllMeasurements = () => {
    // Nettoyer la source
    measureSource.clear();
    
    // Supprimer toutes les interactions de mesure
    if (olMap) {
      olMap.getInteractions().forEach((interaction) => {
        if (interaction instanceof Draw) {
          olMap.removeInteraction(interaction);
        }
      });
    }

    // Supprimer tous les overlays de mesure
    measureOverlays.forEach(overlay => {
      if (olMap) {
        olMap.removeOverlay(overlay);
      }
    });
    setMeasureOverlays([]);
  };

  // Fonction pour activer la mesure 2D
  const activateMeasure2D = (type) => {
    if (!olMap) return;

    // Si on clique sur le même type de mesure, on désactive
    if (type === measureType) {
      clearAllMeasurements();
      setMeasureType(null);
      return;
    }

    // Nettoyer les mesures précédentes
    clearAllMeasurements();
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
      setMeasureOverlays(prev => [...prev, measureTooltip]);
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
    if (scene.activeHandler) {
      scene.activeHandler.destroy();
      scene.activeHandler = undefined;
    }

    // Nettoyer les entités de mesure existantes
    scene.entities.removeAll();

    if (type === measureType) {
      setMeasureType(null);
      return;
    }

    setMeasureType(type);

    // Créer un gestionnaire d'événements pour la mesure
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    scene.activeHandler = handler;

    if (type === 'distance3D') {
      let positions = [];
      let polyline;
      let label;

      handler.setInputAction((click) => {
        const cartesian = scene.camera.pickEllipsoid(
          click.position,
          scene.globe.ellipsoid
        );

        if (cartesian) {
          positions.push(cartesian);

          if (positions.length === 1) {
            polyline = scene.entities.add({
              polyline: {
                positions: positions,
                width: 2,
                material: Cesium.Color.YELLOW
              }
            });
          } else if (positions.length === 2) {
            const distance = Cesium.Cartesian3.distance(positions[0], positions[1]);
            const midpoint = Cesium.Cartesian3.midpoint(
              positions[0],
              positions[1],
              new Cesium.Cartesian3()
            );

            label = scene.entities.add({
              position: midpoint,
              label: {
                text: `${Math.round(distance)} m`,
                font: '14px sans-serif',
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
              }
            });

            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // Ajouter un gestionnaire de clic droit pour annuler la mesure
    handler.setInputAction(() => {
      scene.entities.removeAll();
      handler.destroy();
      scene.activeHandler = undefined;
      setMeasureType(null);
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  };

  // Fonction pour formater le nom de fichier
  const formatImageFileName = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')     // Remplace les espaces par des tirets
      .replace(/[^a-z0-9-]/g, '') // Enlève les caractères spéciaux
      .trim();
  };

  // Fonction pour vérifier si une image existe
  const getImageUrl = (name) => {
    const baseImagePath = '/images/entities/';
    const formattedName = formatImageFileName(name);
    
    // Liste des extensions d'image à essayer
    const extensions = ['jpg', 'jpeg', 'png'];
    
    // On retourne le chemin de l'image avec la première extension trouvée
    for (const ext of extensions) {
      const imagePath = `${baseImagePath}${formattedName}.${ext}`;
      try {
        // On vérifie si l'image existe en essayant de la charger
        const img = new Image();
        img.src = imagePath;
        return imagePath;
      } catch (error) {
        console.log(`Image non trouvée avec l'extension ${ext}`);
        continue;
      }
    }
    
    // Image par défaut si aucune image correspondante n'est trouvée
    return '/images/entities/default.jpg';
  };

  useEffect(() => {
    // Configuration de la source WMS principale
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

    // Configuration de la source WMS pour le hover
    const hoverWmsSource = new ImageWMS({
      url: '/geoserver/webSig/wms',
      params: {
        'LAYERS': 'webSig:ehtpshp',
        'FORMAT': 'image/png',
        'TRANSPARENT': true,
        'STYLES': 'highlight',  // Style de surbrillance défini dans GeoServer
        'CQL_FILTER': 'FALSE'   // Par défaut, ne montre rien
      },
      serverType: 'geoserver',
      crossOrigin: 'anonymous'
    });

    // Couche de fond OSM
    const baseLayer = new TileLayer({
      source: new OSM(),
    });

    // Couche WMS principale
    const wmsLayer = new ImageLayer({
      source: wmsSource,
      zIndex: 1
    });

    // Couche WMS pour le hover
    const hoverLayer = new ImageLayer({
      source: hoverWmsSource,
      zIndex: 2
    });

    // Création de la carte 2D
    const ol2d = new Map({
      target: mapRef.current,
      layers: [baseLayer, wmsLayer, hoverLayer],
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

    // Création de la popup
    const popup = new Overlay({
      element: popupRef.current,
      positioning: 'bottom-center',
      stopEvent: false,
      offset: [0, -10]
    });
    setPopupOverlay(popup);
    ol2d.addOverlay(popup);

    // Création de la couche de surbrillance avec le nouveau style
    const highlight = new VectorLayer({
      source: new VectorSource(),
      style: highlightStyle,
      zIndex: 1
    });
    setHighlightLayer(highlight);
    ol2d.addLayer(highlight);

    // Variable pour stocker l'ID de la feature actuellement survolée
    let currentHoverFeatureId = null;

    // Gestionnaire de survol
    ol2d.on('pointermove', async (evt) => {
      if (is3D) return;

      const coordinate = evt.coordinate;
      
      // Créer une petite zone autour du point de survol
      const buffer = 5;
      const bbox = [
        coordinate[0] - buffer,
        coordinate[1] - buffer,
        coordinate[0] + buffer,
        coordinate[1] + buffer
      ].join(',');

      // Construire l'URL WFS
      const wfsUrl = '/geoserver/webSig/ows?' +
        'service=WFS&' +
        'version=1.0.0&' +
        'request=GetFeature&' +
        'typeName=webSig:ehtpshp&' +
        'outputFormat=application/json&' +
        'srsName=EPSG:3857&' +
        `bbox=${bbox},EPSG:3857`;

      try {
        const response = await fetch(wfsUrl);
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const feature = data.features[0];
          const featureId = feature.id || feature.properties?.id;
          
          if (currentHoverFeatureId === featureId) {
            return;
          }
          
          currentHoverFeatureId = featureId;
          ol2d.getViewport().style.cursor = 'pointer';

          // Mettre à jour le filtre de la couche de hover
          if (featureId) {
            hoverWmsSource.updateParams({
              'CQL_FILTER': `id = '${featureId}'`
            });
          }

          // Afficher le popup
          if (feature.properties) {
            const name = feature.properties.name || feature.properties.nom || 
                        feature.properties.NAME || feature.id || 'Sans nom';
            
            const imageUrl = getImageUrl(name);
            
            const popupContent = `
              <div class="popup-content">
                <div class="popup-header">
                  <h3>${name}</h3>
                </div>
                <div class="popup-image">
                  <img src="${imageUrl}" 
                       alt="${name}"
                       onerror="this.src='/images/entities/default.jpg';" />
                </div>
                <div class="popup-info">
                  ${feature.properties.description || ''}
                </div>
              </div>
            `;

            if (popupRef.current) {
              popupRef.current.innerHTML = popupContent;
              popup.setPosition(coordinate);
            }
          }
        } else {
          currentHoverFeatureId = null;
          ol2d.getViewport().style.cursor = '';
          popup.setPosition(undefined);
          // Réinitialiser le filtre de la couche de hover
          hoverWmsSource.updateParams({
            'CQL_FILTER': 'FALSE'
          });
        }
      } catch (error) {
        currentHoverFeatureId = null;
        console.error('Erreur lors de la requête WFS pour le hover:', error);
        popup.setPosition(undefined);
        // Réinitialiser le filtre de la couche de hover
        hoverWmsSource.updateParams({
          'CQL_FILTER': 'FALSE'
        });
      }
    });

    // Gestionnaire pour effacer le hover quand la souris quitte la carte
    ol2d.getViewport().addEventListener('mouseout', () => {
      currentHoverFeatureId = null;
      ol2d.getViewport().style.cursor = '';
      popup.setPosition(undefined);
      // Réinitialiser le filtre de la couche de hover
      hoverWmsSource.updateParams({
        'CQL_FILTER': 'FALSE'
      });
    });

    // Mettre à jour les styles CSS
    const style = document.createElement('style');
    style.textContent = `
      .ol-popup {
        position: absolute;
        background-color: white;
        box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        padding: 0;
        border-radius: 6px;
        border: none;
        min-width: 280px;
        max-width: 400px;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1000;
        transition: opacity 0.2s ease-in-out;
        animation: popupFadeIn 0.2s ease-out;
      }

      .popup-content {
        overflow: hidden;
        max-height: calc(80vh - 40px);
      }

      .popup-header {
        background-color: #2c3e50;
        color: white;
        padding: 15px;
        border-radius: 6px 6px 0 0;
      }

      .popup-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 500;
        color: white;
      }

      .popup-image {
        width: 100%;
        height: 200px;
        overflow: hidden;
        position: relative;
        border-bottom: 1px solid #eee;
      }

      .popup-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .popup-info {
        padding: 15px;
        font-size: 14px;
        color: #333;
        line-height: 1.5;
      }

      /* Style de la barre de défilement */
      .ol-popup::-webkit-scrollbar {
        width: 8px;
      }

      .ol-popup::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      .ol-popup::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .ol-popup::-webkit-scrollbar-thumb:hover {
        background: #555;
      }

      /* Animation d'apparition du popup */
      .ol-popup {
        animation: popupFadeIn 0.3s ease-out;
      }

      @keyframes popupFadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .hover-popup {
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 4px;
        color: white;
        padding: 8px 12px;
        font-size: 14px;
        pointer-events: none;
        white-space: nowrap;
        transform: translateY(-5px);
        animation: hoverFadeIn 0.2s ease-out;
      }

      .hover-content {
        margin: 0;
      }

      .hover-content span {
        font-weight: 500;
      }

      @keyframes hoverFadeIn {
        from {
          opacity: 0;
          transform: translateY(0);
        }
        to {
          opacity: 1;
          transform: translateY(-5px);
        }
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      clearAllMeasurements();
      if (ol3d) {
        const scene = ol3d.getCesiumScene();
        if (scene && scene.activeHandler) {
          scene.activeHandler.destroy();
          scene.entities.removeAll();
        }
      }
      if (tileset && scene) {
        scene.primitives.remove(tileset);
      }
      ol2d.setTarget(null);
      if (popup) {
        ol2d.removeOverlay(popup);
      }
      if (highlight) {
        ol2d.removeLayer(highlight);
      }
      if (hoverLayer) {
        ol2d.removeLayer(hoverLayer);
      }
      currentHoverFeatureId = null;
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
      >
        <div ref={popupRef} className="ol-popup"></div>
        <div ref={hoverRef} className="ol-popup hover-popup"></div>
      </div>
    </div>
  );
}

export default CartePage;





 