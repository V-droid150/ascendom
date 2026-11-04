import { SIDE_QUEST_REWARD, SIDE_QUESTS_PER_DAY, STAT_GAIN_PER_COMPLETION } from '../constants';
import { addDaysToKey } from '../dayKey';
import {
  completeSideQuest,
  seededShuffle,
  SIDE_QUEST_POOL,
  sideQuestById,
  sideQuestsForDay,
  undoSideQuest,
} from '../sideQuests';
import { xpToNext } from '../xp';
import { makeHero, TODAY } from './factories';

const ids = (dayKey: string): string[] => sideQuestsForDay(dayKey).map((quest) => quest.id);

describe('side quest selection', () => {
  it('offers SIDE_QUESTS_PER_DAY distinct quests', () => {
    const picks = ids(TODAY);
    expect(picks).toHaveLength(SIDE_QUESTS_PER_DAY);
    expect(new Set(picks).size).toBe(SIDE_QUESTS_PER_DAY);
  });

  it('is deterministic for a given day', () => {
    expect(ids(TODAY)).toEqual(ids(TODAY));
  });

  it('never repeats a quest on two consecutive days', () => {
    let day = TODAY;
    for (let i = 0; i < 400; i += 1) {
      const next = addDaysToKey(day, 1);
      const today = new Set(ids(day));
      expect(ids(next).some((id) => today.has(id))).toBe(false);
      day = next;
    }
  });

  it('visits the whole pool before repeating', () => {
    const cycleDays = SIDE_QUEST_POOL.length / SIDE_QUESTS_PER_DAY;
    const seen = new Set<string>();
    for (let i = 0; i < cycleDays; i += 1) {
      for (const id of ids(addDaysToKey(TODAY, i))) seen.add(id);
    }
    expect(seen.size).toBe(SIDE_QUEST_POOL.length);
  });

  it('works for days before the rotation epoch', () => {
    expect(ids('2020-02-29')).toHaveLength(SIDE_QUESTS_PER_DAY);
  });

  it('handles an empty pool, a zero count, and a count larger than the pool', () => {
    expect(sideQuestsForDay(TODAY, 2, [])).toEqual([]);
    expect(sideQuestsForDay(TODAY, 0)).toEqual([]);
    const tiny = SIDE_QUEST_POOL.slice(0, 1);
    expect(sideQuestsForDay(TODAY, 5, tiny)).toHaveLength(1);
  });

  it('has unique ids in the pool', () => {
    expect(new Set(SIDE_QUEST_POOL.map((q) => q.id)).size).toBe(SIDE_QUEST_POOL.length);
  });

  it('looks quests up by id', () => {
    expect(sideQuestById('stretch')?.stat).toBe('strength');
    expect(sideQuestById('nope')).toBeUndefined();
  });

  it('shuffles without losing or duplicating items, reproducibly', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = seededShuffle(items, 42);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(items);
    expect(seededShuffle(items, 42)).toEqual(shuffled);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe('completing a side quest', () => {
  const quest = SIDE_QUEST_POOL[0]!;

  it('grants the flat reward and a stat point', () => {
    const hero = makeHero();
    const result = completeSideQuest(hero, quest);
    expect(result.xp).toBe(SIDE_QUEST_REWARD.xp);
    expect(result.hero.xp).toBe(hero.xp + SIDE_QUEST_REWARD.xp);
    expect(result.hero.gold).toBe(hero.gold + SIDE_QUEST_REWARD.gold);
    expect(result.hero.stats[quest.stat]).toBe(hero.stats[quest.stat] + STAT_GAIN_PER_COMPLETION);
    expect(result.hero.hp).toBe(hero.hp);
    expect(result.leveledUp).toBe(false);
  });

  it('can level the hero up', () => {
    const hero = makeHero({ xp: xpToNext(1) - 1 });
    const result = completeSideQuest(hero, quest);
    expect(result.leveledUp).toBe(true);
    expect(result.hero.level).toBe(2);
  });

  it('reports a promotion when the level-up crosses a rank', () => {
    const hero = makeHero({ level: 4, xp: xpToNext(4) - 1 });
    expect(completeSideQuest(hero, quest).promoted).toBe(true);
  });

  it('undo returns the hero to where they were', () => {
    const hero = makeHero({ xp: xpToNext(1) - 1, gold: 3 });
    const done = completeSideQuest(hero, quest).hero;
    const undone = undoSideQuest(done, quest);
    expect(undone.level).toBe(hero.level);
    expect(undone.xp).toBe(hero.xp);
    expect(undone.gold).toBe(hero.gold);
    expect(undone.stats).toEqual(hero.stats);
  });

  it('undo never takes gold or stats below zero', () => {
    const hero = makeHero({ gold: 0 });
    const undone = undoSideQuest(hero, quest);
    expect(undone.gold).toBe(0);
    expect(undone.stats[quest.stat]).toBe(0);
  });
});
