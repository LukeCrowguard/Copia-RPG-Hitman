
import { GoogleGenAI, Type } from "@google/genai";
import { TeamLoadout, Mission, SimulationResult, StartLocation, Target, AgentLoadout } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const modelName = 'gemini-2.5-flash';

export const generateMission = async (): Promise<Mission> => {
  const prompt = `Gere um contrato único e complexo para um RPG de mesa baseado em Hitman: World of Assassination.
  O local deve ser atmosférico e cheio de oportunidades.
  
  Forneça:
  1. Dados básicos (Codinome, Local, Briefing).
  2. 1 a 3 Alvos principais, com Nome e Bio curta.
  3. 3 Objetivos principais (além de eliminar os alvos).
  4. 3 "Locais de Início" detalhados. Cada um deve ter um Nome e uma Descrição curta do contexto (ex: "Cozinha" - "Disfarçado de ajudante").
  5. 2 "Complicações".
  
  Responda APENAS com o JSON.`;

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
              },
              description: "Lista de alvos da missão"
            },
            objectives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
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
              },
              description: "3 opções de locais para iniciar a missão"
            },
            complications: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 condições especiais ou restrições para a missão"
            }
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

      return {
        id: crypto.randomUUID(),
        ...data,
        targets: typedTargets,
        startLocations: typedStartLocations,
        imageUrl: `https://picsum.photos/800/400?random=${Math.floor(Math.random() * 1000)}`
      };
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Failed to generate mission", error);
    // Fallback mission
    return {
      id: 'fallback',
      codename: 'OPERAÇÃO: QUEDA SILENCIOSA',
      location: 'Paris, França',
      targets: [
        { id: 't1', name: 'Viktor Novikov', bio: 'Oligarca e líder da IAGO. Arrogante e sempre cercado de seguranças.' },
        { id: 't2', name: 'Dalia Margolis', bio: 'Supermodelo aposentada e mestre de espionagem.' }
      ],
      objectives: ['Recuperar os Arquivos da IAGO', 'Escapar sem ser notado'],
      briefingText: 'Boa noite, 404. Seu destino é o Desfile de Moda Sanguine em Paris. Novikov e Margolis estarão no centro das atenções.',
      difficulty: 'PROFESSIONAL',
      startLocations: [
        { id: 'sl1', name: 'Tapete Vermelho', description: 'Entrada como convidado VIP. Sem armas visíveis.' },
        { id: 'sl2', name: 'Área de Catering', description: 'Disfarçado de garçom. Acesso ao bar e cozinha.' },
        { id: 'sl3', name: 'Jardins do Palácio', description: 'Invasão noturna. Traje tático recomendado.' }
      ],
      complications: ['Não pacificar civis', 'Apenas Headshots'],
      imageUrl: 'https://picsum.photos/800/400'
    };
  }
};

const formatAgentLoadout = (agent: AgentLoadout): string => {
    return `
    - Agente: ${agent.agentName || 'Desconhecido'}
      Traje: ${agent.suit.name}
      Pistola: ${agent.pistol?.name || 'Nenhuma'}
      Equipamento 1: ${agent.gear1?.name || 'Nenhum'}
      Equipamento 2: ${agent.gear2?.name || 'Nenhum'}
      Contrabando: ${agent.smuggle?.name || 'Nenhum'}
    `;
};

export const simulateMission = async (mission: Mission, loadout: TeamLoadout): Promise<SimulationResult> => {
  const startLoc = mission.startLocations.find(l => l.id === loadout.startingLocationId);
  const startLocName = startLoc ? startLoc.name : 'Padrão';

  const targetsList = mission.targets.map(t => t.name).join(' e ');

  const prompt = `Simule a execução da missão RPG "${mission.codename}" em "${mission.location}" com DOIS agentes cooperando.
  
  Alvos: ${targetsList}.
  Complicações Ativas: ${mission.complications.join(', ')}.
  Local de Início (Ambos): ${startLocName}.
  
  EQUIPE:
  ${formatAgentLoadout(loadout.agent404)}
  ${formatAgentLoadout(loadout.agent10)}
  
  Analise como a dupla coopera. O Agente 404 e o Agente 10 podem cobrir fraquezas um do outro.
  Analise como o "Local de Início" afeta a entrada.
  Analise se as "Complicações" foram respeitadas.
  
  Forneça:
  1. Narrativa (180 palavras) em Português do Brasil focada na ação conjunta.
  2. 3 Detalhes chave (ex: quem matou quem, momentos de quase falha).
  3. Stats de RPG (0-100) para Furtividade, Agressividade, Técnica (Da equipe).
  4. Resultado final.`;

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
            details: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
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
      
      // Initialize evaluation with smart defaults based on AI outcome
      result.evaluation = {
        objectivesCompleted: result.outcome !== 'KIA',
        silentAssassin: result.outcome === 'SILENT ASSASSIN',
        evidenceDestroyed: true,
        nonTargetCasualties: result.outcome === 'SILENT ASSASSIN' ? 0 : (result.outcome === 'COMPROMISED' ? 2 : 0),
        timeBonus: true,
        calculatedMoney: 0,
        calculatedScore: result.score
      };
      
      return result;
    }
    throw new Error("Simulation failed");
  } catch (error) {
    console.error("Simulation error", error);
    return {
      outcome: 'COMPROMISED',
      score: 5000,
      narrative: 'Erro na simulação. Conexão perdida com os agentes de campo.',
      details: ['Falha de Comunicação'],
      stats: { stealth: 0, aggression: 0, technique: 0 },
      evaluation: {
        objectivesCompleted: false,
        silentAssassin: false,
        evidenceDestroyed: false,
        nonTargetCasualties: 0,
        timeBonus: false,
        calculatedMoney: 0,
        calculatedScore: 0
      }
    };
  }
};
