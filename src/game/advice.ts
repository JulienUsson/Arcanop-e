import { ACTION_ICONS, ACTION_LABELS, actionMultiplier, CLASSES } from './classes';
import { describeCard, nemesisActions, nextFury, powerAvailability } from './engine';
import { getCard, getNemesis } from './nemesis';
import type { Action, GameState } from './types';

export interface Advice {
  icon: string;
  text: string;
  urgent?: boolean;
}

export function councilAdvice(state: GameState): Advice[] {
  const out: Advice[] = [];
  const nemesis = getNemesis(state.config.nemesisId);
  const treeRatio = state.tree.hp / state.tree.maxHp;
  const nemesisRatio = state.nemesis.hp / state.nemesis.maxHp;
  const turns = nemesisActions(state.config);

  for (const root of [...state.roots].sort((a, b) => a.countdown - b.countdown)) {
    const card = getCard(state.config.nemesisId, root.cardId);
    if (root.countdown <= turns) {
      out.push({
        icon: '⚠️',
        urgent: true,
        text: `${card.name} éclot à la riposte de ${nemesis.name}, juste après cette volée (${describeCard(card, state).replace('À l’éclosion : ', '')}). Il lui reste ${root.hp} PV.`,
      });
    } else {
      out.push({ icon: '🌿', text: `${card.name} éclot dans ${root.countdown} tour${root.countdown > 1 ? 's' : ''} de la Némésis (${root.hp} PV).` });
    }
  }

  const creatures = [...state.creatures].sort((a, b) => a.hp - b.hp);
  for (const creature of creatures) {
    const card = getCard(state.config.nemesisId, creature.cardId);
    const effect = describeCard(card, state);
    out.push({ icon: '🐾', text: `${card.name} (${creature.hp} PV) — ${effect.charAt(0).toLowerCase()}${effect.slice(1)}.` });
  }

  for (const p of state.players) {
    if (p.hp <= 0) {
      out.push({ icon: '🩹', urgent: true, text: `${p.name} est à terre : ses flèches et son pouvoir comptent moitié. Le Cerf et l’Ours peuvent le soigner.` });
    } else if (p.hp <= p.maxHp * 0.35) {
      out.push({ icon: '🩹', text: `${p.name} est blessé (${p.hp}/${p.maxHp} PV).` });
    }
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

  out.push({
    icon: '🃏',
    text: `Après la volée, ${nemesis.name} riposte : ${turns > 1 ? `${turns} cartes de colère` : 'une carte de colère'}, puis ses créatures agissent et ses racines grandissent.`,
  });
  if (state.wrathDeck.length > 0) {
    out.push({ icon: '📜', text: `Paquet de colère : ${state.wrathDeck.length} carte${state.wrathDeck.length > 1 ? 's' : ''} avant sa Furie finale.` });
  } else {
    const fury = nextFury(state);
    out.push({
      icon: '🔥',
      urgent: true,
      text: `Furie finale : à chaque tour de Némésis, ${fury.tree} dégâts à l’Arbre-Cœur et ${fury.archers} à chaque Gardien, de plus en plus. Achevez-la vite !`,
    });
  }
  return [...out.filter((a) => a.urgent), ...out.filter((a) => !a.urgent)];
}

export interface Suggestion {
  action: Action;
  reason: string;
  target?: string;
}

export function suggestion(state: GameState, playerId: string): Suggestion | null {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return null;
  const has = (a: Action) => actionMultiplier(player.classId, a) > 0;
  const urgentRoot = state.roots.some((r) => r.countdown <= nemesisActions(state.config));
  let action: Action = CLASSES[player.classId].specialty === 'heal' ? 'nemesis' : CLASSES[player.classId].specialty;
  let reason = action === 'nemesis' ? 'Frappez la Némésis.' : 'Misez sur votre spécialité.';
  const down = state.players.find((p) => p.hp <= 0);
  if (has('heal') && state.tree.hp / state.tree.maxHp <= 0.4) {
    action = 'heal';
    reason = 'L’Arbre-Cœur a besoin de soins.';
  } else if (has('heal') && down) {
    return { action: 'heal', target: down.id, reason: `${down.name} est à terre : relevez-le.` };
  } else if (has('roots') && urgentRoot) {
    action = 'roots';
    reason = 'Une racine va éclore.';
  } else if (has('creatures') && state.creatures.length > 0 && (player.classId === 'ours' || state.creatures.length > 1)) {
    action = 'creatures';
    reason = 'Les créatures frappent à chaque tour de la Némésis.';
  } else if (has('roots') && state.roots.length > 0 && player.classId === 'hibou') {
    action = 'roots';
    reason = 'Détruisez les racines avant qu’elles n’éclosent.';
  } else if (action !== 'nemesis' && ((action === 'creatures' && state.creatures.length === 0) || (action === 'roots' && state.roots.length === 0))) {
    action = 'nemesis';
    reason = 'Rien d’autre à viser : frappez la Némésis.';
  } else if (has('heal') && state.tree.hp / state.tree.maxHp <= 0.7) {
    action = 'heal';
    reason = 'Gardez l’Arbre-Cœur en forme.';
  }
  return { action, reason };
}

export function describeSuggestion(s: Suggestion): string {
  return `${ACTION_ICONS[s.action]} ${ACTION_LABELS[s.action]}`;
}
