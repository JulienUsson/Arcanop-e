import { ACTION_ICONS, ACTION_LABELS, CLASSES } from './classes';
import { describeCard, powerAvailability } from './engine';
import { getCard, getNemesis } from './nemesis';
import type { Action, GameState, Quadrant } from './types';

export interface Advice {
  icon: string;
  text: string;
  urgent?: boolean;
}

const QUADRANT_NAMES = ['haut-gauche', 'haut-droit', 'bas-gauche', 'bas-droit'];

export function councilAdvice(state: GameState): Advice[] {
  const out: Advice[] = [];
  const nemesis = getNemesis(state.config.nemesisId);
  const treeRatio = state.tree.hp / state.tree.maxHp;
  const nemesisRatio = state.nemesis.hp / state.nemesis.maxHp;
  const endingRound = state.turnDeck.length === 0;

  for (const root of [...state.roots].sort((a, b) => a.countdown - b.countdown)) {
    const card = getCard(state.config.nemesisId, root.cardId);
    if (root.countdown <= 1) {
      out.push({
        icon: '⚠️',
        urgent: true,
        text: `${card.name} éclot ${endingRound ? 'à la fin de cette manche' : 'en fin de manche'} (${describeCard(card, state).replace('À l’éclosion : ', '')}). Il lui reste ${root.hp} PV.`,
      });
    } else {
      out.push({ icon: '🌿', text: `${card.name} éclot dans ${root.countdown} manches (${root.hp} PV).` });
    }
  }

  const creatures = [...state.creatures].sort((a, b) => a.hp - b.hp);
  for (const creature of creatures) {
    const card = getCard(state.config.nemesisId, creature.cardId);
    const effect = describeCard(card, state);
    out.push({ icon: '🐾', text: `${card.name} (${creature.hp} PV) — ${effect.charAt(0).toLowerCase()}${effect.slice(1)}.` });
  }

  if (treeRatio <= 0.4) out.push({ icon: '🌳', urgent: true, text: `L’Arbre-Cœur faiblit (${state.tree.hp} PV) : le Cerf et l’Ours peuvent le soigner.` });
  if (state.wolfBoost > 0) out.push({ icon: '🐺', text: 'La Meute chasse : cette volée inflige des dégâts doublés.' });
  if (nemesisRatio <= 0.25) out.push({ icon: '💀', text: `${nemesis.name} vacille (${state.nemesis.hp} PV) : concentrez le tir sur elle !` });

  for (const p of state.players) {
    if (powerAvailability(state, p.id).ok) {
      const cls = CLASSES[p.classId];
      out.push({ icon: cls.emoji, text: `${p.name} peut lancer ${cls.powerName}.` });
    }
  }

  const nemesisTurns = state.turnDeck.filter((c) => c === 'nemesis').length;
  if (state.turnDeck.length > 0) {
    out.push({
      icon: '🃏',
      text: `Encore ${state.turnDeck.length} carte${state.turnDeck.length > 1 ? 's' : ''} dans cette manche, dont ${nemesisTurns} tour${nemesisTurns > 1 ? 's' : ''} de la Némésis.`,
    });
  }
  out.push({ icon: '📜', text: `Paquet de colère : ${state.wrathDeck.length} carte${state.wrathDeck.length > 1 ? 's' : ''} avant l’épuisement.` });
  return out;
}

export interface Suggestion {
  action: Action;
  quadrants: Quadrant[];
  reason: string;
}

export function suggestion(state: GameState, playerId: string): Suggestion | null {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;
  const quadrants = CLASSES[player.classId].quadrants;
  const has = (a: Action) => quadrants.includes(a);
  const urgentRoot = state.roots.some((r) => r.countdown <= 1);
  let action: Action = 'nemesis';
  let reason = 'Frappez la Némésis.';
  if (has('heal') && state.tree.hp / state.tree.maxHp <= 0.4) {
    action = 'heal';
    reason = 'L’Arbre-Cœur a besoin de soins.';
  } else if (has('roots') && urgentRoot) {
    action = 'roots';
    reason = 'Une racine va éclore.';
  } else if (has('creatures') && state.creatures.length > 0 && (player.classId === 'ours' || state.creatures.length > 1)) {
    action = 'creatures';
    reason = 'Les créatures frappent à chaque manche.';
  } else if (has('roots') && state.roots.length > 0 && player.classId === 'hibou') {
    action = 'roots';
    reason = 'Détruisez les racines avant qu’elles n’éclosent.';
  } else if (has('heal') && state.tree.hp / state.tree.maxHp <= 0.7) {
    action = 'heal';
    reason = 'Gardez l’Arbre-Cœur en forme.';
  }
  return { action, reason, quadrants: quadrants.flatMap((a, q) => (a === action ? [q as Quadrant] : [])) };
}

export function describeSuggestion(s: Suggestion): string {
  return `${ACTION_ICONS[s.action]} ${ACTION_LABELS[s.action]} (${s.quadrants.map((q) => QUADRANT_NAMES[q]).join(' ou ')})`;
}
