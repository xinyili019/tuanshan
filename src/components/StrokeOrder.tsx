import HanziWriter from "hanzi-writer";
import { useEffect, useId, useMemo, useRef } from "react";

interface StrokeOrderProps {
  character: string;
  visible: boolean;
}

export function StrokeOrder({ character, visible }: StrokeOrderProps) {
  const id = useId().replace(/:/g, "");
  const writerRefs = useRef<HanziWriter[]>([]);
  const targetId = `stroke-${id}`;
  const characters = useMemo(() => Array.from(character).filter((char) => /\p{Script=Han}/u.test(char)), [character]);

  useEffect(() => {
    if (!visible || characters.length === 0) return;

    writerRefs.current = characters.map((char, index) =>
      HanziWriter.create(`${targetId}-${index}`, char, {
        width: 144,
        height: 144,
        padding: 10,
        showOutline: true,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 120,
        radicalColor: "#C1440E"
      })
    );

    let cancelled = false;

    async function animateCharacters() {
      for (const writer of writerRefs.current) {
        if (cancelled) return;
        await writer.animateCharacter();
      }
    }

    void animateCharacters();

    return () => {
      cancelled = true;
    };
  }, [targetId, characters, visible]);

  if (!visible || characters.length === 0) return null;

  return (
    <div className="stroke-order-grid" aria-label={`Stroke order for ${character}`}>
      {characters.map((char, index) => (
        <div key={`${char}-${index}`} className="stroke-order-item">
          <div id={`${targetId}-${index}`} className="stroke-order" aria-label={`Stroke order for ${char}`} />
          <span>{char}</span>
        </div>
      ))}
    </div>
  );
}
