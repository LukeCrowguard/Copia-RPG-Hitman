
import React, { useState, useRef } from 'react';
import { Mission, StartLocation, Target as MissionTarget } from '../types';
import { Target, MapPin, FileText, Play, AlertOctagon, ShieldAlert, Edit2, Save, Upload, Plus, Trash2, Camera } from 'lucide-react';

interface BriefingViewProps {
  mission: Mission | null;
  onGenerate: () => void;
  onUpdateMission: (mission: Mission) => void;
  onNext: () => void;
  loading: boolean;
}

const BriefingView: React.FC<BriefingViewProps> = ({ mission, onGenerate, onUpdateMission, onNext, loading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);

  if (!mission) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-8 animate-fade-in relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ica-red/5 rounded-full blur-3xl"></div>
        
        <div className="text-8xl font-bold tracking-widest text-ica-red uppercase relative z-10 select-none">ICA</div>
        <div className="flex flex-col items-center space-y-2 z-10">
          <div className="text-xl tracking-[0.5em] text-gray-400 uppercase">Acesso Restrito</div>
          <div className="text-xs font-mono text-gray-600">V.4.0.4.0 // SECURE_UPLINK</div>
        </div>
        
        <button
          onClick={onGenerate}
          disabled={loading}
          className="group relative px-12 py-6 bg-transparent border border-ica-gray hover:border-ica-red transition-all duration-300 disabled:opacity-50 z-10 overflow-hidden"
        >
          <div className="absolute inset-0 bg-ica-red opacity-0 group-hover:opacity-10 transition-opacity duration-300 transform skew-x-12 scale-150"></div>
          <div className="flex flex-col items-center">
             <span className="font-sans text-2xl uppercase tracking-widest text-white group-hover:text-ica-red transition-colors">
              {loading ? 'Decriptando...' : 'Buscar Contrato'}
            </span>
            {loading && <div className="h-0.5 w-full bg-ica-red mt-2 animate-pulse"></div>}
          </div>
        </button>
      </div>
    );
  }

  // Edit Handlers
  const handleTextChange = (field: keyof Mission, value: string) => {
    onUpdateMission({ ...mission, [field]: value });
  };

  const handleArrayChange = (field: 'objectives' | 'complications', index: number, value: string) => {
    const newArray = [...mission[field]];
    newArray[index] = value;
    onUpdateMission({ ...mission, [field]: newArray });
  };

  const handleStartLocationChange = (index: number, value: string) => {
      const newLocs = [...mission.startLocations];
      newLocs[index] = { ...newLocs[index], name: value };
      onUpdateMission({ ...mission, startLocations: newLocs });
  };

  // Target Management
  const handleTargetChange = (index: number, field: keyof MissionTarget, value: string) => {
    const newTargets = [...mission.targets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    onUpdateMission({ ...mission, targets: newTargets });
  };

  const handleAddTarget = () => {
    const newTarget: MissionTarget = {
      id: crypto.randomUUID(),
      name: 'NOVO ALVO',
      bio: 'Sem dados.'
    };
    onUpdateMission({ ...mission, targets: [...mission.targets, newTarget] });
  };

  const handleRemoveTarget = (index: number) => {
    const newTargets = [...mission.targets];
    newTargets.splice(index, 1);
    onUpdateMission({ ...mission, targets: newTargets });
  };

  const handleTargetImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeTargetId) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newTargets = mission.targets.map(t => 
            t.id === activeTargetId ? { ...t, imageUrl: event.target?.result as string } : t
          );
          onUpdateMission({ ...mission, targets: newTargets });
        }
      };
      reader.readAsDataURL(file);
    }
    if (targetInputRef.current) targetInputRef.current.value = '';
    setActiveTargetId(null);
  };

  const triggerTargetUpload = (id: string) => {
    setActiveTargetId(id);
    targetInputRef.current?.click();
  };

  const handleAddItem = (field: 'objectives' | 'complications') => {
    onUpdateMission({ ...mission, [field]: [...mission[field], 'Novo Item'] });
  };

  const handleAddLocation = () => {
      const newLoc: StartLocation = { id: crypto.randomUUID(), name: 'Nova Entrada', description: 'Descrição tática' };
      onUpdateMission({ ...mission, startLocations: [...mission.startLocations, newLoc] });
  };

  const handleRemoveItem = (field: 'objectives' | 'complications', index: number) => {
    const newArray = [...mission[field]];
    newArray.splice(index, 1);
    onUpdateMission({ ...mission, [field]: newArray });
  };

  const handleRemoveLocation = (index: number) => {
      const newLocs = [...mission.startLocations];
      newLocs.splice(index, 1);
      onUpdateMission({ ...mission, startLocations: newLocs });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateMission({ ...mission, [field]: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20 custom-scrollbar relative">
      
      {/* Hidden inputs */}
      <input type="file" ref={targetInputRef} onChange={handleTargetImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={coverInputRef} onChange={(e) => handleImageUpload(e, 'imageUrl')} accept="image/*" className="hidden" />

      {/* Hero Header */}
      <div className="relative h-72 md:h-96 w-full shrink-0 overflow-hidden border-b-4 border-ica-red group">
        <img 
          src={mission.imageUrl} 
          alt="Local da Missão" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000 ease-out scale-105 hover:scale-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ica-dark via-ica-dark/40 to-transparent"></div>
        
        {/* Edit Button - ABSOLUTELY Positioned inside Hero to avoid floating issues */}
        <div className="absolute top-6 right-6 z-30 flex items-center space-x-3">
             {isEditing && (
                <button 
                onClick={() => coverInputRef.current?.click()}
                className="bg-black/80 hover:bg-ica-red border border-gray-600 text-white px-3 py-2 uppercase font-bold text-xs tracking-widest flex items-center space-x-2 backdrop-blur-sm transition-all shadow-xl"
                >
                <Upload className="w-4 h-4" />
                <span className="hidden md:inline">Capa</span>
                </button>
             )}
             
             <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-3 rounded-full shadow-lg transition-all ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-ica-red border border-gray-600'}`}
                title={isEditing ? "Salvar Alterações" : "Editar Missão"}
             >
                {isEditing ? <Save className="w-5 h-5 text-white" /> : <Edit2 className="w-5 h-5 text-white" />}
             </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 bg-gradient-to-r from-black/80 to-transparent z-20 pointer-events-none">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
            <div className="w-full md:w-2/3">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-ica-red text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">Top Secret</span>
                {isEditing ? (
                  <select 
                    value={mission.difficulty} 
                    onChange={(e) => handleTextChange('difficulty', e.target.value as any)}
                    className="bg-black text-ica-red font-bold text-sm tracking-[0.3em] uppercase border border-ica-red focus:outline-none"
                  >
                    <option value="CASUAL">Casual</option>
                    <option value="PROFESSIONAL">Profissional</option>
                    <option value="MASTER">Mestre</option>
                  </select>
                ) : (
                  <span className="text-ica-red font-bold text-sm tracking-[0.3em] uppercase">{mission.difficulty}</span>
                )}
              </div>
              
              {isEditing ? (
                <input 
                  type="text" 
                  value={mission.location} 
                  onChange={(e) => handleTextChange('location', e.target.value)}
                  className="w-full bg-transparent text-5xl md:text-7xl font-sans uppercase font-bold text-white tracking-tighter leading-none border-b border-gray-500 focus:border-ica-red focus:outline-none mb-2"
                />
              ) : (
                <h1 className="text-5xl md:text-7xl font-sans uppercase font-bold text-white tracking-tighter leading-none">{mission.location}</h1>
              )}

              <div className="font-mono text-gray-400 text-sm mt-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                {isEditing ? (
                  <input 
                    type="text" 
                    value={mission.codename} 
                    onChange={(e) => handleTextChange('codename', e.target.value)}
                    className="bg-transparent border-b border-gray-600 text-gray-400 w-full md:w-96 focus:border-ica-red focus:outline-none"
                  />
                ) : (
                  mission.codename
                )}
              </div>
            </div>
            
            {/* Barcode Decoration */}
            {!isEditing && (
              <div className="hidden md:block opacity-80">
                 <div className="flex items-end space-x-1 h-12">
                   {[...Array(20)].map((_, i) => (
                     <div key={i} className="w-1 bg-white" style={{ height: `${Math.random() * 100}%`, opacity: Math.random() }}></div>
                   ))}
                 </div>
                 <div className="text-[10px] font-mono tracking-[0.5em] text-right mt-1">640509-040147</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Briefing */}
        <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-left duration-500">
          <div>
            <h3 className="flex items-center text-xl font-bold uppercase tracking-widest text-white mb-4 border-l-4 border-ica-red pl-4 bg-gradient-to-r from-ica-gray/20 to-transparent py-2">
              <FileText className="w-5 h-5 mr-3 text-ica-red" />
              Briefing Operacional
            </h3>
            {isEditing ? (
              <textarea 
                value={mission.briefingText}
                onChange={(e) => handleTextChange('briefingText', e.target.value)}
                rows={8}
                className="w-full bg-black/40 border border-gray-700 p-4 text-gray-300 font-mono text-sm focus:border-ica-red focus:outline-none resize-y"
              />
            ) : (
              <p className="font-mono text-gray-300 leading-relaxed text-sm md:text-base border-l border-gray-800 pl-6 py-2 whitespace-pre-line text-justify">
                {mission.briefingText}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Targets Card */}
            <div className="bg-ica-gray/20 p-6 border border-gray-800 hover:border-gray-600 transition-colors group relative">
              <h3 className="flex items-center justify-between text-lg font-bold uppercase tracking-widest text-white mb-4 group-hover:text-ica-red transition-colors">
                <div className="flex items-center">
                  <Target className="w-5 h-5 mr-3 text-ica-red" />
                  Alvos ({mission.targets.length})
                </div>
                {isEditing && <button onClick={handleAddTarget} className="text-green-500 hover:text-white"><Plus className="w-4 h-4" /></button>}
              </h3>
              
              <div className="space-y-6">
                {mission.targets.map((target, idx) => (
                  <div key={target.id} className="flex items-start space-x-4 border-b border-gray-800 pb-4 last:border-0 last:pb-0 relative">
                     {/* Remove Button for Target */}
                     {isEditing && (
                        <button onClick={() => handleRemoveTarget(idx)} className="absolute top-0 right-0 text-red-500 hover:text-white z-10">
                          <Trash2 className="w-3 h-3" />
                        </button>
                     )}

                     <div className="w-20 h-20 shrink-0 bg-black flex items-center justify-center border border-gray-700 relative overflow-hidden group/img">
                        {target.imageUrl ? (
                          <img src={target.imageUrl} alt={target.name} className="w-full h-full object-contain" />
                        ) : (
                          <Target className="w-8 h-8 text-gray-600" />
                        )}
                        
                        {isEditing && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center cursor-pointer opacity-0 group-hover/img:opacity-100 transition-opacity" onClick={() => triggerTargetUpload(target.id)}>
                             <Camera className="w-6 h-6 text-white" />
                          </div>
                        )}
                     </div>
                     <div className="flex-1 min-w-0 pr-4">
                        {isEditing ? (
                          <input 
                            type="text" 
                            value={target.name} 
                            onChange={(e) => handleTargetChange(idx, 'name', e.target.value)}
                            className="w-full bg-black/50 border-b border-gray-700 text-white font-sans uppercase mb-2 focus:border-ica-red focus:outline-none"
                            placeholder="Nome do Alvo"
                          />
                        ) : (
                          <div className="text-xl font-sans uppercase text-white leading-none mb-1 truncate" title={target.name}>{target.name}</div>
                        )}

                        {isEditing ? (
                          <textarea 
                            value={target.bio}
                            onChange={(e) => handleTargetChange(idx, 'bio', e.target.value)}
                            rows={2}
                            className="w-full bg-black/50 border border-gray-700 text-xs text-gray-400 font-mono focus:border-ica-red focus:outline-none"
                            placeholder="Bio do Alvo"
                          />
                        ) : (
                          <p className="font-mono text-gray-400 text-xs leading-relaxed line-clamp-3">{target.bio}</p>
                        )}
                     </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Objectives Card */}
            <div className="bg-ica-gray/20 p-6 border border-gray-800 hover:border-gray-600 transition-colors group">
               <h3 className="flex items-center justify-between text-lg font-bold uppercase tracking-widest text-white mb-4 group-hover:text-ica-red transition-colors">
                <div className="flex items-center">
                  <AlertOctagon className="w-5 h-5 mr-3 text-ica-red" />
                  Objetivos
                </div>
                {isEditing && <button onClick={() => handleAddItem('objectives')} className="text-green-500 hover:text-white"><Plus className="w-4 h-4" /></button>}
              </h3>
              <ul className="space-y-3">
                {mission.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start group/item">
                    <span className="text-ica-red mr-3 font-mono font-bold mt-1">0{i+1}</span>
                    {isEditing ? (
                      <div className="flex-1 flex items-center space-x-2">
                         <input 
                            value={obj}
                            onChange={(e) => handleArrayChange('objectives', i, e.target.value)}
                            className="flex-1 bg-black/50 border-b border-gray-700 text-sm font-mono text-gray-300 focus:border-ica-red focus:outline-none"
                         />
                         <button onClick={() => handleRemoveItem('objectives', i)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <span className="font-mono text-gray-300 text-sm uppercase">{obj}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Start Locations List Management (For detailed editing, see Planning View) */}
          {isEditing && (
            <div className="bg-ica-gray/20 p-6 border border-gray-800 mt-6">
              <h3 className="flex items-center justify-between text-lg font-bold uppercase tracking-widest text-white mb-4">
                 <div className="flex items-center">
                   <MapPin className="w-5 h-5 mr-3 text-ica-red" />
                   Gerenciar Pontos de Infiltração
                 </div>
                 <button onClick={handleAddLocation} className="text-green-500 hover:text-white"><Plus className="w-4 h-4" /></button>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {mission.startLocations.map((loc, i) => (
                   <div key={loc.id} className="flex items-center space-x-2">
                      <div className="text-xs text-gray-500 font-mono">{i+1}</div>
                      <input 
                          value={loc.name}
                          onChange={(e) => handleStartLocationChange(i, e.target.value)}
                          className="flex-1 bg-black/50 border-b border-gray-700 text-sm font-mono text-gray-300 focus:border-ica-red focus:outline-none"
                          placeholder="Nome do Local"
                       />
                       <button onClick={() => handleRemoveLocation(i)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                   </div>
                 ))}
                 <div className="col-span-full text-[10px] text-gray-500 italic mt-2">
                     * Edite imagens e descrições na aba "Prep".
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel & Complications */}
        <div className="lg:col-span-1 flex flex-col space-y-6 animate-in slide-in-from-right duration-500 delay-100">
           
           {/* Complications Card */}
           <div className="bg-red-900/10 border border-red-900/30 p-6">
              <h3 className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-ica-red mb-4">
                <div className="flex items-center">
                   <ShieldAlert className="w-4 h-4 mr-2" />
                   Complicações
                </div>
                {isEditing && <button onClick={() => handleAddItem('complications')} className="text-green-500 hover:text-white"><Plus className="w-4 h-4" /></button>}
              </h3>
              <ul className="space-y-3">
                {mission.complications && mission.complications.length > 0 ? (
                  mission.complications.map((comp, i) => (
                    <li key={i} className="flex items-center text-xs font-mono text-gray-300 uppercase">
                      <div className="w-1.5 h-1.5 bg-ica-red mr-3 rotate-45 shrink-0"></div>
                      {isEditing ? (
                        <div className="flex-1 flex items-center space-x-2">
                           <input 
                              value={comp}
                              onChange={(e) => handleArrayChange('complications', i, e.target.value)}
                              className="flex-1 bg-black/50 border-b border-red-900/50 text-xs font-mono text-gray-300 focus:border-ica-red focus:outline-none"
                           />
                           <button onClick={() => handleRemoveItem('complications', i)} className="text-red-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        comp
                      )}
                    </li>
                  ))
                ) : (
                  <li className="text-xs font-mono text-gray-500 uppercase">Nenhuma complicação detectada.</li>
                )}
              </ul>
           </div>

           <div className="mt-auto pt-8">
             <div className="text-right mb-6">
                <div className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Status da Rede</div>
                <div className="text-green-500 font-mono text-xs uppercase tracking-widest flex justify-end items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  {isEditing ? 'MODO DE EDIÇÃO ATIVO' : 'PRONTO PARA PLANEJAMENTO'}
                </div>
             </div>

             <button 
               onClick={onNext}
               disabled={isEditing}
               className="w-full group flex items-center justify-between bg-white hover:bg-ica-red text-black hover:text-white py-5 px-6 transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] hover:shadow-none translate-x-0 hover:translate-x-1 hover:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <span className="font-bold uppercase tracking-widest text-lg">{isEditing ? 'Salve para Continuar' : 'Iniciar Planejamento'}</span>
                <Play className="w-6 h-6 fill-current" />
             </button>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BriefingView;
