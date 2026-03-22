import Konva from 'konva';
import { jsPDF } from 'jspdf';
import type { Question } from '@/types/question';
import type { WorksheetSettings, WorksheetQuestionSettings } from '@/types/worksheet';
import type { CanvasData } from '@/types/canvas';
import { toSuperscript } from '@/lib/cn';
import { NOTO_SANS_NORMAL_B64, NOTO_SANS_BOLD_B64 } from '@/lib/notoSansFont';
import { tickMarkPoints } from '@/lib/shapeGeometry';

// A4 dimensions in mm
const A4_W = 210;
const A4_H = 297;

// Margins in mm
const MARGIN_LEFT = 18;
const MARGIN_RIGHT = 18;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const CONTENT_W = A4_W - MARGIN_LEFT - MARGIN_RIGHT;

// Fonts / sizes — NotoSans loaded at runtime for full Unicode support
const FONT_NORMAL = 'NotoSans';
const SZ_BODY = 11;
const SZ_SMALL = 9;
const SZ_QNUM = 12;
const SZ_HEADER_TITLE = 16;
const SZ_HEADER_SUB = 10;

// Register NotoSans (full Unicode support) into a jsPDF instance from embedded base64 TTF.
function loadFonts(pdf: jsPDF): void {
  pdf.addFileToVFS('NotoSans-Regular.ttf', NOTO_SANS_NORMAL_B64);
  pdf.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
  pdf.addFileToVFS('NotoSans-Bold.ttf', NOTO_SANS_BOLD_B64);
  pdf.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
}

// ─── Public entry point ────────────────────────────────────────────────────────

export interface ExportItem {
  question: Question;
  settings: WorksheetQuestionSettings;
}

export async function generateWorksheetPDF(
  items: ExportItem[],
  wsSettings: WorksheetSettings,
): Promise<void> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  loadFonts(pdf);
  pdf.setFont(FONT_NORMAL);

  let pageNum = 1;
  let y = MARGIN_TOP;

  const totalMarks = items.reduce((sum, { question: q }) => sum + (q.marks ?? 0), 0);

  // ── Header (first page) ────────────────────────────────────────────────────
  y = drawHeader(pdf, wsSettings, totalMarks, y);
  y += 6;

  // ── Questions ─────────────────────────────────────────────────────────────
  for (let i = 0; i < items.length; i++) {
    const { question: q, settings: qs } = items[i];
    const qNum = qs.question_number ?? i + 1;

    // Render canvas image if canvas_data exists
    let imgDataUrl: string | null = null;
    let imgMmH = 0;
    let imgMmW = 0;

    if (q.canvas_data) {
      const result = await renderCanvasToImage(q.canvas_data);
      if (result) {
        imgDataUrl = result.dataUrl;
        // Scale to at most CONTENT_W wide, but no wider than the cropped content
        const naturalMmW = (result.cropW / (96 / 25.4));
        imgMmW = Math.min(CONTENT_W, naturalMmW);
        imgMmH = (result.cropH / result.cropW) * imgMmW;
      }
    }

    // Estimate block height needed
    const questionTextLines = pdf.setFontSize(SZ_BODY).splitTextToSize(
      toSuperscript(q.question_text || ''), CONTENT_W - 14
    ) as string[];
    const answerLinesMm = qs.include_answer_space ? qs.answer_lines * 7 : 0;
    const blockH = 8 + questionTextLines.length * 5.5 + (imgDataUrl ? imgMmH + 4 : 0) + answerLinesMm + 8;

    // Page break if needed
    if (y + blockH > A4_H - MARGIN_BOTTOM - 10) {
      drawFooter(pdf, pageNum);
      pdf.addPage();
      pageNum++;
      y = MARGIN_TOP;
    }

    // Question number in left margin
    pdf.setFont(FONT_NORMAL, 'bold');
    pdf.setFontSize(SZ_QNUM);
    pdf.text(`${qNum}`, MARGIN_LEFT, y + 1);

    // Mark allocation — right aligned
    const markStr = `(${q.marks} mark${q.marks !== 1 ? 's' : ''})`;
    pdf.setFont(FONT_NORMAL, 'normal');
    pdf.setFontSize(SZ_BODY);
    pdf.text(markStr, A4_W - MARGIN_RIGHT, y + 1, { align: 'right' });

    // Question text — indented
    const textX = MARGIN_LEFT + 10;
    const textW = CONTENT_W - 14;
    pdf.setFont(FONT_NORMAL, 'normal');
    pdf.setFontSize(SZ_BODY);
    const lines = pdf.splitTextToSize(toSuperscript(q.question_text || ''), textW) as string[];
    pdf.text(lines, textX, y + 1);
    y += lines.length * 5.5 + 3;

    // Canvas image — centred on the content area
    if (imgDataUrl && imgMmW > 0) {
      const imgX = MARGIN_LEFT + (CONTENT_W - imgMmW) / 2;

      // Page break if image itself doesn't fit
      if (y + imgMmH > A4_H - MARGIN_BOTTOM - 10) {
        drawFooter(pdf, pageNum);
        pdf.addPage();
        pageNum++;
        y = MARGIN_TOP;
      }

      pdf.addImage(imgDataUrl, 'PNG', imgX, y, imgMmW, imgMmH);
      y += imgMmH + 2;

      // "Diagram NOT accurately drawn" — only if any object has notToScale
      const hasNts = (q.canvas_data?.objects ?? []).some(
        (o) => (o.type === 'shape' || o.type === 'circle-diagram') && (o as { notToScale?: boolean }).notToScale
      );
      if (hasNts) {
        pdf.setFont(FONT_NORMAL, 'italic');
        pdf.setFontSize(SZ_SMALL);
        pdf.text('Diagram NOT accurately drawn', MARGIN_LEFT + CONTENT_W / 2, y, { align: 'center' });
        pdf.setFont(FONT_NORMAL, 'normal');
        y += 5;
      }
    }

    // Answer space
    if (qs.include_answer_space && qs.answer_lines > 0) {
      if (y + qs.answer_lines * 7 > A4_H - MARGIN_BOTTOM - 10) {
        drawFooter(pdf, pageNum);
        pdf.addPage();
        pageNum++;
        y = MARGIN_TOP;
      }
      y = drawAnswerLines(pdf, y, qs.answer_lines);
    }

    // Divider
    pdf.setDrawColor(200);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_LEFT, y + 2, A4_W - MARGIN_RIGHT, y + 2);
    pdf.setDrawColor(0);
    y += 7;
  }

  // Total marks footer line
  if (wsSettings.show_total_marks) {
    if (y + 10 > A4_H - MARGIN_BOTTOM) {
      drawFooter(pdf, pageNum);
      pdf.addPage();
      pageNum++;
      y = MARGIN_TOP;
    }
    pdf.setFont(FONT_NORMAL, 'bold');
    pdf.setFontSize(SZ_BODY);
    pdf.text(`Total marks: ${totalMarks}`, A4_W - MARGIN_RIGHT, y + 4, { align: 'right' });
  }

  drawFooter(pdf, pageNum);

  const filename = `${wsSettings.title || 'worksheet'}.pdf`
    .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-\.]/g, '');
  pdf.save(filename);
}

// ─── Header ───────────────────────────────────────────────────────────────────

function drawHeader(
  pdf: jsPDF,
  s: WorksheetSettings,
  totalMarks: number,
  y: number,
): number {
  // Outer border
  pdf.setDrawColor(0);
  pdf.setLineWidth(0.5);
  pdf.rect(MARGIN_LEFT, y, CONTENT_W, 28);

  // Title
  pdf.setFont(FONT_NORMAL, 'bold');
  pdf.setFontSize(SZ_HEADER_TITLE);
  pdf.text(s.title || 'Maths Worksheet', MARGIN_LEFT + CONTENT_W / 2, y + 8, { align: 'center' });

  // Sub-row: name / date / total marks / calculator
  pdf.setFont(FONT_NORMAL, 'normal');
  pdf.setFontSize(SZ_HEADER_SUB);

  let subY = y + 15;
  const colW = CONTENT_W / 3;

  if (s.name_field) {
    pdf.text('Name:', MARGIN_LEFT + 2, subY);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_LEFT + 14, subY, MARGIN_LEFT + colW - 2, subY);
  }

  if (s.date_field) {
    const dateX = MARGIN_LEFT + colW + 2;
    pdf.text('Date:', dateX, subY);
    pdf.line(dateX + 10, subY, MARGIN_LEFT + colW * 2 - 2, subY);
  }

  // Calculator badge
  const calcX = MARGIN_LEFT + colW * 2 + 2;
  const calcLabel =
    s.calculator === 'calculator' ? 'Calculator'
    : s.calculator === 'non-calculator' ? 'Non-calculator'
    : '';
  if (calcLabel) {
    pdf.setFont(FONT_NORMAL, 'bold');
    pdf.text(calcLabel, calcX, subY);
    pdf.setFont(FONT_NORMAL, 'normal');
  }

  subY += 7;
  if (s.time_allowed) {
    pdf.text(`Time allowed: ${s.time_allowed}`, MARGIN_LEFT + 2, subY);
  }
  if (s.show_total_marks) {
    pdf.setFont(FONT_NORMAL, 'bold');
    pdf.text(`Total marks: ${totalMarks}`, A4_W - MARGIN_RIGHT - 2, subY, { align: 'right' });
    pdf.setFont(FONT_NORMAL, 'normal');
  }

  return y + 30;
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function drawFooter(pdf: jsPDF, pageNum: number) {
  const y = A4_H - MARGIN_BOTTOM + 4;
  pdf.setFont(FONT_NORMAL, 'normal');
  pdf.setFontSize(SZ_SMALL);
  pdf.setTextColor(120);
  pdf.text(`Page ${pageNum}`, A4_W / 2, y, { align: 'center' });
  pdf.setTextColor(0);

  // "Do not write outside the box" border
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.3);
  pdf.rect(8, 8, A4_W - 16, A4_H - 16);
  pdf.setDrawColor(0);
}

// ─── Answer lines ─────────────────────────────────────────────────────────────

function drawAnswerLines(pdf: jsPDF, startY: number, lines: number): number {
  pdf.setDrawColor(180);
  pdf.setLineWidth(0.3);
  for (let i = 0; i < lines; i++) {
    const ly = startY + i * 7 + 5;
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(MARGIN_LEFT + 10, ly, A4_W - MARGIN_RIGHT, ly);
    pdf.setLineDashPattern([], 0);
  }
  pdf.setDrawColor(0);
  return startY + lines * 7 + 5;
}

// ─── Canvas → image ───────────────────────────────────────────────────────────

async function renderCanvasToImage(
  canvasData: CanvasData,
): Promise<{ dataUrl: string; width: number; height: number; cropW: number; cropH: number } | null> {
  if (canvasData.objects.length === 0) return null;

  const SCALE = 2; // retina quality
  const PAD = 24;  // padding around tight bounding box (px at 1x)

  // Compute tight bounding box across all objects
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const obj of canvasData.objects) {
    const x1 = obj.x;
    const y1 = obj.y;
    const x2 = obj.x + obj.width;
    const y2 = obj.y + obj.height;
    if (x1 < minX) minX = x1;
    if (y1 < minY) minY = y1;
    if (x2 > maxX) maxX = x2;
    if (y2 > maxY) maxY = y2;
  }

  // Add padding and clamp to canvas bounds
  minX = Math.max(0, minX - PAD);
  minY = Math.max(0, minY - PAD);
  maxX = Math.min(canvasData.width, maxX + PAD);
  maxY = Math.min(canvasData.height, maxY + PAD);

  const cropW = maxX - minX;
  const cropH = maxY - minY;
  if (cropW <= 0 || cropH <= 0) return null;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${cropW}px`;
  container.style.height = `${cropH}px`;
  document.body.appendChild(container);

  try {
    // Stage at logical 1x size; use pixelRatio on toDataURL for retina quality
    const stage = new Konva.Stage({
      container,
      width: cropW,
      height: cropH,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // White background for the crop region
    layer.add(new Konva.Rect({ x: 0, y: 0, width: cropW, height: cropH, fill: 'white' }));

    // Render each object offset by -minX, -minY so content starts at (0,0)
    await Promise.all(canvasData.objects.map((obj) => renderObjectToLayer(obj, layer, -minX, -minY)));

    layer.draw();

    const dataUrl = stage.toDataURL({ pixelRatio: SCALE });
    stage.destroy();
    return { dataUrl, width: cropW * SCALE, height: cropH * SCALE, cropW, cropH };
  } catch {
    return null;
  } finally {
    document.body.removeChild(container);
  }
}

// ─── Per-object Konva rendering ───────────────────────────────────────────────

async function renderObjectToLayer(obj: CanvasData['objects'][number], layer: Konva.Layer, offsetX = 0, offsetY = 0) {
  const group = new Konva.Group({
    x: obj.x + offsetX,
    y: obj.y + offsetY,
    rotation: obj.rotation,
    scaleX: obj.scaleX,
    scaleY: obj.scaleY,
  });

  if (obj.type === 'shape') {
    await renderShapeToGroup(obj as import('@/types/canvas').ShapeObject, group);
  } else if (obj.type === 'graph') {
    await renderGraphToGroup(obj as import('@/types/canvas').GraphObject, group);
  } else if (obj.type === 'text') {
    const t = obj as import('@/types/canvas').TextObject;
    group.add(new Konva.Text({
      x: 0, y: 0,
      text: t.content,
      fontSize: t.fontSize,
      fontFamily: t.fontFamily,
      fontStyle: `${t.fontStyle === 'italic' ? 'italic' : ''} ${t.fontWeight === 'bold' ? 'bold' : ''}`.trim(),
      fill: t.fill,
      align: t.textAlign,
      width: t.width,
    }));
  } else if (obj.type === 'mark-box') {
    const m = obj as import('@/types/canvas').MarkBoxObject;
    group.add(new Konva.Rect({ x: 0, y: 0, width: m.width, height: m.height, fill: 'white', stroke: '#000', strokeWidth: 1.5 }));
    group.add(new Konva.Text({ x: 0, y: 0, width: m.width, height: m.height, text: `${m.marks}`, fontSize: 11, fontFamily: 'Arial', align: 'center', verticalAlign: 'middle', fill: '#000' }));
  } else if (obj.type === 'circle-diagram') {
    renderCircleDiagramToGroup(obj as import('@/types/canvas').CircleDiagramObject, group);
  } else if (obj.type === 'table') {
    renderTableToGroup(obj as import('@/types/canvas').TableObject, group);
  } else if (obj.type === 'number-line') {
    renderNumberLineToGroup(obj as import('@/types/canvas').NumberLineObject, group);
  } else if (obj.type === 'venn-diagram') {
    renderVennDiagramToGroup(obj as import('@/types/canvas').VennDiagramObject, group);
  } else if (obj.type === 'bar-chart') {
    renderBarChartToGroup(obj as import('@/types/canvas').BarChartObject, group);
  } else if (obj.type === 'pie-chart') {
    renderPieChartToGroup(obj as import('@/types/canvas').PieChartObject, group);
  } else if (obj.type === 'prob-tree') {
    renderProbTreeToGroup(obj as import('@/types/canvas').ProbTreeObject, group);
  } else if (obj.type === 'bearing') {
    renderBearingToGroup(obj as import('@/types/canvas').BearingObject, group);
  }

  layer.add(group);
}

async function renderShapeToGroup(shape: import('@/types/canvas').ShapeObject, group: Konva.Group) {
  const { shapeType, width, height, style, dimensions } = shape;
  const strokeProps = {
    fill: style.fill === 'transparent' ? undefined : style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    dash: style.dashed ? [6, 3] : undefined,
  };

  const w = width, h = height;
  const col = style.stroke, sw = style.strokeWidth;
  const dash = [5, 3];

  const edge = (pts: number[], dashed = false) =>
    group.add(new Konva.Line({ points: pts, stroke: col, strokeWidth: sw, dash: dashed ? dash : undefined }));

  const lbl = (i: number) => {
    const s = dimensions.sides[i];
    return s?.showLabel ? (s.label ?? '') : '';
  };

  const labelNode = (x: number, y: number, text: string) =>
    group.add(new Konva.Text({ x: x - 20, y: y - 8, text, fontSize: 11, fontFamily: 'Arial', fill: col, align: 'center', width: 40 }));

  if (shapeType === 'circle') {
    const r = dimensions.radius ?? w / 2;
    group.add(new Konva.Circle({ x: r, y: r, radius: r, ...strokeProps }));
  } else if (shapeType === 'semicircle') {
    const r = dimensions.radius ?? w / 2;
    group.add(new Konva.Arc({ x: r, y: r, innerRadius: 0, outerRadius: r, angle: 180, ...strokeProps }));
  } else if (shapeType === 'sector') {
    const r = dimensions.radius ?? w / 2;
    const angle = dimensions.sectorAngle ?? 90;
    group.add(new Konva.Wedge({ x: r, y: r, radius: r, angle, rotation: -90, ...strokeProps }));

  } else if (shapeType === 'cuboid') {
    const ox = w * 0.28, oy = h * 0.25;
    const fw = w - ox, fh = h - oy;
    const FL_t = [0, oy],       FR_t = [fw, oy];
    const FL_b = [0, oy + fh],  FR_b = [fw, oy + fh];
    const BL_t = [ox, 0],       BR_t = [ox + fw, 0];
    const BL_b = [ox, fh],      BR_b = [ox + fw, fh];
    const mx = (a: number[], b: number[]) => (a[0] + b[0]) / 2;
    const my = (a: number[], b: number[]) => (a[1] + b[1]) / 2;
    edge([...FL_t, ...FR_t]); edge([...FR_t, ...FR_b]); edge([...FR_b, ...FL_b]); edge([...FL_b, ...FL_t]);
    edge([...FL_t, ...BL_t]); edge([...BL_t, ...BR_t]); edge([...BR_t, ...FR_t]);
    edge([...FR_b, ...BR_b]); edge([...BR_b, ...BR_t]);
    edge([...BL_t, ...BL_b], true); edge([...BL_b, ...BR_b], true); edge([...BL_b, ...FL_b], true);
    if (lbl(0)) labelNode(mx(FL_b, FR_b), oy + fh + 14, lbl(0));
    if (lbl(1)) labelNode(mx(BR_t, FR_t) + 20, my(BR_t, FR_t) - 22, lbl(1));
    if (lbl(2)) labelNode(FR_t[0] + 24, my(FR_t, FR_b), lbl(2));

  } else if (shapeType === 'cone') {
    const cx = w / 2, eRx = w / 2, eRy = h * 0.13;
    const baseY = h - eRy;
    edge([cx, 0, 0, baseY]); edge([cx, 0, w, baseY]);
    // Front half of base ellipse (solid) — approximate with arc points
    const ellipsePts = (fromAngle: number, toAngle: number, rx: number, ry: number, ex: number, ey: number) => {
      const pts: number[] = [];
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const a = fromAngle + (toAngle - fromAngle) * (i / steps);
        pts.push(ex + Math.cos(a) * rx, ey + Math.sin(a) * ry);
      }
      return pts;
    };
    group.add(new Konva.Line({ points: ellipsePts(0, Math.PI, eRx, eRy, cx, baseY), stroke: col, strokeWidth: sw }));
    group.add(new Konva.Line({ points: ellipsePts(Math.PI, Math.PI * 2, eRx, eRy, cx, baseY), stroke: col, strokeWidth: sw, dash }));
    if (lbl(0)) labelNode(cx, baseY + eRy + 14, lbl(0));
    if (lbl(1)) labelNode(cx * 0.25, baseY * 0.45, lbl(1));
    if (lbl(2)) labelNode(w + 22, baseY / 2 - 4, lbl(2));

  } else if (shapeType === 'cylinder') {
    const cx = w / 2, eRx = w / 2, eRy = h * 0.13;
    const topY = eRy, botY = h - eRy;
    const ellipsePts = (fromAngle: number, toAngle: number, rx: number, ry: number, ex: number, ey: number) => {
      const pts: number[] = [];
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const a = fromAngle + (toAngle - fromAngle) * (i / steps);
        pts.push(ex + Math.cos(a) * rx, ey + Math.sin(a) * ry);
      }
      return pts;
    };
    // Top ellipse full
    group.add(new Konva.Line({ points: ellipsePts(0, Math.PI * 2, eRx, eRy, cx, topY), stroke: col, strokeWidth: sw, closed: true }));
    // Bottom front half solid, back half dashed
    group.add(new Konva.Line({ points: ellipsePts(0, Math.PI, eRx, eRy, cx, botY), stroke: col, strokeWidth: sw }));
    group.add(new Konva.Line({ points: ellipsePts(Math.PI, Math.PI * 2, eRx, eRy, cx, botY), stroke: col, strokeWidth: sw, dash }));
    edge([0, topY, 0, botY]); edge([w, topY, w, botY]);
    if (lbl(0)) labelNode(cx, topY - eRy - 14, lbl(0));
    if (lbl(1)) labelNode(w + 22, (topY + botY) / 2, lbl(1));

  } else if (shapeType === 'frustum') {
    const cx = w / 2;
    const topRx = w * 0.25, topRy = h * 0.09;
    const botRx = w / 2,    botRy = h * 0.13;
    const topY = topRy,     botY = h - botRy;
    const ellipsePts = (fromAngle: number, toAngle: number, rx: number, ry: number, ex: number, ey: number) => {
      const pts: number[] = [];
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const a = fromAngle + (toAngle - fromAngle) * (i / steps);
        pts.push(ex + Math.cos(a) * rx, ey + Math.sin(a) * ry);
      }
      return pts;
    };
    group.add(new Konva.Line({ points: ellipsePts(0, Math.PI * 2, topRx, topRy, cx, topY), stroke: col, strokeWidth: sw, closed: true }));
    group.add(new Konva.Line({ points: ellipsePts(0, Math.PI, botRx, botRy, cx, botY), stroke: col, strokeWidth: sw }));
    group.add(new Konva.Line({ points: ellipsePts(Math.PI, Math.PI * 2, botRx, botRy, cx, botY), stroke: col, strokeWidth: sw, dash }));
    edge([cx - topRx, topY, cx - botRx, botY]); edge([cx + topRx, topY, cx + botRx, botY]);
    if (lbl(0)) labelNode(cx, topY - topRy - 14, lbl(0));
    if (lbl(1)) labelNode(cx, botY + botRy + 14, lbl(1));
    if (lbl(2)) labelNode(cx + botRx + 8, (topY + botY) / 2, lbl(2));

  } else if (shapeType === 'triangular-prism') {
    const ox = w * 0.42, oy = h * 0.22;
    const ftA = [w * 0.05, h * 0.78], ftB = [w * 0.48, h * 0.78], ftC = [w * 0.26, h * 0.18];
    const btA = [ftA[0] + ox, ftA[1] - oy];
    const btB = [ftB[0] + ox, ftB[1] - oy];
    const btC = [ftC[0] + ox, ftC[1] - oy];
    const mx = (a: number[], b: number[]) => (a[0] + b[0]) / 2;
    const my = (a: number[], b: number[]) => (a[1] + b[1]) / 2;
    edge([...ftA, ...ftB]); edge([...ftB, ...ftC]); edge([...ftC, ...ftA]);
    edge([...ftC, ...btC]); edge([...ftB, ...btB]); edge([...ftA, ...btA]);
    edge([...btC, ...btB]); edge([...btC, ...btA]);
    edge([...btA, ...btB], true);
    if (lbl(0)) labelNode(mx(ftA, ftB), ftA[1] + 14, lbl(0));
    if (lbl(1)) labelNode(mx(ftA, ftC) - 16, my(ftA, ftC) - 8, lbl(1));
    if (lbl(2)) labelNode(mx(ftC, btC) + 6, my(ftC, btC) - 16, lbl(2));

  } else {
    // 2D polygon shapes — reuse shapeGeometry
    const { getShapePoints, flattenPoints } = await import('@/lib/shapeGeometry');
    const pts = getShapePoints(shapeType, w, h);
    group.add(new Konva.Line({ points: flattenPoints(pts), closed: true, ...strokeProps }));
  }
}

function renderCircleDiagramToGroup(
  diagram: import('@/types/canvas').CircleDiagramObject,
  group: Konva.Group,
) {
  const LABEL_PAD = 24;
  const cx = diagram.radius + LABEL_PAD;
  const cy = diagram.radius + LABEL_PAD;
  const r = diagram.radius;
  const { stroke, strokeWidth } = diagram.style;

  // Build pixel map
  const pixelMap: Record<string, { px: number; py: number }> = {};
  for (const pt of diagram.points) {
    if (pt.position === 'centre') {
      pixelMap[pt.id] = { px: cx, py: cy };
    } else if (pt.position === 'circumference') {
      const rad = ((pt.angleDeg - 90) * Math.PI) / 180;
      pixelMap[pt.id] = { px: cx + r * Math.cos(rad), py: cy + r * Math.sin(rad) };
    } else {
      pixelMap[pt.id] = { px: cx + (pt.externalX ?? 0), py: cy + (pt.externalY ?? 0) };
    }
  }

  // Circle outline
  group.add(new Konva.Circle({
    x: cx, y: cy, radius: r,
    fill: diagram.style.fill === 'transparent' ? undefined : diagram.style.fill,
    stroke, strokeWidth, listening: false,
  }));

  // Line segments
  for (const line of diagram.lines) {
    const from = pixelMap[line.fromPointId];
    const to = pixelMap[line.toPointId];
    if (!from || !to) continue;
    group.add(new Konva.Line({
      points: [from.px, from.py, to.px, to.py],
      stroke, strokeWidth,
      dash: line.style === 'dashed' ? [6, 3] : undefined,
      listening: false,
    }));
  }

  // Tick marks
  for (const line of diagram.lines) {
    if (line.equalTickGroup === null) continue;
    const from = pixelMap[line.fromPointId];
    const to = pixelMap[line.toPointId];
    if (!from || !to) continue;
    const ticks = tickMarkPoints({ x: from.px, y: from.py }, { x: to.px, y: to.py }, line.equalTickGroup);
    for (const pts of ticks) {
      group.add(new Konva.Line({ points: pts, stroke, strokeWidth, listening: false }));
    }
  }

  // Angle arcs + labels
  for (const ang of diagram.angles) {
    const vertex = pixelMap[ang.vertexPointId];
    const from = pixelMap[ang.fromPointId];
    const to = pixelMap[ang.toPointId];
    if (!vertex || !from || !to) continue;
    const toPrev = { x: from.px - vertex.px, y: from.py - vertex.py };
    const toNext = { x: to.px - vertex.px, y: to.py - vertex.py };
    const anglePrev = (Math.atan2(toPrev.y, toPrev.x) * 180) / Math.PI;
    const angleNext = (Math.atan2(toNext.y, toNext.x) * 180) / Math.PI;
    let sweep = angleNext - anglePrev;
    if (sweep < 0) sweep += 360;
    if (sweep > 180) sweep -= 360;
    const arcR = 18;
    if (ang.showArc) {
      group.add(new Konva.Arc({
        x: vertex.px, y: vertex.py,
        innerRadius: arcR, outerRadius: arcR,
        angle: Math.abs(sweep),
        rotation: sweep >= 0 ? anglePrev : anglePrev + sweep,
        stroke: '#000', strokeWidth: 1.2, fill: 'transparent', listening: false,
      }));
    }
    if (ang.showLabel && ang.label) {
      const bisectorAngle = anglePrev + sweep / 2;
      const bisRad = (bisectorAngle * Math.PI) / 180;
      const labelDist = arcR + 10;
      group.add(new Konva.Text({
        x: vertex.px + Math.cos(bisRad) * labelDist - 14,
        y: vertex.py + Math.sin(bisRad) * labelDist - 7,
        text: ang.label, fontSize: 11, fontFamily: 'Arial', fill: '#000',
        align: 'center', width: 28, listening: false,
      }));
    }
  }

  // Point labels + dots
  for (const pt of diagram.points) {
    const { px, py } = pixelMap[pt.id];
    let dx = 0, dy = 0;
    if (pt.position === 'centre') {
      dx = 8; dy = -14;
    } else {
      const vx = px - cx, vy = py - cy;
      const len = Math.sqrt(vx * vx + vy * vy) || 1;
      dx = (vx / len) * 16; dy = (vy / len) * 16;
    }
    group.add(new Konva.Text({
      x: px + dx - 7, y: py + dy - 7,
      text: pt.label, fontSize: 12, fontFamily: 'Arial',
      fontStyle: 'bold', fill: '#000', listening: false,
    }));
    group.add(new Konva.Circle({ x: px, y: py, radius: 3, fill: '#000', listening: false }));
  }
}

function renderTableToGroup(
  table: import('@/types/canvas').TableObject,
  group: Konva.Group,
) {
  const { rows, cols, cells, colWidths, rowHeight, style } = table;

  const colX: number[] = [];
  let cx = 0;
  for (const cw of colWidths) { colX.push(cx); cx += cw; }
  const totalW = cx;
  const totalH = rows * rowHeight;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = cells[r]?.[c];
      const x = colX[c];
      const y = r * rowHeight;
      const cw = colWidths[c];
      const shaded = cell?.shaded || (style.headerRow && r === 0) || (style.headerCol && c === 0);
      group.add(new Konva.Rect({ x, y, width: cw, height: rowHeight, fill: shaded ? '#d0d0d0' : '#ffffff', listening: false }));
      if (cell?.content) {
        group.add(new Konva.Text({
          x: x + 4, y,
          width: cw - 8, height: rowHeight,
          text: cell.content,
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          fontStyle: cell.bold ? 'bold' : 'normal',
          align: cell.align,
          verticalAlign: 'middle',
          fill: '#000000',
          listening: false,
        }));
      }
    }
  }

  // Outer border
  group.add(new Konva.Rect({ x: 0, y: 0, width: totalW, height: totalH, stroke: style.stroke, strokeWidth: style.strokeWidth, fill: 'transparent', listening: false }));

  // Internal lines
  for (let r = 1; r < rows; r++) {
    group.add(new Konva.Line({ points: [0, r * rowHeight, totalW, r * rowHeight], stroke: style.stroke, strokeWidth: style.strokeWidth * 0.75, listening: false }));
  }
  for (let c = 1; c < cols; c++) {
    group.add(new Konva.Line({ points: [colX[c], 0, colX[c], totalH], stroke: style.stroke, strokeWidth: style.strokeWidth * 0.75, listening: false }));
  }
}

function renderNumberLineToGroup(
  obj: import('@/types/canvas').NumberLineObject,
  group: Konva.Group,
) {
  const { min, max, step, showTicks, showNumbers, leftArrow, rightArrow, markers, regions, style } = obj;
  const W = obj.width;
  const H = obj.height;
  const lineY = H / 2;
  const arrowPad = 14;
  const lineX0 = arrowPad;
  const lineX1 = W - arrowPad;
  const lineLen = lineX1 - lineX0;
  const range = max - min;
  const toX = (v: number) => lineX0 + ((v - min) / range) * lineLen;
  const tickH = 8;

  // Shaded regions
  for (const region of regions) {
    const rx0 = Math.max(lineX0, toX(region.fromValue));
    const rx1 = Math.min(lineX1, toX(region.toValue));
    if (rx1 > rx0) {
      group.add(new Konva.Rect({ x: rx0, y: lineY - 12, width: rx1 - rx0, height: 24, fill: region.color, opacity: region.opacity }));
    }
  }

  // Axis line
  group.add(new Konva.Line({ points: [lineX0, lineY, lineX1, lineY], stroke: style.stroke, strokeWidth: style.strokeWidth }));

  // Arrowheads
  if (leftArrow) {
    group.add(new Konva.Line({ points: [lineX0 + 10, lineY - 5, lineX0, lineY, lineX0 + 10, lineY + 5], stroke: style.stroke, strokeWidth: style.strokeWidth }));
  }
  if (rightArrow) {
    group.add(new Konva.Line({ points: [lineX1 - 10, lineY - 5, lineX1, lineY, lineX1 - 10, lineY + 5], stroke: style.stroke, strokeWidth: style.strokeWidth }));
  }

  // Ticks + numbers
  const ticks: number[] = [];
  for (let v = min; v <= max + 1e-9; v = Math.round((v + step) * 1e9) / 1e9) ticks.push(v);
  for (const v of ticks) {
    const tx = toX(v);
    if (showTicks) {
      group.add(new Konva.Line({ points: [tx, lineY - tickH, tx, lineY + tickH], stroke: style.stroke, strokeWidth: style.strokeWidth * 0.75 }));
    }
    if (showNumbers) {
      const label = Number.isInteger(v) ? String(v) : v.toFixed(1);
      group.add(new Konva.Text({ x: tx - 16, y: lineY + tickH + 3, width: 32, text: label, fontSize: style.fontSize, fontFamily: 'Arial', align: 'center', fill: style.stroke }));
    }
  }

  // Markers
  for (const m of markers) {
    const mx = toX(m.value);
    group.add(new Konva.Circle({ x: mx, y: lineY, radius: 6, fill: m.style === 'closed' ? style.stroke : 'white', stroke: style.stroke, strokeWidth: style.strokeWidth }));
    if (m.showLabel && m.label) {
      group.add(new Konva.Text({ x: mx - 20, y: lineY - 24, width: 40, text: m.label, fontSize: style.fontSize, fontFamily: 'Arial', align: 'center', fill: style.stroke }));
    }
  }
}

function renderVennDiagramToGroup(
  obj: import('@/types/canvas').VennDiagramObject,
  group: Konva.Group,
) {
  const { circleA, circleB, regionLabels, universalSet, style } = obj;
  const W = obj.width;
  const H = obj.height;

  // Universal set border
  group.add(new Konva.Rect({ x: 2, y: 2, width: W - 4, height: H - 4, stroke: style.stroke, strokeWidth: style.strokeWidth * 0.75, fill: 'transparent' }));

  if (universalSet.show) {
    group.add(new Konva.Text({ x: 6, y: 6, text: universalSet.label, fontSize: style.fontSize + 2, fontFamily: 'Arial', fontStyle: 'italic', fill: style.stroke }));
  }

  // Circle fills
  group.add(new Konva.Circle({ x: circleA.x, y: circleA.y, radius: circleA.r, fill: circleA.color, opacity: circleA.opacity }));
  group.add(new Konva.Circle({ x: circleB.x, y: circleB.y, radius: circleB.r, fill: circleB.color, opacity: circleB.opacity }));

  // Circle outlines
  group.add(new Konva.Circle({ x: circleA.x, y: circleA.y, radius: circleA.r, fill: 'transparent', stroke: style.stroke, strokeWidth: style.strokeWidth }));
  group.add(new Konva.Circle({ x: circleB.x, y: circleB.y, radius: circleB.r, fill: 'transparent', stroke: style.stroke, strokeWidth: style.strokeWidth }));

  // Labels above circles
  group.add(new Konva.Text({ x: circleA.x - circleA.r, y: circleA.y - circleA.r - style.fontSize - 4, width: circleA.r * 2, text: circleA.label, fontSize: style.fontSize, fontFamily: 'Arial', fontStyle: 'italic bold', align: 'center', fill: style.stroke }));
  group.add(new Konva.Text({ x: circleB.x - circleB.r, y: circleB.y - circleB.r - style.fontSize - 4, width: circleB.r * 2, text: circleB.label, fontSize: style.fontSize, fontFamily: 'Arial', fontStyle: 'italic bold', align: 'center', fill: style.stroke }));

  // Region labels
  const aOnlyX = circleA.x - circleA.r * 0.55;
  const bOnlyX = circleB.x + circleB.r * 0.55;
  const interX = (circleA.x + circleB.x) / 2;
  const midY = (circleA.y + circleB.y) / 2;

  const rl = regionLabels;
  if (rl.aOnly.show && rl.aOnly.text)        group.add(new Konva.Text({ x: aOnlyX - 24, y: midY - style.fontSize / 2, width: 48, text: rl.aOnly.text, fontSize: style.fontSize, fontFamily: 'Arial', align: 'center', fill: style.stroke }));
  if (rl.intersection.show && rl.intersection.text) group.add(new Konva.Text({ x: interX - 24, y: midY - style.fontSize / 2, width: 48, text: rl.intersection.text, fontSize: style.fontSize, fontFamily: 'Arial', align: 'center', fill: style.stroke }));
  if (rl.bOnly.show && rl.bOnly.text)        group.add(new Konva.Text({ x: bOnlyX - 24, y: midY - style.fontSize / 2, width: 48, text: rl.bOnly.text, fontSize: style.fontSize, fontFamily: 'Arial', align: 'center', fill: style.stroke }));
  if (rl.outside.show && rl.outside.text)    group.add(new Konva.Text({ x: 12, y: 14 + style.fontSize + 4, text: rl.outside.text, fontSize: style.fontSize, fontFamily: 'Arial', fill: style.stroke }));
}

function renderProbTreeToGroup(
  obj: import('@/types/canvas').ProbTreeObject,
  group: Konva.Group,
) {
  const { nodes, showOutcomes, showProducts, style } = obj;
  const W = obj.width;
  const H = obj.height;
  const NODE_R = 4, PAD_L = 12, PAD_R = 48, PAD_V = 16;

  const childrenOf = new Map<string | null, import('@/types/canvas').ProbTreeNode[]>();
  for (const n of nodes) {
    if (!childrenOf.has(n.parentId)) childrenOf.set(n.parentId, []);
    childrenOf.get(n.parentId)!.push(n);
  }

  const root = nodes.find((n) => n.parentId === null);
  if (!root) return;

  const depth = (id: string): number => {
    const kids = childrenOf.get(id) ?? [];
    return kids.length === 0 ? 0 : 1 + Math.max(...kids.map((k) => depth(k.id)));
  };
  const leafCount = (id: string): number => {
    const kids = childrenOf.get(id) ?? [];
    return kids.length === 0 ? 1 : kids.reduce((s, k) => s + leafCount(k.id), 0);
  };

  const treeDepth = depth(root.id);
  const totalLeaves = leafCount(root.id);
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_V * 2;
  const colW = treeDepth > 0 ? plotW / treeDepth : plotW;

  const positions = new Map<string, { x: number; y: number }>();
  const assignPositions = (id: string, col: number, yStart: number, yEnd: number) => {
    positions.set(id, { x: PAD_L + col * colW, y: (yStart + yEnd) / 2 });
    const kids = childrenOf.get(id) ?? [];
    let cursor = yStart;
    for (const kid of kids) {
      const span = (leafCount(kid.id) / totalLeaves) * plotH;
      assignPositions(kid.id, col + 1, cursor, cursor + span);
      cursor += span;
    }
  };
  assignPositions(root.id, 0, PAD_V, PAD_V + plotH);

  for (const node of nodes) {
    if (!node.parentId) continue;
    const from = positions.get(node.parentId);
    const to   = positions.get(node.id);
    if (!from || !to) continue;

    group.add(new Konva.Line({ points: [from.x, from.y, to.x, to.y], stroke: style.stroke, strokeWidth: style.strokeWidth }));

    if (node.probability) {
      const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
      const dx = to.x - from.x, dy = to.y - from.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -dy / len, perpY = dx / len;
      const sign = perpY > 0 ? -1 : 1;
      const LABEL_OFFSET = style.fontSize + 3;
      group.add(new Konva.Text({ x: mx + sign * perpX * LABEL_OFFSET - 24, y: my + sign * perpY * LABEL_OFFSET - style.fontSize / 2, width: 48, text: node.probability, fontSize: style.fontSize, fontFamily: 'Arial', fill: style.stroke, align: 'center' }));
    }

    if (node.label) {
      group.add(new Konva.Text({ x: to.x - 20, y: to.y - style.fontSize - NODE_R - 3, width: 40, text: node.label, fontSize: style.fontSize, fontFamily: 'Arial', fontStyle: 'bold', fill: style.stroke, align: 'center' }));
    }

    const isLeaf = (childrenOf.get(node.id) ?? []).length === 0;
    if (isLeaf) {
      const outcomeX = W - PAD_R + 4;
      if (showOutcomes && node.outcome) {
        group.add(new Konva.Text({ x: outcomeX, y: to.y - style.fontSize / 2, width: PAD_R - 6, text: node.outcome, fontSize: style.fontSize, fontFamily: 'Arial', fill: style.stroke }));
      }
      if (showProducts) {
        const probs: string[] = [];
        let cur: import('@/types/canvas').ProbTreeNode | undefined = node;
        while (cur && cur.parentId !== null) {
          if (cur.probability) probs.unshift(cur.probability);
          cur = nodes.find((n) => n.id === cur!.parentId);
        }
        if (probs.length > 0) {
          group.add(new Konva.Text({ x: outcomeX, y: to.y + style.fontSize / 2 + 1, width: PAD_R - 6, text: probs.join('×'), fontSize: style.fontSize - 1, fontFamily: 'Arial', fill: '#6b7280' }));
        }
      }
    }

    const hasKids = (childrenOf.get(node.id) ?? []).length > 0;
    if (hasKids) {
      group.add(new Konva.Circle({ x: to.x, y: to.y, radius: NODE_R, fill: style.stroke }));
    }
  }
}

function renderBearingToGroup(
  obj: import('@/types/canvas').BearingObject,
  group: Konva.Group,
) {
  const { bearing, showNorthLine, showBearingLine, showArc, showLabel, northLabel, bearingLabel, arcRadius, style } = obj;
  const W = obj.width;
  const H = obj.height;
  const cx = W / 2;
  const cy = H * 0.55;
  const northLen = cy - 12;
  const bearingLen = Math.min(W, H) * 0.38;
  const bearingRad = ((bearing - 90) * Math.PI) / 180;
  const bx = cx + Math.cos(bearingRad) * bearingLen;
  const by = cy + Math.sin(bearingRad) * bearingLen;

  if (showNorthLine) {
    group.add(new Konva.Line({ points: [cx, cy, cx, cy - northLen], stroke: style.stroke, strokeWidth: style.strokeWidth }));
    group.add(new Konva.Line({ points: [cx - 5, cy - northLen + 8, cx, cy - northLen, cx + 5, cy - northLen + 8], stroke: style.stroke, strokeWidth: style.strokeWidth }));
    group.add(new Konva.Text({ x: cx - 12, y: cy - northLen - style.fontSize - 4, width: 24, text: northLabel, fontSize: style.fontSize + 1, fontFamily: 'Arial', fontStyle: 'bold', fill: style.stroke, align: 'center' }));
  }

  if (showBearingLine) {
    group.add(new Konva.Line({ points: [cx, cy, bx, by], stroke: style.stroke, strokeWidth: style.strokeWidth }));
  }

  if (showArc && bearing > 0) {
    const startRad = -Math.PI / 2;
    const endRad = bearingRad;
    const STEPS = 32;
    const arcPts: number[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const a = startRad + (endRad - startRad) * (i / STEPS);
      arcPts.push(cx + Math.cos(a) * arcRadius, cy + Math.sin(a) * arcRadius);
    }
    group.add(new Konva.Line({ points: arcPts, stroke: style.stroke, strokeWidth: style.strokeWidth * 0.75 }));
  }

  if (showLabel && bearing > 0) {
    const midBearingRad = ((bearing / 2 - 90) * Math.PI) / 180;
    const labelR = arcRadius + 14;
    const lx = cx + Math.cos(midBearingRad) * labelR;
    const ly = cy + Math.sin(midBearingRad) * labelR;
    const label = bearingLabel || `${String(bearing).padStart(3, '0')}°`;
    group.add(new Konva.Text({ x: lx - 20, y: ly - style.fontSize / 2, width: 40, text: label, fontSize: style.fontSize, fontFamily: 'Arial', fill: style.stroke, align: 'center' }));
  }

  // Origin cross
  group.add(new Konva.Line({ points: [cx - 3, cy, cx + 3, cy], stroke: style.stroke, strokeWidth: style.strokeWidth }));
  group.add(new Konva.Line({ points: [cx, cy - 3, cx, cy + 3], stroke: style.stroke, strokeWidth: style.strokeWidth }));
}

function renderBarChartToGroup(
  obj: import('@/types/canvas').BarChartObject,
  group: Konva.Group,
) {
  const { bars, mode, xLabel, yLabel, yMax, showValues, barColor, style } = obj;
  const W = obj.width;
  const H = obj.height;
  const PAD_LEFT = 52, PAD_BOTTOM = 42, PAD_TOP = 14, PAD_RIGHT = 14;
  const plotW = W - PAD_LEFT - PAD_RIGHT;
  const plotH = H - PAD_TOP - PAD_BOTTOM;
  const originX = PAD_LEFT;
  const originY = PAD_TOP + plotH;
  const plotCentreY = PAD_TOP + plotH / 2;

  const maxVal = yMax ?? Math.max(...bars.map((b) => b.value), 1);
  const toY = (v: number) => originY - (v / maxVal) * plotH;

  const rawStep = maxVal / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1;
  const yTicks: number[] = [];
  for (let v = 0; v <= maxVal + niceStep * 0.5; v += niceStep) yTicks.push(v);

  // Y-axis label — rotated via sub-group so coordinates stay non-negative
  if (yLabel) {
    const yLabelGroup = new Konva.Group({ x: 0, y: plotCentreY, rotation: -90 });
    yLabelGroup.add(new Konva.Text({
      x: -plotH / 2, y: 2, width: plotH,
      text: yLabel, fontSize: style.fontSize, fontFamily: 'Arial',
      fill: style.axisColor, align: 'center',
    }));
    group.add(yLabelGroup);
  }

  // Grid + y ticks
  for (const v of yTicks) {
    const ty = toY(v);
    group.add(new Konva.Line({ points: [originX - 4, ty, originX, ty], stroke: style.axisColor, strokeWidth: style.strokeWidth * 0.75 }));
    group.add(new Konva.Text({ x: style.fontSize + 4, y: ty - style.fontSize / 2, width: originX - style.fontSize - 10, text: String(v), fontSize: style.fontSize, fontFamily: 'Arial', fill: style.axisColor, align: 'right' }));
    group.add(new Konva.Line({ points: [originX, ty, originX + plotW, ty], stroke: '#e5e7eb', strokeWidth: 0.8 }));
  }

  const gap = mode === 'bar' ? 0.18 : 0;
  const slotW = bars.length > 0 ? plotW / bars.length : 20;
  const bW = slotW * (1 - gap);

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const bx = originX + i * slotW + slotW * gap * 0.5;
    const by = toY(bar.value);
    const bh = originY - by;
    group.add(new Konva.Rect({ x: bx, y: by, width: bW, height: bh, fill: bar.color || barColor, stroke: style.stroke, strokeWidth: style.strokeWidth }));
    group.add(new Konva.Text({ x: originX + i * slotW, y: originY + 5, width: slotW, text: bar.label, fontSize: style.fontSize, fontFamily: 'Arial', fill: style.axisColor, align: 'center' }));
    if (showValues) {
      group.add(new Konva.Text({ x: bx, y: by - style.fontSize - 2, width: bW, text: String(bar.value), fontSize: style.fontSize, fontFamily: 'Arial', fill: style.axisColor, align: 'center' }));
    }
  }

  // Axes
  group.add(new Konva.Line({ points: [originX, originY, originX, PAD_TOP], stroke: style.axisColor, strokeWidth: style.strokeWidth }));
  group.add(new Konva.Line({ points: [originX, originY, originX + plotW + 8, originY], stroke: style.axisColor, strokeWidth: style.strokeWidth }));

  if (xLabel) group.add(new Konva.Text({ x: originX, y: H - style.fontSize - 2, width: plotW, text: xLabel, fontSize: style.fontSize, fontFamily: 'Arial', fill: style.axisColor, align: 'center' }));
}

function renderPieChartToGroup(
  obj: import('@/types/canvas').PieChartObject,
  group: Konva.Group,
) {
  const { slices, showTitle, title, style } = obj;
  const W = obj.width;
  const H = obj.height;
  const titleH = showTitle ? style.fontSize + 8 : 0;
  const cx = W / 2;
  const cy = titleH + (H - titleH) / 2;
  const r = Math.min(W, H - titleH) / 2 - 16;

  if (showTitle) {
    group.add(new Konva.Text({ x: 0, y: 4, width: W, text: title, fontSize: style.fontSize + 1, fontFamily: 'Arial', fontStyle: 'bold', fill: style.stroke, align: 'center' }));
  }

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const toDeg = (v: number) => (total > 0 ? (v / total) * 360 : 0);

  let cumulative = 0;
  for (const sl of slices) {
    const angleDeg = toDeg(sl.value);
    // Draw sector using canvas path via Konva.Shape
    const startRad = ((cumulative - 90) * Math.PI) / 180;
    const endRad = ((cumulative + angleDeg - 90) * Math.PI) / 180;
    group.add(new Konva.Shape({
      sceneFunc(ctx, shape) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startRad, endRad);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      },
      fill: sl.color,
      stroke: style.stroke,
      strokeWidth: style.strokeWidth,
    }));

    if (sl.showLabel || sl.showAngle) {
      const midAngleRad = ((cumulative + angleDeg / 2 - 90) * Math.PI) / 180;
      const labelR = r + 16;
      const lx = cx + Math.cos(midAngleRad) * labelR;
      const ly = cy + Math.sin(midAngleRad) * labelR;
      const edgeX = cx + Math.cos(midAngleRad) * (r + 2);
      const edgeY = cy + Math.sin(midAngleRad) * (r + 2);
      group.add(new Konva.Line({ points: [edgeX, edgeY, lx, ly], stroke: style.stroke, strokeWidth: 0.8 }));
      const parts = [sl.showLabel ? sl.label : '', sl.showAngle ? `${Math.round(toDeg(sl.value))}°` : ''].filter(Boolean);
      group.add(new Konva.Text({ x: lx - 24, y: ly - style.fontSize / 2, width: 48, text: parts.join(' '), fontSize: style.fontSize, fontFamily: 'Arial', fill: style.stroke, align: 'center' }));
    }

    cumulative += angleDeg;
  }
}

async function renderGraphToGroup(graph: import('@/types/canvas').GraphObject, group: Konva.Group) {
  const { graphSettings: s, width: w, height: h } = graph;
  const PAD = 30;
  const innerW = w - PAD * 1.5;
  const innerH = h - PAD * 1.5;
  const toPixel = (gx: number, gy: number) => ({
    px: PAD + ((gx - s.xMin) / (s.xMax - s.xMin)) * innerW,
    py: PAD + ((s.yMax - gy) / (s.yMax - s.yMin)) * innerH,
  });

  // Background
  const bg = s.backgroundColor === 'transparent' ? undefined : (s.backgroundColor || 'white');
  group.add(new Konva.Rect({ x: 0, y: 0, width: w, height: h, fill: bg, stroke: '#ccc', strokeWidth: 1 }));

  // Clipped inner group — same as the live canvas component
  const inner = new Konva.Group({ clipFunc: (ctx) => ctx.rect(0, 0, w, h) });
  group.add(inner);

  // Grid
  if (s.showGrid) {
    for (let gx = Math.ceil(s.xMin); gx <= s.xMax; gx += s.xStep) {
      const { px } = toPixel(gx, 0);
      inner.add(new Konva.Line({ points: [px, PAD, px, PAD + innerH], stroke: s.gridColor, strokeWidth: 0.5, listening: false }));
    }
    for (let gy = Math.ceil(s.yMin); gy <= s.yMax; gy += s.yStep) {
      const { py } = toPixel(0, gy);
      inner.add(new Konva.Line({ points: [PAD, py, PAD + innerW, py], stroke: s.gridColor, strokeWidth: 0.5, listening: false }));
    }
  }

  // Axes
  const { px: ox, py: oy } = toPixel(0, 0);
  inner.add(new Konva.Line({ points: [PAD, oy, PAD + innerW, oy], stroke: s.axisColor, strokeWidth: 1.5, listening: false }));
  inner.add(new Konva.Line({ points: [ox, PAD, ox, PAD + innerH], stroke: s.axisColor, strokeWidth: 1.5, listening: false }));

  // Plots — await so lines are drawn before layer.draw() is called
  const { parseEquation, sampleEquation, sampleCircle } = await import('@/lib/equations');
  const LPAD = 18;
  const LABEL_MIN_GAP = 30;
  const usedLabelPositions: Array<{ px: number; py: number }> = [];

  for (const plot of graph.plots) {
    const parsed = parseEquation(plot.equation);
    if (parsed.error) continue;

    const strokeProps = { stroke: plot.color, strokeWidth: plot.strokeWidth, dash: plot.dashed ? [8, 4] : undefined, listening: false };

    if (parsed.type === 'explicit' && parsed.evalY) {
      const xMin = s.xMin;
      const xMax = s.xMax;
      const segs = sampleEquation(parsed.evalY, xMin, xMax, s.yMin, s.yMax, 400);
      for (const seg of segs) {
        const pts = seg.flatMap(({ x, y }) => { const { px, py } = toPixel(x, y); return [px, py]; });
        inner.add(new Konva.Line({ points: pts, tension: 0, ...strokeProps }));
      }
      // Label — avoid overlap with previously placed labels
      if (plot.showLabel) {
        for (let t = 0.05; t <= 0.95; t += 0.025) {
          const lx = xMin + (xMax - xMin) * t;
          const ly = parsed.evalY(lx);
          if (ly === null) continue;
          const { px, py } = toPixel(lx, ly);
          if (py >= LPAD && py <= h - LPAD && px >= LPAD && px <= w - LPAD) {
            const tooClose = usedLabelPositions.some(
              (u) => Math.abs(u.px - px) < LABEL_MIN_GAP && Math.abs(u.py - py) < LABEL_MIN_GAP
            );
            if (!tooClose) {
              inner.add(new Konva.Text({
                x: px + 4, y: py - 18,
                text: plot.label || plot.equation,
                fontSize: 10, fontFamily: 'Arial', fill: plot.color, listening: false,
              }));
              usedLabelPositions.push({ px, py });
              break;
            }
          }
        }
      }
    } else if (parsed.type === 'circle' && parsed.circle) {
      const segs = sampleCircle(parsed.circle, s.xMin, s.xMax, 200);
      for (const seg of segs) {
        const pts = seg.flatMap(({ x, y }) => { const { px, py } = toPixel(x, y); return [px, py]; });
        inner.add(new Konva.Line({ points: pts, ...strokeProps }));
      }
    } else if (parsed.type === 'vertical' && parsed.verticalX !== undefined) {
      const { px } = toPixel(parsed.verticalX, 0);
      inner.add(new Konva.Line({ points: [px, PAD, px, PAD + innerH], ...strokeProps }));
      if (plot.showLabel) {
        inner.add(new Konva.Text({
          x: px + 4, y: PAD + 8,
          text: `x = ${parsed.verticalX}`,
          fontSize: 10, fontFamily: 'Arial', fill: plot.color, listening: false,
        }));
      }
    }
  }
}
