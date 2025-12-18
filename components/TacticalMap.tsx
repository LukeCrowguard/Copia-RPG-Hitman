
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Grid, ZoomIn, ZoomOut, Move, Eye, EyeOff, Globe, Image as ImageIcon, MapPin, AlertTriangle } from 'lucide-react';
import { Mission } from '../types';

interface TacticalMapProps {
  mission: Mission | null;
  uploadedMap: string | null;
  onMapUpload: (image: string) => void;
}

// Extend Window interface to include google and auth failure hook
declare global {
  interface Window {
    google: any;
    gm_authFailure?: () => void;
    [key: string]: any; // Allow dynamic callback names
  }
}

// Estilo Dark/Tactical para o Google Maps
const MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

const TacticalMap: React.FC<TacticalMapProps> = ({ mission, uploadedMap, onMapUpload }) => {
  const activeMap = uploadedMap || mission?.imageUrl || null;
  
  const [viewMode, setViewMode] = useState<'IMAGE' | 'SATELLITE'>('IMAGE');
  const [gridType, setGridType] = useState<'NONE' | 'SQUARE' | 'HEX'>('SQUARE');
  const [gridSize, setGridSize] = useState(40);
  const [gridOpacity, setGridOpacity] = useState(0.3);
  const [zoom, setZoom] = useState(1);
  const [mapError, setMapError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onMapUpload(event.target.result as string);
          setViewMode('IMAGE');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Carregar Google Maps Script
  useEffect(() => {
    if (viewMode === 'SATELLITE') {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            setMapError("API Key missing from environment.");
            return;
        }

        // Setup global auth failure handler
        window.gm_authFailure = () => {
            console.error("Google Maps Auth Failure");
            setMapError("Erro de Autenticação Google Maps. A chave API fornecida é inválida ou não possui a 'Maps JavaScript API' habilitada.");
        };

        if (!window.google?.maps) {
            const callbackName = "initGoogleMapsTacticalCallback";
            
            // Define global callback for script load
            window[callbackName] = () => {
                initMap();
                delete window[callbackName];
            };

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${callbackName}&loading=async`;
            script.async = true;
            script.defer = true;
            script.onerror = () => setMapError("Falha ao carregar script do Google Maps (Network Error).");
            document.head.appendChild(script);
        } else {
            // Already loaded
            initMap();
        }
    }

    return () => {
        // We don't clear gm_authFailure immediately to ensure we catch late auth errors
    }
  }, [viewMode]);

  const initMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    try {
        // Default to a neutral location if geocoding fails
        const defaultLocation = { lat: 48.8566, lng: 2.3522 }; // Paris

        // Check if map instance already exists on this ref to avoid re-init issues
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: defaultLocation,
            zoom: 18,
            mapTypeId: 'satellite',
            disableDefaultUI: true,
            styles: MAP_STYLES,
            backgroundColor: '#0a0a0a',
            });
        }

        // Geocode Mission Location
        if (mission?.location) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ address: mission.location }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0] && mapInstanceRef.current) {
              mapInstanceRef.current.setCenter(results[0].geometry.location);
              
              // Add marker for generic area
              new window.google.maps.Marker({
                map: mapInstanceRef.current,
                position: results[0].geometry.location,
                icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: "#ff003c",
                    fillOpacity: 0.8,
                    strokeWeight: 2,
                    strokeColor: "white"
                }
              });
            }
          });
        }
    } catch (e) {
        console.error("Error initializing map", e);
        setMapError("Erro ao inicializar o mapa. Verifique o console.");
    }
  };

  const renderGrid = () => {
    if (gridType === 'NONE') return null;

    const style: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none', // Critical: Allows clicking through to the map
      opacity: gridOpacity,
      zIndex: 10
    };

    if (gridType === 'SQUARE') {
      return (
        <div 
          style={{
            ...style,
            backgroundImage: `
              linear-gradient(to right, white 1px, transparent 1px),
              linear-gradient(to bottom, white 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`
          }}
        />
      );
    }

    if (gridType === 'HEX') {
       return (
        <div style={style}>
          <svg width="100%" height="100%">
            <defs>
              <pattern id="hex" width={gridSize * Math.sqrt(3)} height={gridSize * 1.5} patternUnits="userSpaceOnUse" patternTransform={`scale(${1})`}>
                <path d={`M${gridSize * Math.sqrt(3) / 2},0 l${gridSize * Math.sqrt(3) / 2},${gridSize * 0.25} v${gridSize * 0.5} l-${gridSize * Math.sqrt(3) / 2},${gridSize * 0.25} l-${gridSize * Math.sqrt(3) / 2},-${gridSize * 0.25} v-${gridSize * 0.5} z`} 
                      fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hex)" />
          </svg>
        </div>
       )
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111]">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-800 bg-black/50 flex items-center justify-between px-4 shrink-0 z-20 relative">
        <div className="flex items-center space-x-4">
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-900 rounded p-1 border border-gray-700">
             <button 
                onClick={() => setViewMode('IMAGE')}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${viewMode === 'IMAGE' ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <ImageIcon className="w-3 h-3" />
                <span>Imagem</span>
             </button>
             <button 
                onClick={() => { setViewMode('SATELLITE'); setMapError(null); }}
                className={`flex items-center space-x-2 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${viewMode === 'SATELLITE' ? 'bg-ica-red text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <Globe className="w-3 h-3" />
                <span>Satélite</span>
             </button>
          </div>

          <div className="h-4 w-[1px] bg-gray-700"></div>

          {/* Grid Toggle */}
          <div className="flex items-center space-x-2">
            <button 
               onClick={() => setGridType(gridType === 'SQUARE' ? 'NONE' : 'SQUARE')}
               className={`p-1.5 rounded ${gridType === 'SQUARE' ? 'bg-ica-red text-white' : 'text-gray-400 hover:text-white'}`}
               title="Grid Quadrado"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
               onClick={() => setGridType(gridType === 'HEX' ? 'NONE' : 'HEX')}
               className={`p-1.5 rounded ${gridType === 'HEX' ? 'bg-ica-red text-white' : 'text-gray-400 hover:text-white'}`}
               title="Grid Hexagonal"
            >
              <span className="text-xs font-bold">HEX</span>
            </button>
          </div>

          {/* Upload (Only relevant for Image Mode) */}
          {viewMode === 'IMAGE' && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-xs font-bold uppercase hover:text-white text-gray-500 transition-colors ml-4"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline">Upload Imagem</span>
              </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        {/* Sliders */}
        <div className="flex items-center space-x-4">
            <div className="flex flex-col">
                <span className="text-[8px] uppercase text-gray-500">Grid Size</span>
                <input 
                  type="range" 
                  min="20" 
                  max="150" 
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="w-20 accent-ica-red h-1 bg-gray-700 rounded-lg appearance-none"
                />
            </div>
            
            <div className="flex flex-col">
                <span className="text-[8px] uppercase text-gray-500">Opacidade</span>
                <input 
                  type="range" 
                  min="0.1" 
                  max="0.8" 
                  step="0.1" 
                  value={gridOpacity}
                  onChange={(e) => setGridOpacity(Number(e.target.value))}
                  className="w-20 accent-ica-red h-1 bg-gray-700 rounded-lg appearance-none"
                />
            </div>

            {viewMode === 'IMAGE' && (
                <div className="flex items-center bg-gray-800 rounded px-2 py-1 ml-2">
                    <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}><ZoomOut className="w-4 h-4 text-gray-400" /></button>
                    <span className="text-xs w-12 text-center text-gray-300">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="w-4 h-4 text-gray-400" /></button>
                </div>
            )}
        </div>
      </div>

      {/* Map Viewer Container */}
      <div className="flex-1 overflow-hidden bg-hex-pattern relative flex items-center justify-center bg-black">
        
        {/* Render Grid Overlay (Always on top) */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            {renderGrid()}
        </div>

        {viewMode === 'IMAGE' ? (
             <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
                {activeMap ? (
                <div 
                    className="relative shadow-2xl transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${zoom})` }}
                >
                    <img 
                    src={activeMap} 
                    alt="Mapa Tático" 
                    className="max-w-none border border-gray-700"
                    style={{ maxHeight: '80vh' }}
                    draggable={false}
                    />
                    {/* Example Token Marker */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-ica-red rounded-full border-2 border-white shadow-lg animate-pulse" title="Última Posição Conhecida"></div>
                </div>
                ) : (
                <div className="text-center text-gray-600">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="uppercase tracking-widest font-bold">Sem Imagem Tática</p>
                    <p className="text-sm font-mono mt-2">Faça upload ou mude para Satélite</p>
                </div>
                )}
             </div>
        ) : (
             /* Google Maps Container */
             <div className="w-full h-full relative">
                 {mapError ? (
                     <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-8 text-center">
                        <AlertTriangle className="w-16 h-16 text-ica-red mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">SISTEMA OFFLINE</h3>
                        <p className="max-w-md text-sm font-mono border border-red-900/50 p-4 bg-red-900/10 text-red-400 mb-4">
                            {mapError}
                        </p>
                        <div className="text-xs text-gray-500 mb-6">
                            [ERR_CODE: INVALID_KEY_MAP_ERROR]
                        </div>
                        <button 
                            onClick={() => setViewMode('IMAGE')} 
                            className="px-6 py-3 bg-gray-800 hover:bg-white hover:text-black transition-colors text-xs font-bold uppercase tracking-widest border border-gray-700"
                        >
                            Retornar para Modo Imagem
                        </button>
                     </div>
                 ) : (
                     <>
                        <div ref={mapContainerRef} className="w-full h-full bg-[#111]" />
                        
                        {/* Mission Info Overlay */}
                        <div className="absolute bottom-6 left-6 z-20 bg-black/80 border-l-4 border-ica-red p-4 backdrop-blur-md max-w-xs pointer-events-none">
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Satélite em Tempo Real</div>
                            <div className="text-white font-bold uppercase text-lg leading-none">{mission?.location || 'Local Desconhecido'}</div>
                            {mission?.location && <div className="text-green-500 text-[10px] font-mono mt-2 flex items-center"><MapPin className="w-3 h-3 mr-1" /> LINK ESTABELECIDO</div>}
                        </div>
                     </>
                 )}
             </div>
        )}
      </div>
    </div>
  );
};

export default TacticalMap;
