import en from '../locales/en.json';
import id from '../locales/id.json';
import { localizedHabitTitle, starterKeyForTitle } from '../starterTitles';

const inIndonesian = (key: string): string => {
  const prefix = 'onboarding.firstQuest.suggestions.';
  return (
    (id.onboarding.firstQuest.suggestions as Record<string, string>)[key.slice(prefix.length)] ??
    key
  );
};

describe('starter quest titles', () => {
  it('recognises a starter title saved in either language', () => {
    expect(starterKeyForTitle(en.onboarding.firstQuest.suggestions.water)).toBe('water');
    expect(starterKeyForTitle(id.onboarding.firstQuest.suggestions.read)).toBe('read');
  });

  it('shows an English starter title in Indonesian', () => {
    const title = localizedHabitTitle(en.onboarding.firstQuest.suggestions.exercise, inIndonesian);
    expect(title).toBe(id.onboarding.firstQuest.suggestions.exercise);
  });

  it('leaves titles the player wrote alone', () => {
    expect(starterKeyForTitle('Feed the cat')).toBeNull();
    expect(localizedHabitTitle('Feed the cat', inIndonesian)).toBe('Feed the cat');
  });

  it('leaves a renamed starter quest alone', () => {
    const renamed = `${en.onboarding.firstQuest.suggestions.water} twice`;
    expect(localizedHabitTitle(renamed, inIndonesian)).toBe(renamed);
  });
});
