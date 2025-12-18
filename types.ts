
export type ItemType = 'PISTOL' | 'MELEE' | 'POISON' | 'EXPLOSIVE' | 'TOOL' | 'SNIPER' | 'SUIT';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  icon: string; // Lucide icon name mapping
  isIllegal: boolean;
  capacity?: number;
  imageUrl?: string; // Custom user uploaded image
}

export interface StartLocation {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface AgentLoadout {
  agentName?: string;
  agentImageUrl?: string;
  suit: Item;
  pistol: Item | null;
  gear1: Item | null;
  gear2: Item | null;
  smuggle: Item | null;
}

export interface TeamLoadout {
    agent404: AgentLoadout;
    agent10: AgentLoadout;
    startingLocationId: string | null; // Shared starting location
}

export interface Target {
  id: string;
  name: string;
  bio: string;
  imageUrl?: string;
}

export interface Mission {
  id: string;
  codename: string;
  location: string;
  targets: Target[];
  objectives: string[];
  briefingText: string;
  difficulty: 'CASUAL' | 'PROFESSIONAL' | 'MASTER';
  imageUrl?: string;
  startLocations: StartLocation[];
  complications: string[];
}

export interface Evaluation {
  objectivesCompleted: boolean;
  silentAssassin: boolean;
  evidenceDestroyed: boolean;
  nonTargetCasualties: number;
  timeBonus: boolean;
  manualRating?: number; // 0-5 stars set by user
  calculatedMoney: number;
  calculatedScore: number;
}

export interface SimulationResult {
  outcome: 'SILENT ASSASSIN' | 'TARGET ELIMINATED' | 'COMPROMISED' | 'KIA';
  score: number;
  narrative: string;
  details: string[];
  stats: {
    stealth: number;
    aggression: number;
    technique: number;
  };
  evaluation?: Evaluation; // New field for manual grading
}
