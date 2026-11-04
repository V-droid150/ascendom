import { View } from 'react-native';
import { PixelArt } from '@/sprites/PixelArt';
import { shopItemArt } from '@/sprites/items';
import { makeStyles } from '@/theme';

/** Item art is at most 14x17 with its outline; 3x keeps it crisp at ~50px. */
const ICON_SCALE = 3;
const BOX = 56;

/** The pixel-art picture of a shop item, centred in a fixed square. */
export function ShopItemIcon({ id }: { id: string }) {
  const styles = useStyles();
  const { art, colors } = shopItemArt(id);

  return (
    <View style={styles.box} accessibilityElementsHidden importantForAccessibility="no">
      <PixelArt art={art} colors={colors} scale={ICON_SCALE} />
    </View>
  );
}

const useStyles = makeStyles(() => ({
  box: { width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' },
}));
