import { Circle, Text } from 'react-konva';
import { LatexLabel } from '@/components/builder/LatexLabel';
import type { GraphObject } from '@/types/canvas';
import { parseEquation, findIntersections } from '@/lib/equations';

interface Props {
  graph: GraphObject;
  toPixel: (x: number, y: number) => { px: number; py: number };
}

export function PointsRenderer({ graph, toPixel }: Props) {
  const { points, plots, annotations, graphSettings: s } = graph;
  const elements: React.ReactNode[] = [];

  // User-defined coordinate points
  points.forEach((pt, i) => {
    const { px, py } = toPixel(pt.x, pt.y);
    elements.push(
      <Circle
        key={`pt-${i}`}
        x={px} y={py}
        radius={4}
        fill={pt.style === 'filled' ? pt.color : 'white'}
        stroke={pt.color}
        strokeWidth={1.5}
        listening={false}
      />
    );
    if (pt.showLabel && pt.label) {
      elements.push(
        <LatexLabel
          key={`ptl-${i}`}
          x={px + 6}
          y={py - 10}
          text={pt.label}
          fontSize={10}
          fontFamily="Arial"
          fill={pt.color}
          listening={false}
        />
      );
    }
  });

  // Intersection points between all pairs of explicit plots
  if (annotations.showIntersections && plots.length >= 2) {
    for (let i = 0; i < plots.length; i++) {
      for (let j = i + 1; j < plots.length; j++) {
        const p1 = parseEquation(plots[i].equation);
        const p2 = parseEquation(plots[j].equation);

        if (p1.type !== 'explicit' || !p1.evalY) continue;
        if (p2.type !== 'explicit' || !p2.evalY) continue;

        const intersections = findIntersections(
          p1.evalY, p2.evalY,
          s.xMin, s.xMax, 800
        );

        intersections.forEach((pt, k) => {
          const { px, py } = toPixel(pt.x, pt.y);
          elements.push(
            <Circle
              key={`int-${i}-${j}-${k}`}
              x={px} y={py}
              radius={4}
              fill="white"
              stroke="#333"
              strokeWidth={1.5}
              listening={false}
            />
          );
          if (annotations.intersectionLabels) {
            elements.push(
              <Text
                key={`intl-${i}-${j}-${k}`}
                x={px + 6}
                y={py - 12}
                text={`(${pt.x}, ${pt.y})`}
                fontSize={9}
                fontFamily="Arial"
                fill="#333"
                listening={false}
              />
            );
          }
        });
      }
    }
  }

  return <>{elements}</>;
}
