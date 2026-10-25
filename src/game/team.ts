import { ARCHER_LEVELS, CLASS_IDS, CLASSES } from './classes';
import { TEAM_SIZE } from './difficulty';
import type { BotSkill, ClassId, PlayerConfig } from './types';

export const BOT_SKILLS: { id: BotSkill; label: string; text: string }[] = [
  { id: 'novice', label: 'Novice', text: 'encore tendre' },
  { id: 'aguerri', label: 'Aguerri', text: 'tir solide' },
  { id: 'veteran', label: 'Vétéran', text: 'redoutable' },
];

export function botName(classId: ClassId): string {
  return `Compagnon ${CLASSES[classId].name}`;
}

export function withBots(players: PlayerConfig[], newId: () => string): PlayerConfig[] {
  const humans = players.filter((p) => !p.bot);
  const bots = players.filter((p) => p.bot).slice(0, Math.max(0, TEAM_SIZE - humans.length));
  while (humans.length + bots.length < TEAM_SIZE) {
    const used = new Set([...humans, ...bots].map((p) => p.classId));
    const classId = CLASS_IDS.find((id) => !used.has(id)) ?? CLASS_IDS[bots.length % CLASS_IDS.length];
    bots.push({ id: `bot-${newId()}`, name: botName(classId), classId, level: 'normal', coef: ARCHER_LEVELS.normal.coef, bot: true, skill: 'aguerri' });
  }
  return [
    ...humans,
    ...bots.map((b) => ({ ...b, name: botName(b.classId), level: 'normal' as const, coef: ARCHER_LEVELS.normal.coef, skill: b.skill ?? 'aguerri' })),
  ];
}
