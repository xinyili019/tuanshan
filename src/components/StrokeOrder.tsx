import HanziWriter from "hanzi-writer";
import { useEffect, useId, useRef } from "react";

interface StrokeOrderProps {
  character: string;
  visible: boolean;
}

export function StrokeOrder({ character, visible }: StrokeOrderProps) {
  const id = useId().replace(/:/g, "");
  const writerRef = useRef<HanziWriter | null>(null);
  const targetId = `stroke-${id}`;
  const firstCharacter = Array.from(character).find((char) => /\p{Script=Han}/u.test(char));

  useEffect(() => {
    if (!visible || !firstCharacter) return;

    writerRef.current = HanziWriter.create(targetId, firstCharacter, {
      width: 148,
      height: 148,
      padding: 10,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 120,
      radicalColor: "#C1440E"
    });
    writerRef.current.animateCharacter();
  }, [targetId, firstCharacter, visible]);

  if (!visible || !firstCharacter) return null;

  return <div id={targetId} className="stroke-order" aria-label={`Stroke order for ${firstCharacter}`} />;
}
