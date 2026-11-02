import { Redirect } from 'expo-router';
import { useGameStore } from '@/store/gameStore';

/** Sends first-time users through onboarding and everyone else to the quests tab. */
export default function Index() {
  const onboarded = useGameStore((state) => state.onboarded);
  return <Redirect href={onboarded ? '/(tabs)/quests' : '/(onboarding)/welcome'} />;
}
