
import { Item, TeamLoadout, AgentLoadout } from './types';

// Icons will be mapped in the component layer to Lucide icons
export const SUITS: Item[] = [
  { id: 's1', name: 'Terno Emblemático', description: 'O clássico terno preto com gravata vermelha. Profissional, elegante, mortal.', type: 'SUIT', icon: 'User', isIllegal: false },
  { id: 's2', name: 'Terno Requiem', description: 'Um terno branco imaculado. Para funerais, geralmente do seu alvo.', type: 'SUIT', icon: 'User', isIllegal: false },
  { id: 's3', name: 'Terno Italiano', description: 'Linho leve, perfeito para a costa de Amalfi ou climas tropicais.', type: 'SUIT', icon: 'Sun', isIllegal: false },
  { id: 's4', name: 'Traje Tático de Mergulho', description: 'Para operações anfíbias. Ajuste perfeito e furtivo.', type: 'SUIT', icon: 'Anchor', isIllegal: false },
  { id: 's5', name: 'Traje de Palhaço', description: 'Guerra psicológica pura. Eles nunca esperam o palhaço.', type: 'SUIT', icon: 'Smile', isIllegal: false },
];

export const PISTOLS: Item[] = [
  { id: 'p1', name: 'ICA19 Silverballer', description: 'Pistola .45 ACP personalizada. Silenciada. Mira Estável.', type: 'PISTOL', icon: 'Crosshair', isIllegal: true },
  { id: 'p2', name: 'ICA19 Black Lily', description: 'Uma variante escura e elegante da pistola clássica.', type: 'PISTOL', icon: 'Crosshair', isIllegal: true },
  { id: 'p3', name: 'HWK21 Pale', description: 'Silenciador caseiro. Alta capacidade de munição.', type: 'PISTOL', icon: 'Crosshair', isIllegal: true },
  { id: 'p4', name: 'Krugermeier 2-2', description: 'Subsônica. Extremamente silenciosa, baixo dano.', type: 'PISTOL', icon: 'VolumeX', isIllegal: true },
  { id: 'p5', name: 'Concept 5', description: 'Design futurista. Barulhenta, mas poderosa.', type: 'PISTOL', icon: 'Zap', isIllegal: true },
];

export const GEAR: Item[] = [
  { id: 'g1', name: 'Corda de Piano', description: 'A escolha do profissional. Estrangulamento silencioso.', type: 'MELEE', icon: 'ChevronsRight', isIllegal: false },
  { id: 'g2', name: 'Lockpick Mk III', description: 'Abre portas trancadas silenciosamente.', type: 'TOOL', icon: 'Unlock', isIllegal: false },
  { id: 'g3', name: 'Moedas (3)', description: 'Distrai inimigos com som.', type: 'TOOL', icon: 'Circle', isIllegal: false },
  { id: 'g4', name: 'Frasco de Veneno Letal', description: 'Elimina o alvo instantaneamente se consumido.', type: 'POISON', icon: 'Skull', isIllegal: true },
  { id: 'g5', name: 'Veneno Emético', description: 'Induz vômito. Move o alvo para um banheiro isolado.', type: 'POISON', icon: 'Droplet', isIllegal: true },
  { id: 'g6', name: 'Pato de Borracha Explosivo', description: 'Quack quack. Boom.', type: 'EXPLOSIVE', icon: 'Bomb', isIllegal: false },
  { id: 'g7', name: 'Carga de Demolição', description: 'Abre portas com explosão. Pode causar "acidentes".', type: 'EXPLOSIVE', icon: 'Maximize', isIllegal: true },
  { id: 'g8', name: 'Decodificador Eletrônico', description: 'Hackeia fechaduras eletrônicas.', type: 'TOOL', icon: 'Wifi', isIllegal: true },
  { id: 'g9', name: 'Maleta da ICA', description: 'Pode esconder itens ilegais grandes (ex: Snipers).', type: 'TOOL', icon: 'Briefcase', isIllegal: false },
];

export const SNIPERS: Item[] = [
  { id: 'sn1', name: 'Sieger 300 Ghost', description: 'Rifle sniper subsônico. Zoom 4x. Indetectável.', type: 'SNIPER', icon: 'Crosshair', isIllegal: true },
  { id: 'sn2', name: 'Jaeger 7', description: 'Rifle sniper padrão da agência.', type: 'SNIPER', icon: 'Crosshair', isIllegal: true },
];

const DEFAULT_AGENT_404: AgentLoadout = {
    agentName: 'Agente 404',
    agentImageUrl: undefined,
    suit: SUITS[0],
    pistol: PISTOLS[0],
    gear1: GEAR[0],
    gear2: GEAR[2],
    smuggle: null
};

const DEFAULT_AGENT_10: AgentLoadout = {
    agentName: 'Agente 10',
    agentImageUrl: undefined,
    suit: SUITS[2],
    pistol: PISTOLS[3], // Krugermeier
    gear1: GEAR[1], // Lockpick
    gear2: GEAR[5], // Duck
    smuggle: null
};

export const DEFAULT_LOADOUT: TeamLoadout = {
  agent404: DEFAULT_AGENT_404,
  agent10: DEFAULT_AGENT_10,
  startingLocationId: null,
};

export interface AudioTrack {
  id: string;
  name: string;
  url: string; // Blob URL for playback
  blob?: Blob; // Stored for persistence
  category: 'AMBIENCE' | 'TENSION' | 'ACTION' | 'SFX';
}

// Lista vazia para permitir apenas uploads do usuário
export const DEFAULT_TRACKS: AudioTrack[] = [];
