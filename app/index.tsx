import { Redirect } from 'expo-router';

/**
 * Every launch opens on the start screen. It decides where its button goes:
 * into character creation for a new player, straight to the quests for anyone
 * who already has a hero.
 */
export default function Index() {
  return <Redirect href="/(onboarding)/welcome" />;
}
