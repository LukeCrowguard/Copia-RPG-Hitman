
import React, { useState, useEffect } from 'react';
import { SimulationResult, Mission, Evaluation, TeamLoadout, AgentLoadout } from '../types';
import { CheckCircle, AlertTriangle, Skull, Star, RefreshCw, DollarSign, Check, X, Minus, Plus, Sliders, FileText, User, Shield, Clock, EyeOff, Globe } from 'lucide-react';

interface SimulationViewProps {
  result: SimulationResult;
  mission: Mission;
  loadout: TeamLoadout;
  onRestart: () => void;
  onUpdateResult: (result: SimulationResult) => void;
}

const AgentCard: React.FC<{ agent: AgentLoadout }> = ({ agent }) => (
    <div className="bg-black border border-gray-800 flex items-center p-3 relative overflow-hidden group mb-4 last:mb-0">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-ica-red/20 to-transparent"></div>
        <div className="w-16 h-16 bg-gray-900 border border-gray-700 flex items-center justify-center mr-4 shrink-0 relative z-10">
        {agent.agentImageUrl ? (
            <img src={agent.agentImageUrl} alt="Agent" className="w-full h-full object-cover" />
        ) : (
            <User className="w-8 h-8 text-gray-600" />
        )}
        </div>
        <div className="relative z-10 min-w-0">
            <div className="text-[9px] uppercase text-ica-red font-bold tracking-widest mb-0.5">Operativo</div>
            <div className="text-lg font-bold uppercase text-white font-sans tracking-wide truncate">{agent.agentName || 'Desconhecido'}</div>
            <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-[9px] text-gray-500 font-mono truncate">{agent.suit.name}</span>
            </div>
        </div>
    </div>
);

const SimulationView: React.FC<SimulationViewProps> = ({ result, mission, loadout, onRestart, onUpdateResult }) => {
  
  // Local state for the evaluation form, synced with result.evaluation
  const [evalData, setEvalData] = useState<Evaluation>(result.evaluation || {
      objectivesCompleted: true,
      silentAssassin: false,
      evidenceDestroyed: true,
      nonTargetCasualties: 0,
      timeBonus: true,
      calculatedMoney: 0,
      calculatedScore: 0
  });

  const [financials, setFinancials] = useState({
      basePay: 0,
      saBonus: 0,
      timeBonus: 0,
      evidencePenalty: 0,
      casualtyFine: 0,
      total: 0
  });

  // Recalculate Score and Money whenever inputs change
  useEffect(() => {
    let score = 0;
    
    // Financial Breakdown
    let basePay = 0;
    let saBonus = 0;
    let timeBonusVal = 0;
    let evidencePenalty = 0;
    let casualtyFine = 0;

    // Base Mission Pay
    if (evalData.objectivesCompleted) {
        score += 10000;
        basePay = 5000;
    }

    // Silent Assassin Bonus
    if (evalData.silentAssassin) {
        score += 50000;
        saBonus = 10000;
    } else {
        if (result.stats.stealth > 80) score += 5000;
    }

    // Evidence
    if (evalData.evidenceDestroyed) {
        score += 2000;
        basePay += 500; 
    } else {
        score -= 5000; // XP Penalty
        evidencePenalty = 2000; // Cleaning Fee
    }

    // Time Bonus
    if (evalData.timeBonus) {
        score += 10000;
        timeBonusVal = 2000;
    }

    // Casualties Penalty
    const casualtyXP = evalData.nonTargetCasualties * 5000;
    casualtyFine = evalData.nonTargetCasualties * 5000; 
    
    score -= casualtyXP;
    
    const totalMoney = Math.max(0, basePay + saBonus + timeBonusVal - evidencePenalty - casualtyFine);
    score = Math.max(0, score);

    setFinancials({
        basePay,
        saBonus,
        timeBonus: timeBonusVal,
        evidencePenalty,
        casualtyFine,
        total: totalMoney
    });

    // Only update if changed to avoid infinite loop
    if (score !== evalData.calculatedScore || totalMoney !== evalData.calculatedMoney) {
        const newData = { ...evalData, calculatedScore: score, calculatedMoney: totalMoney };
        setEvalData(newData);
        onUpdateResult({ ...result, score: score, evaluation: newData });
    }
  }, [evalData.objectivesCompleted, evalData.silentAssassin, evalData.evidenceDestroyed, evalData.nonTargetCasualties, evalData.timeBonus, result.stats]);

  const toggleField = (field: keyof Evaluation) => {
      setEvalData(prev => ({ ...prev, [field]: !prev[field as keyof Evaluation] }));
  };

  const adjustCasualties = (amount: number) => {
      setEvalData(prev => ({ ...prev, nonTargetCasualties: Math.max(0, prev.nonTargetCasualties + amount) }));
  };

  const updateStat = (stat: 'stealth' | 'aggression' | 'technique', value: number) => {
      const newStats = { ...result.stats, [stat]: value };
      onUpdateResult({ ...result, stats: newStats });
  };

  const getOutcomeTheme = () => {
    if (!evalData.objectivesCompleted) return { color: 'text-ica-red', border: 'border-ica-red', bg: 'bg-ica-red', bgSoft: 'bg-red-900/20', icon: Skull, label: 'MISSÃO FALHOU' };
    if (evalData.silentAssassin) return { color: 'text-green-500', border: 'border-green-500', bg: 'bg-green-500', bgSoft: 'bg-green-900/20', icon: Star, label: 'ASSASSINO SILENCIOSO' };
    
    switch (result.outcome) {
      case 'SILENT ASSASSIN': return { color: 'text-green-500', border: 'border-green-500', bg: 'bg-green-500', bgSoft: 'bg-green-900/20', icon: Star, label: 'ASSASSINO SILENCIOSO' };
      case 'TARGET ELIMINATED': return { color: 'text-white', border: 'border-white', bg: 'bg-white', bgSoft: 'bg-gray-800', icon: CheckCircle, label: 'ALVO ELIMINADO' };
      case 'COMPROMISED': return { color: 'text-yellow-500', border: 'border-yellow-500', bg: 'bg-yellow-500', bgSoft: 'bg-yellow-900/20', icon: AlertTriangle, label: 'COMPROMETIDO' };
      case 'KIA': return { color: 'text-ica-red', border: 'border-ica-red', bg: 'bg-ica-red', bgSoft: 'bg-red-900/20', icon: Skull, label: 'MORTO EM AÇÃO' };
      default: return { color: 'text-white', border: 'border-white', bg: 'bg-white', bgSoft: 'bg-gray-800', icon: CheckCircle, label: 'COMPLETO' };
    }
  };

  const theme = getOutcomeTheme();
  const Icon = theme.icon;

  // Calculate Stars (0 to 5)
  const calculateStars = () => {
      if (!evalData.objectivesCompleted) return 0;
      let stars = 1;
      if (evalData.calculatedScore > 20000) stars = 2;
      if (evalData.calculatedScore > 40000) stars = 3;
      if (evalData.calculatedScore > 60000) stars = 4;
      if (evalData.silentAssassin) stars = 5;
      return stars;
  };
  const starCount = calculateStars();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-black relative">
       
       {/* Background Grid Decoration */}
       <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

       <div className="max-w-7xl mx-auto min-h-full flex flex-col p-4 md:p-8 relative z-10">
         
         {/* HERO HEADER */}
         <div className={`w-full flex flex-col md:flex-row items-stretch border-2 ${theme.border} bg-black/80 backdrop-blur mb-8 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden animate-in slide-in-from-top duration-500`}>
             <div className={`${theme.bg} p-6 md:w-32 flex items-center justify-center shrink-0`}>
                <Icon className="w-16 h-16 text-black" />
             </div>
             <div className="flex-1 p-6 flex flex-col justify-center relative overflow-hidden">
                <div className={`absolute top-0 right-0 p-4 opacity-10 ${theme.color}`}>
                   <Icon className="w-48 h-48 -rotate-12 transform translate-x-10 -translate-y-10" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-[0.5em] text-gray-400 mb-1">Status da Missão</h2>
                <h1 className={`text-4xl md:text-6xl font-sans font-bold uppercase tracking-tighter ${theme.color} relative z-10`}>{theme.label}</h1>
             </div>
             <div className="md:w-64 border-t md:border-t-0 md:border-l border-gray-800 p-6 flex flex-col justify-center bg-gray-900/50">
                <div className="text-[10px] uppercase text-gray-500 tracking-widest mb-2">Classificação</div>
                <div className="flex space-x-1 mb-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-6 h-6 ${s <= starCount ? `${theme.color} fill-current` : 'text-gray-800'}`} />
                    ))}
                </div>
                <div className="text-3xl font-mono text-white tracking-tighter">{evalData.calculatedScore.toLocaleString()} <span className="text-xs text-gray-500">XP</span></div>
             </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Narrative & Agent */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700 delay-100">
                
                {/* Agent Cards */}
                <div>
                     <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Equipe de Campo</h3>
                     <AgentCard agent={loadout.agent404} />
                     <AgentCard agent={loadout.agent10} />
                </div>

                {/* Narrative Log */}
                <div className="bg-ica-gray/10 border-l-2 border-gray-700 p-6 relative">
                    <div className="flex items-center space-x-2 mb-4 border-b border-gray-800 pb-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold uppercase text-gray-500 tracking-widest">Diário de Campo (IA)</span>
                    </div>
                    <p className="font-mono text-gray-300 leading-relaxed text-sm whitespace-pre-line text-justify mb-6">
                    {result.narrative}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {result.details.map((detail, index) => (
                            <span key={index} className="px-2 py-1 bg-black border border-gray-800 text-[10px] text-gray-400 font-mono uppercase tracking-tight">
                                {detail}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Stats Sliders */}
                <div className="bg-black/50 border border-gray-800 p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center mb-6">
                        <Sliders className="w-3 h-3 mr-2" />
                        Telemétria da Equipe
                    </h3>
                    
                    {[
                        { key: 'stealth', label: 'Furtividade', color: 'text-purple-500', bg: 'accent-purple-500' },
                        { key: 'aggression', label: 'Agressividade', color: 'text-ica-red', bg: 'accent-ica-red' },
                        { key: 'technique', label: 'Técnica', color: 'text-blue-500', bg: 'accent-blue-500' }
                    ].map((stat) => (
                    <div key={stat.key} className="mb-5 last:mb-0 group">
                        <div className="flex justify-between text-xs uppercase font-bold tracking-wider mb-2">
                            <span className={`transition-colors ${stat.color}`}>{stat.label}</span>
                            <span className="text-white font-mono">{(result.stats as any)[stat.key]}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={(result.stats as any)[stat.key]}
                            onChange={(e) => updateStat(stat.key as any, parseInt(e.target.value))}
                            className={`w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer ${stat.bg} opacity-70 hover:opacity-100 transition-opacity`}
                        />
                    </div>
                    ))}
                </div>
            </div>

            {/* RIGHT COLUMN: Evaluation & Finance */}
            <div className="lg:col-span-2 space-y-8 animate-in slide-in-from-right duration-700 delay-200">
                
                {/* Evaluation Grid */}
                <div>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase text-white tracking-widest flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-ica-red" />
                            Validação de Contrato
                        </h3>
                        <div className="text-[10px] text-gray-600 font-mono">ID: {mission.id.split('-')[0].toUpperCase()}</div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Toggle Button Component */}
                        <button 
                            onClick={() => toggleField('objectivesCompleted')}
                            className={`p-4 border flex items-center justify-between transition-all group hover:bg-white/5 ${evalData.objectivesCompleted ? 'border-green-800 bg-green-900/10' : 'border-red-900 bg-red-900/10'}`}
                        >
                             <div className="flex items-center space-x-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center ${evalData.objectivesCompleted ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-200'}`}>
                                     <Globe className="w-5 h-5" />
                                 </div>
                                 <div className="text-left">
                                     <div className="text-[10px] uppercase text-gray-500 font-bold">Objetivo Primário</div>
                                     <div className={`text-sm font-bold uppercase ${evalData.objectivesCompleted ? 'text-white' : 'text-red-400'}`}>
                                         {evalData.objectivesCompleted ? 'Cumprido' : 'Falhou'}
                                     </div>
                                 </div>
                             </div>
                             {evalData.objectivesCompleted ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                        </button>

                        <button 
                            onClick={() => toggleField('silentAssassin')}
                            className={`p-4 border flex items-center justify-between transition-all group hover:bg-white/5 ${evalData.silentAssassin ? 'border-yellow-700 bg-yellow-900/10' : 'border-gray-800 bg-gray-900/50'}`}
                        >
                             <div className="flex items-center space-x-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center ${evalData.silentAssassin ? 'bg-yellow-900 text-yellow-400' : 'bg-gray-800 text-gray-600'}`}>
                                     <Shield className="w-5 h-5" />
                                 </div>
                                 <div className="text-left">
                                     <div className="text-[10px] uppercase text-gray-500 font-bold">Classificação</div>
                                     <div className={`text-sm font-bold uppercase ${evalData.silentAssassin ? 'text-white' : 'text-gray-400'}`}>
                                         Silent Assassin
                                     </div>
                                 </div>
                             </div>
                             {evalData.silentAssassin ? <Check className="w-5 h-5 text-yellow-500" /> : <div className="w-5 h-5 border border-gray-700" />}
                        </button>

                        <button 
                            onClick={() => toggleField('evidenceDestroyed')}
                            className={`p-4 border flex items-center justify-between transition-all group hover:bg-white/5 ${evalData.evidenceDestroyed ? 'border-blue-800 bg-blue-900/10' : 'border-gray-800 bg-gray-900/50'}`}
                        >
                             <div className="flex items-center space-x-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center ${evalData.evidenceDestroyed ? 'bg-blue-900 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                                     <EyeOff className="w-5 h-5" />
                                 </div>
                                 <div className="text-left">
                                     <div className="text-[10px] uppercase text-gray-500 font-bold">Vigilância</div>
                                     <div className={`text-sm font-bold uppercase ${evalData.evidenceDestroyed ? 'text-white' : 'text-gray-400'}`}>
                                         Sem Evidências
                                     </div>
                                 </div>
                             </div>
                             {evalData.evidenceDestroyed ? <Check className="w-5 h-5 text-blue-500" /> : <div className="w-5 h-5 border border-gray-700" />}
                        </button>

                        <button 
                            onClick={() => toggleField('timeBonus')}
                            className={`p-4 border flex items-center justify-between transition-all group hover:bg-white/5 ${evalData.timeBonus ? 'border-gray-600 bg-gray-800' : 'border-gray-800 bg-gray-900/50'}`}
                        >
                             <div className="flex items-center space-x-3">
                                 <div className={`w-8 h-8 rounded flex items-center justify-center ${evalData.timeBonus ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-600'}`}>
                                     <Clock className="w-5 h-5" />
                                 </div>
                                 <div className="text-left">
                                     <div className="text-[10px] uppercase text-gray-500 font-bold">Cronômetro</div>
                                     <div className={`text-sm font-bold uppercase ${evalData.timeBonus ? 'text-white' : 'text-gray-400'}`}>
                                         Dentro do Prazo
                                     </div>
                                 </div>
                             </div>
                             {evalData.timeBonus ? <Check className="w-5 h-5 text-white" /> : <div className="w-5 h-5 border border-gray-700" />}
                        </button>

                        {/* Casualty Counter */}
                        <div className="md:col-span-2 p-4 border border-red-900/30 bg-red-900/5 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-900/20 text-red-500 rounded flex items-center justify-center">
                                    <Skull className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[10px] uppercase text-red-400 font-bold">Danos Colaterais</div>
                                    <div className="text-xs text-red-500/60">Multa: M$ 5.000 / vítima civil</div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={() => adjustCasualties(-1)} className="w-8 h-8 flex items-center justify-center bg-black border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-all"><Minus className="w-4 h-4" /></button>
                                <span className="font-mono text-2xl w-8 text-center text-white">{evalData.nonTargetCasualties}</span>
                                <button onClick={() => adjustCasualties(1)} className="w-8 h-8 flex items-center justify-center bg-black border border-gray-700 text-gray-400 hover:text-white hover:border-white transition-all"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>

                     </div>
                </div>

                {/* Financial Statement */}
                <div className="bg-gray-100 text-black font-mono p-6 relative shadow-xl transform rotate-0 md:-rotate-1 transition-transform hover:rotate-0">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#000_4px,#000_8px)] opacity-20"></div>
                    
                    <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-4">
                        <div>
                            <div className="font-bold text-xl uppercase tracking-widest flex items-center">
                                <DollarSign className="w-5 h-5 mr-1" />
                                Transferência ICA
                            </div>
                            <div className="text-[10px] uppercase mt-1">Status: <span className="bg-black text-white px-1">Processado</span></div>
                        </div>
                        <div className="text-right">
                             <div className="text-[10px]">Data: {new Date().toLocaleDateString()}</div>
                             <div className="text-[10px]">Acc: ****-9902</div>
                        </div>
                    </div>

                    <div className="space-y-3 text-xs md:text-sm mb-6">
                        <div className="flex justify-between border-b border-gray-300 pb-1">
                            <span>Pagamento Base da Missão</span>
                            <span>M$ {financials.basePay.toLocaleString()}</span>
                        </div>
                        {financials.saBonus > 0 && (
                            <div className="flex justify-between text-green-700 font-bold border-b border-gray-300 pb-1">
                                <span>Bônus Silent Assassin</span>
                                <span>+ M$ {financials.saBonus.toLocaleString()}</span>
                            </div>
                        )}
                        {financials.timeBonus > 0 && (
                            <div className="flex justify-between text-gray-600 border-b border-gray-300 pb-1">
                                <span>Bônus de Eficiência (Tempo)</span>
                                <span>+ M$ {financials.timeBonus.toLocaleString()}</span>
                            </div>
                        )}
                        {financials.evidencePenalty > 0 && (
                            <div className="flex justify-between text-red-600 border-b border-gray-300 pb-1">
                                <span>Taxa de Limpeza (Evidência)</span>
                                <span>- M$ {financials.evidencePenalty.toLocaleString()}</span>
                            </div>
                        )}
                        {financials.casualtyFine > 0 && (
                            <div className="flex justify-between text-red-600 border-b border-gray-300 pb-1">
                                <span>Indenização (Civil)</span>
                                <span>- M$ {financials.casualtyFine.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center bg-black text-white p-3">
                        <span className="uppercase tracking-widest text-xs font-bold">Total Líquido</span>
                        <span className="text-xl font-bold tracking-tighter">M$ {financials.total.toLocaleString()}</span>
                    </div>

                    <div className="mt-4 text-[9px] text-gray-500 text-center uppercase">
                        Fundos transferidos para conta offshore criptografada.
                    </div>
                </div>

                {/* Footer Action */}
                <div className="flex justify-end pt-4">
                    <button 
                    onClick={onRestart}
                    className="w-full md:w-auto group relative overflow-hidden bg-ica-red hover:bg-white text-white hover:text-black transition-all duration-300 px-8 py-4 shadow-lg"
                    >
                        <div className="absolute inset-0 w-full h-full bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out z-0"></div>
                        <div className="relative z-10 flex items-center justify-center space-x-3">
                            <RefreshCw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-700" />
                            <span className="font-bold uppercase tracking-[0.2em] text-sm">Novo Contrato</span>
                        </div>
                    </button>
                </div>

            </div>

         </div>
       </div>
    </div>
  );
};

export default SimulationView;
