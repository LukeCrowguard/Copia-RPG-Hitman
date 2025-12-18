
import React, { useState, useRef } from 'react';
import { Dices, StickyNote, X, Download, Upload, ShieldCheck, FileJson } from 'lucide-react';
import { AppState } from '../services/persistence';

interface ToolsOverlayProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  onImportState: (state: AppState) => void;
  currentState: AppState;
}

const ToolsOverlay: React.FC<ToolsOverlayProps> = ({ notes, onNotesChange, onImportState, currentState }) => {
  const [openTool, setOpenTool] = useState<'DICE' | 'NOTES' | 'FILES' | null>(null);
  const [rollHistory, setRollHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rollDice = (sides: number) => {
    const result = Math.floor(Math.random() * sides) + 1;
    const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setRollHistory(prev => [`[${timestamp}] d${sides}: ${result}`, ...prev].slice(0, 10));
  };

  const handleExport = () => {
      // Create a clean serializable copy
      const exportData = {
          ...currentState,
          tracks: currentState.tracks.map(t => ({ id: t.id, name: t.name, category: t.category })),
          lastUpdated: Date.now()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ICA_DOSSIER_${new Date().toISOString().split('T')[0]}.ica`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const imported = JSON.parse(event.target?.result as string);
                  onImportState(imported);
                  setOpenTool(null);
              } catch (err) {
                  alert("Arquivo inválido ou corrompido.");
              }
          };
          reader.readAsText(file);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      {/* Floating Buttons */}
      <div className="fixed bottom-56 right-6 flex flex-col space-y-4 z-50">
        <button 
          onClick={() => setOpenTool(openTool === 'DICE' ? null : 'DICE')}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${openTool === 'DICE' ? 'bg-ica-red text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
          title="Rolar Dados"
        >
          <Dices className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setOpenTool(openTool === 'FILES' ? null : 'FILES')}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${openTool === 'FILES' ? 'bg-ica-red text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
          title="Sincronizar Dossiê"
        >
          <FileJson className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setOpenTool(openTool === 'NOTES' ? null : 'NOTES')}
          className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all ${openTool === 'NOTES' ? 'bg-ica-red text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'}`}
          title="Bloco de Notas"
        >
          <StickyNote className="w-6 h-6" />
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleImport} accept=".ica,.json" className="hidden" />

      {/* Panels */}
      {openTool === 'FILES' && (
          <div className="fixed bottom-56 right-20 w-64 bg-black/95 border border-gray-700 rounded-lg p-5 shadow-2xl z-50 animate-in slide-in-from-right-10 border-l-4 border-l-ica-red">
            <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-2 text-ica-red" />
                    Sincronização
                </h3>
                <button onClick={() => setOpenTool(null)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
            </div>
            
            <p className="text-[10px] text-gray-500 font-mono mb-4 uppercase leading-tight">Mova seu progresso entre dispositivos através de arquivos criptografados da ICA.</p>
            
            <div className="space-y-3">
                <button 
                    onClick={handleExport}
                    className="w-full flex items-center justify-between p-3 bg-gray-900 border border-gray-800 hover:border-ica-red hover:text-white text-gray-400 transition-all group"
                >
                    <span className="text-xs font-bold uppercase tracking-widest">Exportar Dossiê</span>
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-between p-3 bg-gray-900 border border-gray-800 hover:border-green-600 hover:text-white text-gray-400 transition-all group"
                >
                    <span className="text-xs font-bold uppercase tracking-widest">Importar Dossiê</span>
                    <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                </button>
            </div>
          </div>
      )}

      {openTool === 'DICE' && (
        <div className="fixed bottom-56 right-20 w-64 bg-black/90 border border-gray-700 rounded-lg p-4 shadow-2xl z-50 animate-in slide-in-from-right-10">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Rolagem Tática</h3>
            <button onClick={() => setOpenTool(null)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
             {[4, 6, 8, 10, 12, 20, 100].map(d => (
               <button 
                 key={d}
                 onClick={() => rollDice(d)}
                 className="bg-gray-800 hover:bg-ica-red text-gray-300 hover:text-white py-2 rounded text-xs font-mono font-bold transition-colors"
               >
                 d{d}
               </button>
             ))}
          </div>

          <div className="bg-black/50 p-2 rounded h-32 overflow-y-auto custom-scrollbar font-mono text-xs">
             {rollHistory.length === 0 ? (
               <div className="text-gray-600 text-center mt-10">Histórico Vazio</div>
             ) : (
               rollHistory.map((roll, i) => (
                 <div key={i} className="text-green-500 mb-1 border-b border-gray-800/50 pb-1">{roll}</div>
               ))
             )}
          </div>
        </div>
      )}

      {openTool === 'NOTES' && (
        <div className="fixed bottom-56 right-20 w-72 md:w-96 bg-black/90 border border-gray-700 rounded-lg p-4 shadow-2xl z-50 animate-in slide-in-from-right-10">
          <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Intel do Mestre</h3>
            <button onClick={() => setOpenTool(null)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Anotações da missão..."
            className="w-full h-48 bg-gray-900/50 text-gray-300 text-sm font-mono p-3 border border-gray-800 focus:border-ica-red focus:outline-none resize-none"
          />
        </div>
      )}
    </>
  );
};

export default ToolsOverlay;
