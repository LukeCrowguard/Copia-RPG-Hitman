
import { GoogleGenAI, Type } from "@google/genai";
import { TeamLoadout, Mission, SimulationResult, StartLocation, Target, AgentLoadout } from '../types.ts';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-3-flash-preview';

export const generateMission = async (): Promise<Mission> => {
  const prompt = `Gere um contrato único e complexo para um RPG de mesa baseado em Hitman: World of Assassination. O local deve ser atmosférico e cheio de oportunidades.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: "Você é Diana Burnwood, Handler da ICA. Fale Português do Brasil. Seja profissional, sombria e tática.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            codename: { type: Type.STRING },
            location: { type: Type.STRING },
            targets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  bio: { type: Type.STRING }
                },
                required: ['name', 'bio']
              }
            },
            objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
            briefingText: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['CASUAL', 'PROFESSIONAL', 'MASTER'] },
            startLocations: {
              type: Type.ARRAY,
              items: { 
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['name', 'description']
              }
            },
            complications: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['codename', 'location', 'targets', 'objectives', 'briefingText', 'difficulty', 'startLocations', 'complications']
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      const typedStartLocations: StartLocation[] = data.startLocations.map((loc: any) => ({
          id: crypto.randomUUID(),
          name: loc.name,
          description: loc.description,
          imageUrl: undefined
      }));
      const typedTargets: Target[] = data.targets.map((t: any) => ({
        id: crypto.randomUUID(),
        name: t.name,
        bio: t.bio,
        imageUrl: undefined
      }));
      return { id: crypto.randomUUID(), ...data, targets: typedTargets, startLocations: typedStartLocations, imageUrl: `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}` };
    }
    throw new Error("No data returned");
  } catch (error) {
    return {
      id: 'fallback',
      codename: 'OPERAÇÃO: QUEDA SILENCIOSA',
      location: 'Paris, França',
      targets: [{ id: 't1', name: 'Viktor Novikov', bio: 'Oligarca e líder da IAGO.' }],
      objectives: ['Recuperar os Arquivos', 'Escapar'],
      briefingText: 'Boa noite, 404.',
      difficulty: 'PROFESSIONAL',
      startLocations: [{ id: 'sl1', name: 'Tapete Vermelho', description: 'Entrada VIP' }],
      complications: ['Não pacificar civis'],
      imageUrl: 'https://picsum.photos/800/400'
    };
  }
};

const formatAgentLoadout = (agent: AgentLoadout): string => {
    return `- Agente: ${agent.agentName || 'Desconhecido'} | Traje: ${agent.suit?.name} | Arma: ${agent.pistol?.name || 'Nenhuma'}`;
};

export const simulateMission = async (mission: Mission, loadout: TeamLoadout): Promise<SimulationResult> => {
  const prompt = `Simule a missão RPG "${mission.codename}" com Agente 404 e Agente 10.`;
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outcome: { type: Type.STRING, enum: ['SILENT ASSASSIN', 'TARGET ELIMINATED', 'COMPROMISED', 'KIA'] },
            score: { type: Type.NUMBER },
            narrative: { type: Type.STRING },
            details: { type: Type.ARRAY, items: { type: Type.STRING } },
            stats: {
              type: Type.OBJECT,
              properties: {
                stealth: { type: Type.NUMBER },
                aggression: { type: Type.NUMBER },
                technique: { type: Type.NUMBER }
              },
              required: ['stealth', 'aggression', 'technique']
            }
          },
          required: ['outcome', 'score', 'narrative', 'details', 'stats']
        }
      }
    });
    if (response.text) {
      const result = JSON.parse(response.text) as SimulationResult;
      result.evaluation = { objectivesCompleted: result.outcome !== 'KIA', silentAssassin: result.outcome === 'SILENT ASSASSIN', evidenceDestroyed: true, nonTargetCasualties: 0, timeBonus: true, calculatedMoney: 0, calculatedScore: result.score };
      return result;
    }
    throw new Error("Failed");
  } catch (error) {
    return { outcome: 'COMPROMISED', score: 0, narrative: 'Erro na simulação.', details: [], stats: { stealth: 0, aggression: 0, technique: 0 } };
  }
};
