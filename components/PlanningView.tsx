import React, { useState, useEffect, useRef } from 'react';
import { Item, TeamLoadout, AgentLoadout, Mission, ItemType } from '../types';
import * as Icons from 'lucide-react';
import { LucideIcon, Edit2, Save, Plus, Camera, X, Loader2, Crosshair, MapPin, Briefcase, AlertTriangle, HelpCircle, User, Fingerprint, Trash2, Users, Check } from 'lucide-react';

interface PlanningViewProps {
  loadout: TeamLoadout;
  setLoadout: (l: TeamLoadout) => void;
  mission: Mission;
  inventory: Item[];
  onUpdateInventory: (items: Item[]) => void;
  onSimulate: () => void;
  onUpdateMission: (m: Mission) => void;
  loading: boolean;
}

const ItemIcon: React.FC<{ name: string, className?: string, imageUrl?: string }> = ({ name, className, imageUrl }) => {
  if (imageUrl) {
    return <img src={imageUrl} alt="Item" className={`${className} bg-black/50 object-cover`} />;
  }
  const Icon = (Icons as any)[name] as LucideIcon;
  return Icon ? <span className={className}><Icon className="w-full h-full" /></span> : <HelpCircle className={className} />;
};

const PlanningView: React.FC<PlanningViewProps> = ({ 
  loadout, 
  setLoadout, 
  mission, 
  inventory,
  onUpdateInventory,
  onSimulate, 
  onUpdateMission, 
  loading 
}) => {
  const [activeAgent, setActiveAgent] = useState<'agent404' | 'agent10'>('agent404');
  const [selectedSlot, setSelectedSlot] = useState<keyof AgentLoadout | 'startingLocationId' | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Refs for file uploads
  const itemImageInputRef = useRef<HTMLInputElement>(null);
  const locationImageInputRef = useRef<HTMLInputElement>(null);
  const agentImageInputRef = useRef<HTMLInputElement>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  // Initialize starting location if null
  useEffect(() => {
    if (!loadout.startingLocationId && mission.startLocations.length > 0) {
      setLoadout({ ...loadout, startingLocationId: mission.startLocations[0].id });
    }
  }, [mission, loadout, setLoadout]);

  const getCurrentAgentLoadout = () => loadout[activeAgent];

  const getItemsForSlot = (slot: keyof AgentLoadout): Item[] => {
    if (slot === 'suit') return inventory.filter(i => i.type === 'SUIT');
    if (slot === 'pistol') return inventory.filter(i => i.type === 'PISTOL');
    if (slot === 'gear1' || slot === 'gear2') return inventory.filter(i => ['MELEE', 'TOOL', 'POISON', 'EXPLOSIVE'].includes(i.type));
    if (slot === 'smuggle') return inventory.filter(i => i.type !== 'SUIT'); // Can smuggle almost anything
    return [];
  };

  const handleEquip = (item: Item) => {
    if (!selectedSlot || selectedSlot === 'startingLocationId') return;
    
    // Create new agent loadout
    const updatedAgentLoadout = { ...getCurrentAgentLoadout(), [selectedSlot]: item };
    
    // Update team loadout
    setLoadout({ ...loadout, [activeAgent]: updatedAgentLoadout });
    setSelectedSlot(null);
  };

  const handleCreateItem = () => {
      if (!selectedSlot || selectedSlot === 'startingLocationId') return;
      
      let type: ItemType = 'TOOL';
      let icon = 'Box';
      
      if (selectedSlot === 'suit') { type = 'SUIT'; icon = 'User'; }
      else if (selectedSlot === 'pistol') { type = 'PISTOL'; icon = 'Crosshair'; }
      else if (selectedSlot === 'gear1' || selectedSlot === 'gear2') { type = 'TOOL'; icon = 'Wrench'; }

      const newItem: Item = {
          id: `custom-${Date.now()}`,
          name: 'NOVO ITEM',
          description: 'Descrição do item customizado.',
          type: type,
          icon: icon,
          isIllegal: false
      };

      onUpdateInventory([...inventory, newItem]);
  };

  const handleDeleteItem = (e: React.MouseEvent, itemId: string) => {
      e.stopPropagation();
      if (confirm('Deletar este item permanentemente?')) {
          onUpdateInventory(inventory.filter(i => i.id !== itemId));
          
          // Remove from both agents if equipped
          const newTeamLoadout = { ...loadout };
          (['agent404', 'agent10'] as const).forEach(agentKey => {
               const agentL = newTeamLoadout[agentKey];
               (Object.keys(agentL) as Array<keyof AgentLoadout>).forEach(key => {
                   const val = agentL[key];
                   if (val && typeof val === 'object' && 'id' in val && val.id === itemId) {
                       // @ts-ignore
                       newTeamLoadout[agentKey] = { ...agentL, [key]: null };
                   }
               });
          });
          setLoadout(newTeamLoadout);
      }
  };

  const handleLocationSelect = (locId: string) => {
    if (isEditing) {
        setEditingLocationId(locId);
        locationImageInputRef.current?.click();
    } else {
        setLoadout({ ...loadout, startingLocationId: locId });
    }
  };

  const handleAgentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          const updatedAgent = { ...getCurrentAgentLoadout(), agentImageUrl: ev.target.result as string };
          setLoadout({ ...loadout, [activeAgent]: updatedAgent });
        }
      };
      reader.readAsDataURL(file);
    }
    if (agentImageInputRef.current) agentImageInputRef.current.value = '';
  };

  const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedSlot && selectedSlot !== 'startingLocationId' && e.target.files?.[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
            const currentItem = getCurrentAgentLoadout()[selectedSlot] as Item;
            if (currentItem && ev.target?.result) {
                const updatedItem = { ...currentItem, imageUrl: ev.target.result as string };
                
                // Update Current Agent Loadout
                const updatedAgent = { ...getCurrentAgentLoadout(), [selectedSlot]: updatedItem };
                setLoadout({ ...loadout, [activeAgent]: updatedAgent });
                
                // Update Global Inventory
                const updatedInventory = inventory.map(i => i.id === updatedItem.id ? updatedItem : i);
                onUpdateInventory(updatedInventory);
            }
        };
        reader.readAsDataURL(file);
    }
    if (itemImageInputRef.current) itemImageInputRef.current.value = '';
  };

  const handleLocationImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (editingLocationId && e.target.files?.[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
              if (ev.target?.result) {
                  const updatedLocations = mission.startLocations.map(loc => 
                      loc.id === editingLocationId ? { ...loc, imageUrl: ev.target.result as string } : loc
                  );
                  onUpdateMission({ ...mission, startLocations: updatedLocations });
              }
          };
          reader.readAsDataURL(file);
      }
      setEditingLocationId(null);
      if (locationImageInputRef.current) locationImageInputRef.current.value = '';
  };

  const handleItemNameChange = (slot: keyof AgentLoadout, newName: string) => {
    const item = getCurrentAgentLoadout()[slot] as Item;
    if (item) {
        const updatedItem = { ...item, name: newName };
        // Update Loadout
        const updatedAgent = { ...getCurrentAgentLoadout(), [slot]: updatedItem };
        setLoadout({ ...loadout, [activeAgent]: updatedAgent });
        
        // Update Inventory Persistence
        const updatedInventory = inventory.map(i => i.id === updatedItem.id ? updatedItem : i);
        onUpdateInventory(updatedInventory);
    }
  };
  
  const handleAgentNameChange = (newName: string) => {
      const updatedAgent = { ...getCurrentAgentLoadout(), agentName: newName };
      setLoadout({ ...loadout, [activeAgent]: updatedAgent });
  };

  const handleLocationNameChange = (id: string, newName: string) => {
      const updatedLocations = mission.startLocations.map(loc => 
        loc.id === id ? { ...loc, name: newName } : loc
      );
      onUpdateMission({ ...mission, startLocations: updatedLocations });
  };

  const slotLabels: Record<string, string> = {
    suit: 'Traje / Disfarce',
    pistol: 'Arma Oculta',
    gear1: 'Equipamento 1',
    gear2: 'Equipamento 2',
    smuggle: 'Contrabando',
    startingLocationId: 'Infiltração'
  };

  const renderSlot = (key: keyof AgentLoadout) => {
    if (key === 'agentName' || key === 'agentImageUrl') return null;

    const currentAgent = getCurrentAgentLoadout();
    const item = currentAgent[key] as Item | null;
    const isSelected = selectedSlot === key;

    return (
      <div 
        onClick={() => {
            if (isEditing && item) {
                // @ts-ignore
                setSelectedSlot(key);
            } else {
                // @ts-ignore
                setSelectedSlot(isSelected ? null : key);
            }
        }}
        className={`
          relative group border transition-all duration-300 h-40 md:h-48 flex flex-col items-center justify-center p-2
          ${isSelected ? 'border-ica-red bg-ica-red/5' : 'border-gray-800 bg-ica-gray/20 hover:border-gray-500'}
          ${!isEditing && 'cursor-pointer'}
        `}
      >
        <div className="absolute top-1 left-2 text-[9px] uppercase tracking-widest text-gray-500 group-hover:text-ica-red transition-colors">{slotLabels[key]}</div>
        
        {item ? (
          <>
            <div className="w-16 h-16 md:w-20 md:h-20 mb-3 relative flex items-center justify-center">
                <ItemIcon name={item.icon} imageUrl={item.imageUrl} className="w-full h-full object-contain" />
                
                {isEditing && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            // @ts-ignore
                            setSelectedSlot(key);
                            itemImageInputRef.current?.click();
                        }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded z-20"
                        title="Alterar Imagem do Item"
                    >
                        <Camera className="w-6 h-6 text-white" />
                    </button>
                )}
            </div>

            <div className="text-center w-full px-1 z-10">
              {isEditing ? (
                  <input 
                    type="text" 
                    value={item.name}
                    onChange={(e) => handleItemNameChange(key, e.target.value)}
                    className="w-full bg-black/50 border-b border-gray-600 text-xs text-center font-bold uppercase text-white focus:border-ica-red focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
              ) : (
                  <div className="text-xs md:text-sm font-bold uppercase text-white tracking-wider truncate" title={item.name}>{item.name}</div>
              )}
            </div>

            {item.isIllegal && !isEditing && (
              <div className="absolute top-1 right-2 text-ica-red" title="Item Ilegal">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-600 flex flex-col items-center">
             <Plus className="w-8 h-8 mb-2 opacity-50" />
             <span className="text-[10px] uppercase tracking-widest opacity-50">Selecionar</span>
          </div>
        )}
        
        {/* Hover corner effect */}
        {!isEditing && <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-transparent group-hover:border-ica-red transition-all"></div>}
      </div>
    );
  };

  const isDrawerOpen = selectedSlot && selectedSlot !== 'startingLocationId' && !isEditing;

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      
      {/* Hidden File Inputs */}
      <input type="file" ref={itemImageInputRef} onChange={handleItemImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={locationImageInputRef} onChange={handleLocationImageUpload} accept="image/*" className="hidden" />
      <input type="file" ref={agentImageInputRef} onChange={handleAgentImageUpload} accept="image/*" className="hidden" />

      {/* Backdrop for Mobile */}
      {isDrawerOpen && (
          <div className="fixed inset-0 bg-black/80 z-10 lg:hidden" onClick={() => setSelectedSlot(null)}></div>
      )}

      {/* Left: Loadout Configuration */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
        
        {/* Header with Edit Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-b border-gray-800 pb-4 gap-4">
           <div className="flex items-center gap-4">
               <h2 className="text-3xl font-sans font-bold uppercase text-white tracking-tighter">
                Planejamento de Equipe
              </h2>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`
                  flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all
                  ${isEditing 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'}
                `}
              >
                {isEditing ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                <span>{isEditing ? 'Salvar Edição' : 'Editar'}</span>
              </button>
           </div>
           
           <div className="text-right">
             <div className="text-[10px] uppercase text-gray-500 tracking-widest">Local</div>
             <div className="text-lg font-sans uppercase text-white">{mission.location}</div>
          </div>
        </div>

        {/* Agent Selector Tabs */}
        <div className="flex space-x-2 mb-6">
            <button 
                onClick={() => setActiveAgent('agent404')}
                className={`flex-1 py-3 px-4 border-b-2 transition-colors flex items-center justify-center space-x-2
                ${activeAgent === 'agent404' ? 'border-ica-red bg-white/5 text-white' : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'}
                `}
            >
                <Fingerprint className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest">Agente 404</span>
            </button>
            <button 
                onClick={() => setActiveAgent('agent10')}
                className={`flex-1 py-3 px-4 border-b-2 transition-colors flex items-center justify-center space-x-2
                ${activeAgent === 'agent10' ? 'border-ica-red bg-white/5 text-white' : 'border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'}
                `}
            >
                <Users className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest">Agente 10</span>
            </button>
        </div>

        {isEditing && (
            <div className="mb-6 bg-green-900/20 border border-green-900/50 p-3 rounded flex items-center gap-3 animate-in fade-in">
                <Camera className="w-5 h-5 text-green-500" />
                <span className="text-xs text-green-200 font-mono uppercase">
                    Modo Edição: Clique nas imagens para fazer upload. Clique nos textos para renomear. Alterações são salvas no inventário.
                </span>
            </div>
        )}

        <div className="space-y-10">
          
          {/* Section: Agent Dossier */}
          <section className="bg-ica-gray/10 border border-gray-800 p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden transition-all duration-500">
             <div className="absolute top-0 right-0 p-2 opacity-20">
                 {activeAgent === 'agent404' ? <Fingerprint className="w-24 h-24 text-white" /> : <Users className="w-24 h-24 text-white" />}
             </div>
             
             {/* Agent Photo */}
             <div className="relative group shrink-0">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-black border border-gray-700 flex items-center justify-center overflow-hidden shadow-lg">
                    {getCurrentAgentLoadout().agentImageUrl ? (
                        <img src={getCurrentAgentLoadout().agentImageUrl} alt="Agente" className="w-full h-full object-contain" />
                    ) : (
                        <User className="w-20 h-20 text-gray-600" />
                    )}
                </div>
                {isEditing && (
                    <button 
                        onClick={() => agentImageInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                        <Camera className="w-8 h-8 text-white" />
                    </button>
                )}
             </div>

             {/* Agent Details */}
             <div className="flex-1 w-full z-10">
                 <div className="text-[10px] uppercase tracking-widest text-ica-red mb-1 font-bold">Identidade Operativa</div>
                 {isEditing ? (
                     <input 
                        type="text" 
                        value={getCurrentAgentLoadout().agentName || ''}
                        onChange={(e) => handleAgentNameChange(e.target.value)}
                        className="bg-black/50 border-b border-gray-600 text-3xl font-sans font-bold uppercase text-white w-full focus:border-ica-red focus:outline-none"
                        placeholder="NOME DO AGENTE"
                     />
                 ) : (
                     <h2 className="text-3xl md:text-5xl font-sans font-bold uppercase text-white tracking-tighter">
                        {getCurrentAgentLoadout().agentName || 'AGENTE DESCONHECIDO'}
                     </h2>
                 )}
                 <div className="flex items-center space-x-4 mt-4 text-xs font-mono text-gray-500 uppercase">
                     <span>Status: <span className="text-green-500">Ativo</span></span>
                     <span>Clearance: <span className="text-white">Nível 5</span></span>
                     <span>Especialidade: <span className="text-white">{activeAgent === 'agent404' ? 'Infiltração' : 'Apoio Tático'}</span></span>
                 </div>
             </div>
          </section>

          {/* Section: Infiltration (Shared) */}
          <section>
             <h3 className="text-sm font-bold uppercase text-ica-red tracking-widest mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Logística de Infiltração (Equipe)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mission.startLocations.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => handleLocationSelect(loc.id)}
                    className={`
                      relative flex flex-col border transition-all duration-300 h-40 group cursor-pointer overflow-hidden
                      ${loadout.startingLocationId === loc.id && !isEditing
                        ? 'border-ica-red' 
                        : 'border-gray-800 hover:border-gray-600'}
                    `}
                  >
                     {/* Image Background */}
                     <div className="absolute inset-0 bg-black flex items-center justify-center">
                         {loc.imageUrl ? (
                            <img src={loc.imageUrl} alt={loc.name} className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity" />
                         ) : (
                             <Icons.Map className="w-12 h-12 text-gray-700" />
                         )}
                     </div>

                     {/* Edit Overlay for Location */}
                     {isEditing && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div className="flex flex-col items-center text-white">
                                <Camera className="w-8 h-8 mb-2" />
                                <span className="text-[10px] uppercase tracking-widest">Alterar Imagem</span>
                            </div>
                         </div>
                     )}

                     {/* Selection Indicator */}
                     {!isEditing && loadout.startingLocationId === loc.id && (
                         <div className="absolute top-2 right-2 z-10 bg-ica-red text-white p-1 rounded-full shadow-lg">
                             <Check className="w-4 h-4" />
                         </div>
                     )}

                     <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
                        {isEditing ? (
                            <input 
                                value={loc.name}
                                onChange={(e) => handleLocationNameChange(loc.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full bg-transparent border-b border-gray-500 text-sm font-bold uppercase text-white focus:border-ica-red focus:outline-none"
                            />
                        ) : (
                            <span className="text-sm font-bold uppercase text-white tracking-wide block">{loc.name}</span>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono truncate block mt-1">{loc.description}</span>
                     </div>
                  </div>
                ))}
             </div>
          </section>

          {/* Section: Gear */}
          <section>
            <h3 className="text-sm font-bold uppercase text-ica-red tracking-widest mb-4 flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                Equipamento & Armamento
             </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {renderSlot('suit')}
              {renderSlot('pistol')}
              {renderSlot('gear1')}
              {renderSlot('gear2')}
              {renderSlot('smuggle')}
            </div>
          </section>

          {/* Execute Button */}
          <div className="pt-8">
            <button 
              onClick={onSimulate}
              disabled={loading || isEditing}
              className="w-full bg-ica-red hover:bg-red-700 text-white font-bold py-5 px-8 uppercase tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-4 shadow-lg hover:shadow-red-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Conectando aos Agentes...</span>
                </>
              ) : (
                <>
                  <span>Executar Contrato</span>
                  <Crosshair className="w-6 h-6" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-500 mt-3 font-mono">
              AVISO: O status da missão é final após a execução.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Item Selector Drawer */}
      <div className={`
        lg:w-[400px] bg-[#0f0f0f] border-l border-gray-800 p-6 overflow-y-auto transition-transform duration-500 ease-in-out custom-scrollbar
        ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0 lg:w-0 lg:p-0 lg:border-none opacity-0 lg:opacity-100'}
        fixed inset-y-0 right-0 z-20 lg:relative shadow-2xl lg:shadow-none
      `}>
         {isDrawerOpen && (
           <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
                <h3 className="text-xl font-bold uppercase text-white tracking-widest">
                  {/* @ts-ignore */}
                  {slotLabels[selectedSlot]}
                </h3>
                <button onClick={() => setSelectedSlot(null)} className="text-gray-500 hover:text-white hover:rotate-90 transition-all duration-300">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Add New Item Button */}
              <button 
                 onClick={handleCreateItem}
                 className="w-full mb-4 flex items-center justify-center py-3 border border-gray-700 border-dashed hover:border-ica-red hover:text-ica-red transition-all group"
              >
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="text-xs font-bold uppercase tracking-widest">+ Criar Novo</span>
              </button>
              
              <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                {/* @ts-ignore */}
                {getItemsForSlot(selectedSlot).map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleEquip(item)}
                    className="group relative bg-black/40 border border-gray-800 hover:border-ica-red p-3 cursor-pointer flex items-center space-x-3 transition-all hover:bg-gray-900"
                  >
                     <div className="bg-gray-800 p-2 group-hover:bg-ica-red transition-colors duration-300 w-10 h-10 flex items-center justify-center shrink-0">
                       <ItemIcon name={item.icon} imageUrl={item.imageUrl} className="w-5 h-5 text-gray-300 group-hover:text-white" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-bold uppercase text-gray-200 group-hover:text-white truncate">{item.name}</span>
                          <div className="flex items-center space-x-1">
                             {item.isIllegal && (
                                <span title="Item Ilegal" className="shrink-0">
                                  <AlertTriangle className="w-3 h-3 text-ica-red" />
                                </span>
                              )}
                             <button onClick={(e) => handleDeleteItem(e, item.id)} className="text-gray-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight line-clamp-2 group-hover:text-gray-400">{item.description}</p>
                     </div>
                  </div>
                ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default PlanningView;