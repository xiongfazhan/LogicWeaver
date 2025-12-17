/**
 * BranchEdge Property Tests
 * **Feature: universal-sop-architect, Property 10: Flowchart Edge Styling**
 * **Validates: Requirements 9.3**
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { ReactFlowProvider } from '@xyflow/react';
import { BranchEdge } from './BranchEdge';
import type { BranchEdgeData } from './types';
import type { Position } from '@xyflow/react';
afterEach(() => {
  cleanup();
});
const FC_CONFIG = { numRuns: 100 };
const PASS_STROKE_COLOR = '#10b981';
const FAIL_STROKE_COLOR = '#ef4444';
const coordinateArb = fc.integer({ min: 50, max: 500 });
const positionArb: fc.Arbitrary<Position> = fc.constantFrom(
  'top' as Position,
  'bottom' as Position,
  'left' as Position,
  'right' as Position
);
const passEdgeDataArb: fc.Arbitrary<BranchEdgeData> = fc.record({
  edgeType: fc.constant('pass' as const),
  label: fc.option(fc.constant('Pass'), { nil: undefined }),
});
const failEdgeDataArb: fc.Arbitrary<BranchEdgeData> = fc.record({
  edgeType: fc.constant('fail' as const),
  label: fc.option(fc.constantFrom('Fail', 'Reject'), { nil: undefined }),
});
const anyEdgeDataArb: fc.Arbitrary<BranchEdgeData> = fc.oneof(
  passEdgeDataArb,
  failEdgeDataArb
);
interface EdgeTestProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  data: BranchEdgeData;
}
const edgePropsArb = (dataArb: fc.Arbitrary<BranchEdgeData>): fc.Arbitrary<EdgeTestProps> =>
  fc.record({
    id: fc.uuid(),
    sourceX: coordinateArb,
    sourceY: coordinateArb,
    targetX: coordinateArb,
    targetY: coordinateArb,
    sourcePosition: positionArb,
    targetPosition: positionArb,
    data: dataArb,
  });
function renderBranchEdge(props: EdgeTestProps) {
  cleanup();
  return render(
    <ReactFlowProvider>
      <svg data-testid="edge-svg">
        <BranchEdge {...props} />
      </svg>
    </ReactFlowProvider>
  );
}
describe('BranchEdge Property Tests', () => {
  it('should style pass edges with green stroke color', () => {
    fc.assert(
      fc.property(edgePropsArb(passEdgeDataArb), (props) => {
        const { container } = renderBranchEdge(props);
        const pathElement = container.querySelector('path.react-flow__edge-path');
        expect(pathElement).not.toBeNull();
        const style = pathElement?.getAttribute('style') || '';
        expect(style).toContain(`stroke: ${PASS_STROKE_COLOR}`);
      }),
      FC_CONFIG
    );
  });
  it('should style fail edges with red stroke color', () => {
    fc.assert(
      fc.property(edgePropsArb(failEdgeDataArb), (props) => {
        const { container } = renderBranchEdge(props);
        const pathElement = container.querySelector('path.react-flow__edge-path');
        expect(pathElement).not.toBeNull();
        const style = pathElement?.getAttribute('style') || '';
        expect(style).toContain(`stroke: ${FAIL_STROKE_COLOR}`);
      }),
      FC_CONFIG
    );
  });
  it('should consistently style edges based on edgeType', () => {
    fc.assert(
      fc.property(edgePropsArb(anyEdgeDataArb), (props) => {
        const { container } = renderBranchEdge(props);
        const pathElement = container.querySelector('path.react-flow__edge-path');
        expect(pathElement).not.toBeNull();
        const style = pathElement?.getAttribute('style') || '';
        const expectedColor = props.data.edgeType === 'pass' ? PASS_STROKE_COLOR : FAIL_STROKE_COLOR;
        expect(style).toContain(`stroke: ${expectedColor}`);
      }),
      FC_CONFIG
    );
  });
  it('should have consistent stroke width for all edges', () => {
    fc.assert(
      fc.property(edgePropsArb(anyEdgeDataArb), (props) => {
        const { container } = renderBranchEdge(props);
        const pathElement = container.querySelector('path.react-flow__edge-path');
        expect(pathElement).not.toBeNull();
        const style = pathElement?.getAttribute('style') || '';
        expect(style).toContain('stroke-width: 2');
      }),
      FC_CONFIG
    );
  });
});
