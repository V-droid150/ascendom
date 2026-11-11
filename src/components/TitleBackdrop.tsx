import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { PixelArt } from '@/sprites/PixelArt';
import { NPC_HEIGHT, npcArt, npcColors, npcPoseAt, TITLE_NPCS, type NpcSpec } from '@/sprites/npcs';
import {
  paintTitleScene,
  TITLE_DAY_COLORS,
  TITLE_NIGHT_COLORS,
  SPIRE_FLAG_ROWS,
  TITLE_NPC_LANES,
  titleSceneScaleFor,
} from '@/sprites/titleScene';
import {
  driftX,
  flockAt,
  highCloudX,
  shootingStarArt,
  shootingStarAt,
  TITLE_BIRD_ART,
  TITLE_CLOUD_ART,
  titleClouds,
  titleForeground,
  titleHighClouds,
} from '@/sprites/titleSky';
import { duration, makeStyles } from '@/theme';

interface TitleBackdropProps {
  width: number;
  height: number;
  /** Day or night, from the real clock. */
  daytime: boolean;
  /** Screen y of the logo's bottom edge; the castle stays below it. 0 = default. */
  skyBottom: number;
  reduceMotion: boolean;
}

/**
 * The castle and its courtyard behind the title screen, with townsfolk walking
 * past. Purely decorative: hidden from screen readers and from touches.
 *
 * The NPCs step one scene pixel at a time on a fixed tick, the stepped motion
 * the rest of the app uses, and stand still under reduced motion.
 */
export function TitleBackdrop({
  width,
  height,
  daytime,
  skyBottom,
  reduceMotion,
}: TitleBackdropProps) {
  const styles = useStyles();
  const scale = titleSceneScaleFor(height);
  const cols = Math.ceil(width / scale);
  const rows = Math.ceil(height / scale);

  // The scene is bottom-anchored, so screen y maps to row y / scale plus the
  // rows cropped off the top. Keep the flag a couple of pixels under the logo.
  const cropRows = rows - height / scale;
  const spireTip =
    skyBottom > 0 ? Math.ceil(skyBottom / scale + cropRows) + SPIRE_FLAG_ROWS + 2 : undefined;
  const scene = useMemo(() => paintTitleScene(cols, rows, spireTip), [cols, rows, spireTip]);
  const sceneColors = daytime ? TITLE_DAY_COLORS : TITLE_NIGHT_COLORS;
  const crowd = useMemo(() => TITLE_NPCS.map((spec) => ({ spec, colors: npcColors(spec) })), []);
  // Drawn over the clouds and birds, so they pass behind the castle and hills.
  const foreground = useMemo(() => titleForeground(scene.art), [scene.art]);
  const clouds = useMemo(() => titleClouds(scene), [scene]);
  const highClouds = useMemo(() => titleHighClouds(scene), [scene]);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setTick((current) => current + 1), duration.fast);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  if (width === 0 || height === 0) return null;

  // Anchor the courtyard to the bottom edge; any overhang crops off the sky.
  const left = Math.floor((width - scene.width * scale) / 2);
  const top = height - scene.height * scale;

  const walker = (spec: NpcSpec, colors: Readonly<Record<string, string>>) => {
    const pose = npcPoseAt(spec, reduceMotion ? 0 : tick, scene.width);
    const feetRow = scene.groundY + TITLE_NPC_LANES[spec.lane];
    return (
      <View
        key={spec.id}
        style={[
          styles.layer,
          { left: left + pose.x * scale, top: top + (feetRow - NPC_HEIGHT + 1) * scale },
        ]}
      >
        <PixelArt
          art={npcArt(spec.kind, spec.direction, pose.frame)}
          colors={colors}
          scale={scale}
        />
      </View>
    );
  };

  // Under reduced motion the sky holds still: clouds where they start, no
  // birds or shooting stars.
  const skyTick = reduceMotion ? 0 : tick;
  const at = (x: number, y: number) => [
    styles.layer,
    { left: left + x * scale, top: top + y * scale },
  ];
  const star = daytime || reduceMotion ? null : shootingStarAt(scene, tick);

  return (
    <View
      style={styles.backdrop}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.layer, { left, top }]}>
        <PixelArt art={scene.art} colors={sceneColors} scale={scale} />
      </View>
      {clouds.map((cloud, index) => {
        const art = TITLE_CLOUD_ART[cloud.shape] ?? [];
        const x = driftX(cloud.start, cloud.speed, skyTick, scene.width, art[0]?.length ?? 0);
        return (
          <View key={`cloud-${index}`} style={at(x, cloud.row)}>
            <PixelArt art={art} colors={sceneColors} scale={scale} />
          </View>
        );
      })}
      {highClouds.map((cloud, index) => (
        <View key={`high-${index}`} style={at(highCloudX(cloud, skyTick), cloud.row)}>
          <PixelArt art={TITLE_CLOUD_ART[cloud.shape] ?? []} colors={sceneColors} scale={scale} />
        </View>
      ))}
      {daytime &&
        !reduceMotion &&
        flockAt(scene, tick).map((bird, index) => (
          <View key={`bird-${index}`} style={at(bird.x, bird.y)}>
            <PixelArt art={TITLE_BIRD_ART[bird.frame] ?? []} colors={sceneColors} scale={scale} />
          </View>
        ))}
      {star && (
        <View style={at(star.x, star.y - star.trail)}>
          <PixelArt art={shootingStarArt(star.trail)} colors={sceneColors} scale={scale} />
        </View>
      )}
      <View style={[styles.layer, { left, top }]}>
        <PixelArt art={foreground} colors={sceneColors} scale={scale} />
      </View>
      {crowd.map(({ spec, colors }) => walker(spec, colors))}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' },
  layer: { position: 'absolute' },
}));
