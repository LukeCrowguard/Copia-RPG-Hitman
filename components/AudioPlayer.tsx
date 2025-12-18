
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Repeat, Upload, Plus, AlertCircle, Trash2, Music, Edit2, Check, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { AudioTrack } from '../constants';

interface AudioPlayerProps {
  tracks: AudioTrack[];
  onAddTrack: (file: File, category: 'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX') => void;
  onRemoveTrack: (id: string) => void;
  categoryNames: Record<string, string>;
  onUpdateCategoryName: (key: string, name: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ tracks, onAddTrack, onRemoveTrack, categoryNames, onUpdateCategoryName }) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [activeSfxId, setActiveSfxId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [volume, setVolume] = useState(0.5);
  const [error, setError] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [dragOverCategory, setDragOverCategory] = useState<'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX' | null>(null);
  
  // Primary Audio (Music)
  const audioRef = useRef<HTMLAudioElement>(null);
  // Secondary Audio (SFX) - completely separate channel
  const sfxAudioRef = useRef<HTMLAudioElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState<'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX' | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempCategoryName, setTempCategoryName] = useState('');

  // Handle Master Volume & Music Loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = isLooping;
    }
    // Share volume with SFX
    if (sfxAudioRef.current) {
        sfxAudioRef.current.volume = volume;
    }
  }, [volume, isLooping]);

  // Handle Music Playback State
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      setError(false);
      if (audioRef.current.src !== currentTrack.url) {
        audioRef.current.src = currentTrack.url;
        if (isPlaying) {
          audioRef.current.play().catch(e => {
             console.error("Audio playback failed", e);
             setIsPlaying(false);
             setError(true);
          });
        }
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current && currentTrack && !error) {
        if (isPlaying) {
            audioRef.current.play().catch(() => setIsPlaying(false));
        } else {
            audioRef.current.pause();
        }
    }
  }, [isPlaying, currentTrack, error]);

  // SFX Playback Function - Fire and Forget (mostly)
  const playSfx = (track: AudioTrack) => {
      if (sfxAudioRef.current) {
          sfxAudioRef.current.src = track.url;
          sfxAudioRef.current.currentTime = 0;
          sfxAudioRef.current.play();
          
          // Visual feedback
          setActiveSfxId(track.id);
          setTimeout(() => setActiveSfxId(null), 300);
      }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const selectTrack = (track: AudioTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setError(false);
    }
  };

  const handleDragOver = (e: React.DragEvent, category: 'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX') => {
      e.preventDefault();
      setDragOverCategory(category);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverCategory(null);
  };

  const handleDrop = (e: React.DragEvent, category: 'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX') => {
      e.preventDefault();
      setDragOverCategory(null);
      const files: File[] = Array.from(e.dataTransfer.files);
      const audioFile = files.find(f => f.type.startsWith('audio/'));
      if (audioFile) {
          onAddTrack(audioFile, category);
      }
  };

  const handleUploadClick = (category: 'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX') => {
    setUploadCategory(category);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadCategory) {
      onAddTrack(file, uploadCategory);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadCategory(null);
  };

  const startEditing = (key: string) => {
      setEditingCategory(key);
      setTempCategoryName(categoryNames[key] || key);
  };

  const saveEditing = (key: string) => {
      onUpdateCategoryName(key, tempCategoryName);
      setEditingCategory(null);
  };

  return (
    <div className={`bg-[#080808] border-t border-gray-800 flex flex-col md:flex-row shrink-0 z-40 relative shadow-[0_-5px_20px_rgba(0,0,0,0.8)] transition-all duration-300 ${isCollapsed ? 'h-16' : 'h-auto md:h-48'}`}>
      <audio 
        ref={audioRef} 
        onEnded={() => !isLooping && setIsPlaying(false)} 
        onError={() => setError(true)}
      />
      <audio ref={sfxAudioRef} /> {/* Dedicated SFX Channel */}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*" className="hidden" />
      
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 border-b-0 rounded-t px-3 py-0.5 text-gray-400 hover:text-white hover:bg-ica-red hover:border-ica-red transition-colors z-50 flex items-center justify-center h-5 w-12"
        title={isCollapsed ? "Expandir Player" : "Minimizar Player"}
      >
        {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* LEFT: MASTER CONTROLS & NOW PLAYING */}
      <div className={`w-full md:w-80 bg-[#0c0c0c] border-r border-gray-800 p-2 md:p-4 flex flex-row md:flex-col justify-between items-center md:items-stretch ${isCollapsed ? 'h-full' : ''}`}>
         
         {/* Display - Condensed when collapsed on Mobile, hidden details */}
         <div className={`bg-black border border-gray-800 rounded p-2 md:p-3 relative overflow-hidden group flex-1 md:flex-none md:mb-4 flex items-center mr-4 md:mr-0 ${isCollapsed ? 'border-none bg-transparent' : ''}`}>
            {!isCollapsed && <div className="absolute inset-0 bg-ica-red/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>}
            
            <div className="flex items-center space-x-3 w-full">
               <div className={`w-10 h-10 flex items-center justify-center border shrink-0 ${isPlaying ? 'border-ica-red text-ica-red' : 'border-gray-700 text-gray-600'} ${isCollapsed ? 'bg-gray-900' : ''}`}>
                  <Music className="w-5 h-5" />
               </div>
               <div className="overflow-hidden flex-1 min-w-0">
                   {!isCollapsed && (
                       <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest truncate">Canal de Áudio</span>
                            {isPlaying && !error && <span className="flex space-x-0.5"><span className="w-0.5 h-2 bg-ica-red animate-pulse"></span><span className="w-0.5 h-3 bg-ica-red animate-pulse delay-75"></span><span className="w-0.5 h-2 bg-ica-red animate-pulse delay-150"></span></span>}
                       </div>
                   )}
                   <div className={`text-sm font-bold uppercase truncate ${error ? 'text-red-500' : 'text-white'}`} title={currentTrack?.name}>
                     {error ? 'Erro de Arquivo' : (currentTrack ? currentTrack.name : 'Aguardando Seleção...')}
                   </div>
                   {!isCollapsed && (
                       <div className="text-[10px] text-gray-500 font-mono truncate">
                         {currentTrack ? `${categoryNames[currentTrack.category]} // MP3` : '--:--'}
                       </div>
                   )}
               </div>
            </div>
         </div>

         {/* Transport Controls */}
         <div className="flex items-center justify-end md:justify-between space-x-4 md:space-x-0">
            <button 
              onClick={togglePlay}
              disabled={!currentTrack || error}
              className={`bg-white hover:bg-gray-200 text-black rounded-full flex items-center justify-center transition-all disabled:opacity-50 shadow-lg shadow-white/10 ${isCollapsed ? 'w-8 h-8' : 'w-12 h-12'}`}
            >
               {isPlaying ? <Pause className={`${isCollapsed ? 'w-3 h-3' : 'w-5 h-5'} fill-current`} /> : <Play className={`${isCollapsed ? 'w-3 h-3' : 'w-5 h-5'} fill-current ml-0.5`} />}
            </button>

            {!isCollapsed && (
                <div className="hidden md:block flex-1 mx-4 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <Volume2 className="w-3 h-3" />
                    <span>{Math.round(volume * 100)}%</span>
                </div>
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-ica-red"
                />
                </div>
            )}

            {!isCollapsed && (
                <button 
                onClick={() => setIsLooping(!isLooping)}
                className={`p-2 rounded border hidden md:block ${isLooping ? 'border-ica-red text-ica-red bg-ica-red/10' : 'border-gray-700 text-gray-500 hover:text-white'}`}
                title="Loop Track"
                >
                <Repeat className="w-4 h-4" />
                </button>
            )}
         </div>
      </div>

      {/* RIGHT: TRACK DECKS - Hidden when collapsed */}
      {!isCollapsed && (
          <div className="flex-1 overflow-x-auto custom-scrollbar flex animate-in fade-in zoom-in-95 duration-300">
            {(['AMBIENCE', 'TENSION', 'ACTION', 'SFX'] as const).map((category) => (
                <div 
                key={category} 
                className={`
                    flex-1 min-w-[160px] border-r border-gray-800 p-2 flex flex-col relative transition-colors group/col
                    ${dragOverCategory === category ? 'bg-ica-red/20' : 'hover:bg-white/5'}
                    ${category === 'SFX' ? 'bg-[#150505] border-l border-red-900/20' : ''}
                `}
                onDragOver={(e) => handleDragOver(e, category)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category)}
                >
                {/* Header with Edit */}
                <div className="flex items-center justify-between mb-2 px-2 pt-2 h-8">
                    {editingCategory === category ? (
                        <div className="flex items-center space-x-1 w-full">
                            <input 
                                autoFocus
                                value={tempCategoryName}
                                onChange={(e) => setTempCategoryName(e.target.value)}
                                onBlur={() => saveEditing(category)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEditing(category)}
                                className="bg-gray-800 text-white text-[10px] font-bold uppercase w-full px-1 border border-gray-600 focus:border-ica-red outline-none"
                            />
                            <button onClick={() => saveEditing(category)} className="text-green-500"><Check className="w-3 h-3" /></button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 group-hover/col:text-white transition-colors">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${category === 'SFX' ? 'text-ica-red' : 'text-gray-400'}`}>
                                {categoryNames[category]}
                            </span>
                            <button onClick={() => startEditing(category)} className="opacity-0 group-hover/col:opacity-100 text-gray-600 hover:text-white transition-opacity">
                                <Edit2 className="w-3 h-3" />
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={() => handleUploadClick(category)}
                        className="text-gray-500 hover:text-white" 
                        title="Adicionar (Upload)"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Drop Zone Indicator */}
                {dragOverCategory === category && (
                    <div className="absolute inset-0 border-2 border-dashed border-ica-red bg-black/80 z-20 flex items-center justify-center">
                        <span className="text-ica-red font-bold uppercase tracking-widest text-xs animate-pulse pointer-events-none">Soltar Arquivo</span>
                    </div>
                )}

                {/* Track List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 p-1">
                    {tracks.filter(t => t.category === category).map(track => (
                        <div 
                            key={track.id} 
                            className={`
                            group relative flex items-center justify-between p-2 rounded cursor-pointer border transition-all duration-100
                            ${currentTrack?.id === track.id && category !== 'SFX'
                                ? 'bg-gray-800 border-ica-red' 
                                : activeSfxId === track.id ? 'bg-ica-red text-white border-white scale-[1.02] shadow-[0_0_15px_rgba(255,0,60,0.5)] z-10' : 'bg-black/40 border-gray-800 hover:border-gray-600'}
                            `}
                            onClick={() => category === 'SFX' ? playSfx(track) : selectTrack(track)}
                        >
                            <div className="flex items-center min-w-0">
                            {/* Icon Changes based on category */}
                            {category === 'SFX' ? (
                                <Zap className={`w-3 h-3 mr-2 shrink-0 ${activeSfxId === track.id ? 'text-white fill-current' : 'text-gray-600 group-hover:text-ica-red'}`} />
                            ) : (
                                currentTrack?.id === track.id && isPlaying ? (
                                    <div className="w-1.5 h-1.5 bg-ica-red rounded-full mr-2 animate-pulse shrink-0"></div>
                                ) : (
                                    <Play className="w-2 h-2 text-gray-500 mr-2 shrink-0 opacity-0 group-hover:opacity-100" />
                                )
                            )}
                            
                            <span className={`text-xs truncate font-mono ${currentTrack?.id === track.id && category !== 'SFX' ? 'text-white font-bold' : 'text-gray-400'}`}>
                                {track.name}
                            </span>
                            </div>
                            
                            <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id); }}
                            className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                            >
                            <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    {tracks.filter(t => t.category === category).length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-700 select-none">
                            <Upload className="w-6 h-6 mb-2 opacity-20" />
                            <span className="text-[9px] uppercase">Arraste MP3</span>
                        </div>
                    )}
                </div>
                </div>
            ))}
          </div>
      )}
    </div>
  );
};

export default AudioPlayer;
