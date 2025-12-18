
import React, { useState, useEffect, useRef } from 'react';
import { Mission, TeamLoadout, SimulationResult, Item } from './types.ts';
import { DEFAULT_LOADOUT, AudioTrack, PISTOLS, GEAR, SUITS, SNIPERS } from './constants.ts';
import { generateMission, simulateMission } from './services/geminiService.ts';
import { saveState, loadState, saveEmergencyBackup, AppState } from './services/persistence.ts';
import BriefingView from './components/BriefingView.tsx';
import PlanningView from './components/PlanningView.tsx';
import SimulationView from './components/SimulationView.tsx';
import TacticalMap from './components/TacticalMap.tsx';
import AudioPlayer from './components/AudioPlayer.tsx';
import ToolsOverlay from './components/ToolsOverlay.tsx';
import { LayoutDashboard, Map, FileText, Save, FileCheck, CheckCircle2, AlertOctagon, Server } from 'lucide-react';

type ViewState = 'BRIEFING' | 'PLANNING' | 'SIMULATION' | 'TACTICAL';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('BRIEFING');
  const [mission, setMission] = useState<Mission | null>(null);
  const [loadout, setLoadout] = useState<TeamLoadout>(DEFAULT_LOADOUT);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [notes, setNotes] = useState('');
  const [mapImage, setMapImage] = useState<string | null>(null);
  
  const [inventory, setInventory] = useState<Item[]>([...SUITS, ...PISTOLS, ...GEAR, ...SNIPERS]);
  const [audioTabNames, setAudioTabNames] = useState<Record<string, string>>({
      'AMBIENCE': 'Ambiente',
      'TENSION': 'Tensão',
      'ACTION': 'Combate',
      'SFX': 'Efeitos'
  });

  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const initialLoadDone = useRef(false);

  const stateRef = useRef<AppState>({
      mission: null,
      loadout: DEFAULT_LOADOUT,
      result: null,
      view: 'BRIEFING',
      notes: '',
      mapImage: null,
      tracks: [],
      inventory: [],
      audioTabNames: {}
  });

  useEffect(() => {
      stateRef.current = {
          mission,
          loadout,
          result,
          view,
          notes,
          mapImage,
          tracks,
          inventory,
          audioTabNames
      };
  }, [mission, loadout, result, view, notes, mapImage, tracks, inventory, audioTabNames]);

  useEffect(() => {
    const load = async () => {
      try {
        const state = await loadState();
        if (state) {
            applyState(state);
        }
      } catch (err) {
          console.error("Error loading state:", err);
          showNotification("Erro ao carregar dados salvos", 'error');
      } finally {
          initialLoadDone.current = true;
      }
    };
    load();
  }, []);

  const applyState = (state: AppState) => {
    if (state.mission) {
        const m = state.mission as any;
        if (!m.targets && m.targetName) {
            m.targets = [{
                id: crypto.randomUUID(),
                name: m.targetName,
                bio: m.targetBio || '',
                imageUrl: m.targetImageUrl
            }];
        }
        if (!m.targets) m.targets = [];
        setMission(m as Mission);
    }

    if (state.loadout) {
        const loadedLoadout = state.loadout as any;
        if (!loadedLoadout.agent404 && loadedLoadout.suit) {
            setLoadout({
                agent404: loadedLoadout,
                agent10: DEFAULT_LOADOUT.agent10,
                startingLocationId: loadedLoadout.startingLocationId || null
            });
        } else {
            setLoadout(state.loadout);
        }
    }
    
    if (state.result) setResult(state.result);
    if (state.view) setView(state.view as ViewState);
    if (state.notes) setNotes(state.notes);
    if (state.mapImage) setMapImage(state.mapImage);
    if (state.tracks) setTracks(state.tracks);
    if (state.inventory) setInventory(state.inventory);
    if (state.audioTabNames) setAudioTabNames(state.audioTabNames);
  };

  const showNotification = (msg: string, type: 'success' | 'error') => {
      setNotification({ message: msg, type });
      setTimeout(() => setNotification(null), 3000);
  };

  const performSave = async (silent = false) => {
      if (!initialLoadDone.current) return;
      setSaving(true);
      try {
        await saveState(stateRef.current);
      } catch (e) {
        console.error("Save failed", e);
        if (!silent) showNotification("Falha ao salvar progresso", 'error');
      } finally {
        setTimeout(() => setSaving(false), 500);
      }
  };

  useEffect(() => {
    if (!initialLoadDone.current) return;
    const timeout = setTimeout(() => {
      performSave(true);
    }, 1000); 
    return () => clearTimeout(timeout);
  }, [mission, loadout, result, view, notes, mapImage, tracks, inventory, audioTabNames]);

  useEffect(() => {
    const handleUnload = () => {
        if (initialLoadDone.current) {
            saveEmergencyBackup(stateRef.current);
        }
    };
    window.addEventListener('pagehide', handleUnload);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
        window.removeEventListener('pagehide', handleUnload);
        window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const handleGenerateMission = async () => {
    setLoading(true);
    const newMission = await generateMission();
    setMission(newMission);
    setLoading(false);
  };

  const handleUpdateMission = (updatedMission: Mission) => {
    setMission(updatedMission);
  };

  const handleSimulate = async () => {
    if (!mission) return;
    setLoading(true);
    const simResult = await simulateMission(mission, loadout);
    setResult(simResult);
    setView('SIMULATION');
    setLoading(false);
  };

  const handleUpdateResult = (updatedResult: SimulationResult) => {
      setResult(updatedResult);
  };

  const handleRestart = () => {
    setView('BRIEFING');
    setMission(null);
    setResult(null);
    setLoadout(DEFAULT_LOADOUT);
  };

  const handleAddTrack = (file: File, category: 'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX') => {
    const objectUrl = URL.createObjectURL(file);
    const newTrack: AudioTrack = {
      id: `custom-${Date.now()}-${Math.random()}`,
      name: file.name.replace(/\.[^/.]+$/, "").substring(0, 20),
      url: objectUrl,
      blob: file, 
      category: category
    };
    setTracks(prev => [...prev, newTrack]);
  };

  const handleRemoveTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateCategoryName = (key: string, name: string) => {
      setAudioTabNames(prev => ({ ...prev, [key]: name }));
  };

  const handleManualSave = () => {
      performSave(false);
      showNotification("Dados Sincronizados", 'success');
  };

  const renderContent = () => {
    switch (view) {
      case 'BRIEFING':
        return (
          <BriefingView 
            mission={mission} 
            onGenerate={handleGenerateMission} 
            onUpdateMission={handleUpdateMission}
            onNext={() => setView('PLANNING')}
            loading={loading}
          />
        );
      case 'PLANNING':
        if (!mission) return <div className="p-8 text-center text-gray-500">Gere uma missão primeiro.</div>;
        return (
          <PlanningView 
            loadout={loadout}
            setLoadout={setLoadout}
            mission={mission}
            inventory={inventory}
            onUpdateInventory={setInventory}
            onSimulate={handleSimulate}
            onUpdateMission={handleUpdateMission}
            loading={loading}
          />
        );
      case 'SIMULATION':
        if (!result || !mission) return <div className="p-8 text-center text-gray-500">Nenhum relatório ativo.</div>;
        return (
          <SimulationView 
            result={result}
            mission={mission}
            loadout={loadout}
            onRestart={handleRestart}
            onUpdateResult={handleUpdateResult}
          />
        );
      case 'TACTICAL':
        return (
            <TacticalMap 
                mission={mission} 
                uploadedMap={mapImage}
                onMapUpload={setMapImage}
            />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-black text-gray-100 flex font-sans overflow-hidden selection:bg-ica-red selection:text-white relative">
      {notification && (
          <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-[0_0_20px_rgba(0,0,0,0.8)] border flex items-center space-x-3 animate-in slide-in-from-top-4 duration-300 ${notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 'bg-red-900/90 border-red-500 text-red-100'}`}>
              {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
              <span className="text-sm font-bold uppercase tracking-widest">{notification.message}</span>
          </div>
      )}
      <aside className="w-16 md:w-20 bg-[#0a0a0a] border-r border-gray-800 flex flex-col items-center py-6 z-20 shrink-0">
         <div className="w-10 h-10 bg-ica-red flex items-center justify-center font-bold text-white mb-8 shadow-[0_0_15px_rgba(255,0,60,0.5)]">ICA</div>
         <nav className="flex-1 space-y-6 w-full flex flex-col items-center">
            <NavButton active={view === 'BRIEFING'} onClick={() => setView('BRIEFING')} icon={FileText} label="Intel" />
            <NavButton active={view === 'TACTICAL'} onClick={() => setView('TACTICAL')} icon={Map} label="Tático" />
            <NavButton active={view === 'PLANNING'} onClick={() => setView('PLANNING')} icon={LayoutDashboard} label="Prep" disabled={!mission} />
            <NavButton active={view === 'SIMULATION'} onClick={() => setView('SIMULATION')} icon={FileCheck} label="Relatório" disabled={!result} />
         </nav>
         <div className="mt-auto mb-6 w-full flex flex-col items-center">
            <div className="mb-4 flex flex-col items-center opacity-40">
                <Server className="w-4 h-4 text-green-500 mb-1" />
                <span className="text-[7px] font-mono uppercase text-center leading-tight">Link: GH_PAGES<br/>STATIC_NODE</span>
            </div>
            <button onClick={handleManualSave} disabled={saving} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border ${saving ? 'bg-ica-red/10 border-ica-red text-ica-red shadow-[0_0_15px_rgba(255,0,60,0.5)]' : 'bg-transparent border-gray-700 text-gray-500 hover:text-white hover:border-white hover:bg-gray-800'}`} title="Salvar Agora">
               <Save className={`w-5 h-5 ${saving ? 'animate-pulse' : ''}`} />
            </button>
            <span className="text-[9px] text-gray-600 mt-2 uppercase tracking-widest">{saving ? '...' : 'SALVAR'}</span>
         </div>
      </aside>
      <div className="flex-1 flex flex-col h-full relative bg-hex-pattern bg-repeat">
        <header className="h-14 border-b border-gray-800 bg-black/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
           <h1 className="text-xl font-bold uppercase tracking-widest text-white flex items-center">
              <span className="text-ica-red mr-3">//</span>
              {view === 'BRIEFING' && 'Terminal de Contratos'}
              {view === 'PLANNING' && 'Logística & Armamento'}
              {view === 'SIMULATION' && 'Relatório de Missão'}
              {view === 'TACTICAL' && 'Grid de Batalha'}
           </h1>
           <div className="flex items-center space-x-3">
              {saving && <span className="text-xs font-mono text-ica-red animate-pulse">GRAVANDO DADOS...</span>}
              <div className="text-xs font-mono text-gray-600 hidden md:block">SECURE_CONNECTION_ESTABLISHED</div>
           </div>
        </header>
        <main className="flex-1 relative overflow-hidden">
          {renderContent()}
        </main>
        <AudioPlayer tracks={tracks} onAddTrack={handleAddTrack} onRemoveTrack={handleRemoveTrack} categoryNames={audioTabNames} onUpdateCategoryName={handleUpdateCategoryName} />
        <ToolsOverlay notes={notes} onNotesChange={setNotes} onImportState={(newState) => { applyState(newState); showNotification("Dossiê Importado com Sucesso", "success"); }} currentState={stateRef.current} />
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string; disabled?: boolean }> = ({ active, onClick, icon: Icon, label, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`group relative w-full flex flex-col items-center justify-center py-2 transition-all ${active ? 'text-ica-red' : 'text-gray-500 hover:text-white'} ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
    <div className={`absolute left-0 w-1 h-8 bg-ica-red transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}></div>
    <Icon className={`w-6 h-6 mb-1 transition-transform group-hover:scale-110 ${active ? 'fill-current' : ''}`} />
    <span className="text-[9px] uppercase tracking-widest font-bold hidden md:block">{label}</span>
  </button>
);

export default App;
