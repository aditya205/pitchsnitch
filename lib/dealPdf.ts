import "server-only";

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";
import {
  SCORE_DIMENSIONS,
  type DealDetail,
  type Founder,
  type Scores,
} from "./types";
import { formatLargeNumber, formatRoundWithStage } from "./formatLargeNumber";

const PAGE = { width: 595.28, height: 841.89 };
const MARGIN = 42;
const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

const colors = {
  canvas: rgb(1, 0.980, 0.965),
  ink: rgb(0.129, 0.078, 0.176),
  secondary: rgb(0.318, 0.255, 0.341),
  tertiary: rgb(0.518, 0.451, 0.502),
  line: rgb(0.925, 0.847, 0.816),
  accent: rgb(1, 0.357, 0.333),
  accentSoft: rgb(1, 0.894, 0.863),
  caution: rgb(0.667, 0.404, 0.153),
};

type Fonts = {
  serif: PDFFont;
  serifBold: PDFFont;
  sans: PDFFont;
  sansBold: PDFFont;
};

type PdfState = {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  fonts: Fonts;
};

function text(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (Array.isArray(value)) {
    const parts = value.map(text).filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function scoresRow(scores: DealDetail["scores"]): Scores | null {
  return Array.isArray(scores) ? scores[0] ?? null : scores;
}

function hasFounderContent(founder: Founder): boolean {
  return Boolean(
    text(founder.name) ||
      text(founder.role) ||
      text(founder.background) ||
      text(founder.linkedin_url)
  );
}

function drawBackground(page: PDFPage) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE.width,
    height: PAGE.height,
    color: colors.canvas,
  });
}

function addPage(state: PdfState) {
  state.page = state.doc.addPage([PAGE.width, PAGE.height]);
  drawBackground(state.page);
  state.y = PAGE.height - MARGIN;
}

function ensureSpace(state: PdfState, height: number) {
  if (state.y - height < MARGIN) {
    addPage(state);
  }
}

function measure(font: PDFFont, value: string, size: number) {
  return font.widthOfTextAtSize(value, size);
}

function wrap(value: string, font: PDFFont, size: number, width: number): string[] {
  const words = value.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(font, candidate, size) <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
  }

  if (line) lines.push(line);
  return lines;
}

function drawTextBlock(
  state: PdfState,
  value: string,
  options: {
    x?: number;
    y?: number;
    width?: number;
    size: number;
    lineHeight: number;
    font: PDFFont;
    color?: RGB;
  }
) {
  const x = options.x ?? MARGIN;
  let y = options.y ?? state.y;
  const width = options.width ?? CONTENT_WIDTH;
  const lines = wrap(value, options.font, options.size, width);
  for (const line of lines) {
    state.page.drawText(line, {
      x,
      y,
      size: options.size,
      font: options.font,
      color: options.color ?? colors.ink,
    });
    y -= options.lineHeight;
  }
  state.y = y;
}

function heading(state: PdfState, label: string) {
  ensureSpace(state, 42);
  state.page.drawLine({
    start: { x: MARGIN, y: state.y },
    end: { x: PAGE.width - MARGIN, y: state.y },
    thickness: 0.75,
    color: colors.line,
  });
  state.y -= 20;
  state.page.drawText(label.toUpperCase(), {
    x: MARGIN,
    y: state.y,
    size: 8.5,
    font: state.fonts.sansBold,
    color: colors.tertiary,
  });
  state.y -= 22;
}

function fieldGrid(
  state: PdfState,
  fields: Array<{ label: string; value?: string | null }>,
  columns = 3
) {
  const gap = 18;
  const columnWidth = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const rows = Math.ceil(fields.length / columns);
  ensureSpace(state, rows * 50);

  for (let row = 0; row < rows; row += 1) {
    const rowY = state.y;
    for (let col = 0; col < columns; col += 1) {
      const field = fields[row * columns + col];
      if (!field) continue;
      const x = MARGIN + col * (columnWidth + gap);
      state.page.drawText(field.label.toUpperCase(), {
        x,
        y: rowY,
        size: 8,
        font: state.fonts.sansBold,
        color: colors.tertiary,
      });
      drawTextBlock(state, field.value || "-", {
        x,
        y: rowY - 17,
        width: columnWidth,
        size: 10.5,
        lineHeight: 13,
        font: field.value ? state.fonts.sansBold : state.fonts.sans,
        color: field.value ? colors.ink : colors.tertiary,
      });
    }
    state.y = rowY - 50;
  }
}

function paragraph(state: PdfState, value: string | null, empty: string) {
  ensureSpace(state, 34);
  drawTextBlock(state, value || empty, {
    size: 10.5,
    lineHeight: 15,
    font: state.fonts.sans,
    color: value ? colors.secondary : colors.tertiary,
  });
  state.y -= 4;
}

function bulletList(state: PdfState, values: string[], empty: string, color = colors.secondary) {
  if (values.length === 0) {
    paragraph(state, null, empty);
    return;
  }

  for (const value of values) {
    ensureSpace(state, 24);
    state.page.drawCircle({
      x: MARGIN + 3,
      y: state.y + 3,
      size: 2,
      color,
    });
    drawTextBlock(state, value, {
      x: MARGIN + 12,
      width: CONTENT_WIDTH - 12,
      size: 10.5,
      lineHeight: 15,
      font: state.fonts.sans,
      color,
    });
    state.y -= 4;
  }
}

function drawScoreBars(state: PdfState, scores: Scores | null, totalScore?: number) {
  const scored = SCORE_DIMENSIONS.flatMap(({ key, label }) => {
    const score = scores?.[key];
    return typeof score === "number" && Number.isFinite(score)
      ? [{ label, score: Math.max(0, Math.min(10, score)) }]
      : [];
  });

  if (scored.length === 0) {
    paragraph(state, null, "Not yet scored.");
    return;
  }

  ensureSpace(state, 128);
  state.page.drawRectangle({
    x: MARGIN,
    y: state.y - 78,
    width: 116,
    height: 82,
    borderColor: colors.line,
    borderWidth: 0.75,
    color: colors.accentSoft,
  });
  state.page.drawText("TOTAL SCORE", {
    x: MARGIN + 14,
    y: state.y - 24,
    size: 8,
    font: state.fonts.sansBold,
    color: colors.tertiary,
  });
  state.page.drawText(typeof totalScore === "number" ? String(totalScore) : "-", {
    x: MARGIN + 14,
    y: state.y - 62,
    size: 34,
    font: state.fonts.serifBold,
    color: colors.accent,
  });
  state.page.drawText("/100", {
    x: MARGIN + 62,
    y: state.y - 58,
    size: 10,
    font: state.fonts.sans,
    color: colors.tertiary,
  });

  const x = MARGIN + 142;
  let y = state.y - 4;
  for (const item of scored) {
    state.page.drawText(item.label, {
      x,
      y,
      size: 9.5,
      font: state.fonts.sans,
      color: colors.secondary,
    });
    state.page.drawRectangle({
      x: x + 104,
      y: y + 1,
      width: 170,
      height: 5,
      color: colors.line,
    });
    state.page.drawRectangle({
      x: x + 104,
      y: y + 1,
      width: 170 * (item.score / 10),
      height: 5,
      color: colors.accent,
    });
    state.page.drawText(`${item.score}/10`, {
      x: x + 284,
      y: y - 2,
      size: 8.5,
      font: state.fonts.sansBold,
      color: colors.ink,
    });
    y -= 17;
  }
  state.y -= 112;

  paragraph(state, text(scores?.rationale), "");
}

export function dealPdfFilename(companyName: string) {
  const safe = companyName
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safe || "pitchsnitch-deal"}.pdf`;
}

export async function generateDealPdf(deal: DealDetail): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Fonts = {
    serif: await doc.embedFont(StandardFonts.TimesRoman),
    serifBold: await doc.embedFont(StandardFonts.TimesRomanBold),
    sans: await doc.embedFont(StandardFonts.Helvetica),
    sansBold: await doc.embedFont(StandardFonts.HelveticaBold),
  };

  const firstPage = doc.addPage([PAGE.width, PAGE.height]);
  drawBackground(firstPage);
  const state: PdfState = {
    doc,
    page: firstPage,
    y: PAGE.height - MARGIN,
    fonts,
  };

  const rawName = text(deal.company_name);
  const companyName =
    !rawName || /^processing/i.test(rawName) ? "New submission" : rawName;
  const oneLiner = text(deal.one_liner);
  const round = object(deal.round);
  const traction = object(deal.traction);
  const revenue = text(traction.revenue) ?? text(deal.arr);
  const formattedRound = formatRoundWithStage(
    text(deal.stage),
    text(round.raising_amount)
  );
  const formattedValuation = formatLargeNumber(text(round.valuation));
  const formattedTam = formatLargeNumber(text(deal.tam));
  const formattedRevenue = formatLargeNumber(revenue);
  const scores = scoresRow(deal.scores);
  const totalScore =
    typeof scores?.total === "number" ? scores.total : deal.total_score;

  state.page.drawText("PitchSnitch", {
    x: MARGIN,
    y: state.y,
    size: 17,
    font: fonts.serifBold,
    color: colors.accent,
  });
  state.page.drawText("Deal one-pager", {
    x: PAGE.width - MARGIN - 82,
    y: state.y + 2,
    size: 9.5,
    font: fonts.sansBold,
    color: colors.tertiary,
  });
  state.y -= 42;

  drawTextBlock(state, companyName, {
    size: 30,
    lineHeight: 32,
    font: fonts.serifBold,
    color: colors.ink,
  });
  state.y -= 6;
  paragraph(state, oneLiner, "No one-liner provided.");

  const meta = [
    text(deal.sector),
    text(deal.stage),
    text(deal.location),
    text(deal.founded_year) ? `Founded ${text(deal.founded_year)}` : null,
    text(deal.website),
  ].filter(Boolean);
  if (meta.length > 0) {
    drawTextBlock(state, meta.join("  |  "), {
      size: 9.5,
      lineHeight: 12,
      font: fonts.sans,
      color: colors.tertiary,
    });
    state.y -= 6;
  }

  heading(state, "The ask");
  fieldGrid(state, [
    { label: "Round", value: formattedRound },
    { label: "Valuation", value: formattedValuation },
    { label: "TAM", value: formattedTam },
    { label: "Prior investors", value: text(round.prior_investors) },
  ]);

  heading(state, "Traction");
  fieldGrid(
    state,
    [
      { label: "Revenue", value: formattedRevenue },
      { label: "Growth rate", value: text(traction.growth_rate) },
      { label: "Customers", value: text(traction.customers) },
    ],
    3
  );

  heading(state, "Team");
  const founders = (deal.founders ?? []).filter(hasFounderContent);
  if (founders.length === 0) {
    paragraph(state, null, "No founder data yet.");
  } else {
    for (const founder of founders) {
      const line = [text(founder.name), text(founder.role)].filter(Boolean).join(" - ");
      ensureSpace(state, 42);
      drawTextBlock(state, line || "Founder details pending", {
        size: 10.5,
        lineHeight: 14,
        font: fonts.sansBold,
        color: colors.ink,
      });
      const background = text(founder.background);
      if (background) {
        drawTextBlock(state, background, {
          size: 9.5,
          lineHeight: 13,
          font: fonts.sans,
          color: colors.secondary,
        });
      }
      state.y -= 5;
    }
  }

  heading(state, "Why it fits");
  paragraph(
    state,
    text(deal.why_it_fits) ?? text(deal.thesis_fit),
    "No thesis rationale yet."
  );

  heading(state, "Score breakdown");
  drawScoreBars(state, scores, totalScore);

  heading(state, "Recent signals");
  const signals = deal.external_signals ?? [];
  if (signals.length === 0) {
    paragraph(state, null, "No web signals gathered yet.");
  } else {
    for (const signal of signals.slice(0, 5)) {
      const title = text(signal.title) ?? "Signal";
      const summary = text(signal.summary);
      const prefix = signal.signal_type ? `${signal.signal_type.toUpperCase()} - ` : "";
      ensureSpace(state, 46);
      drawTextBlock(state, `${prefix}${title}`, {
        size: 10,
        lineHeight: 13,
        font: fonts.sansBold,
        color: signal.signal_type === "concerning" ? colors.caution : colors.ink,
      });
      if (summary) {
        drawTextBlock(state, summary, {
          size: 9.5,
          lineHeight: 13,
          font: fonts.sans,
          color: colors.secondary,
        });
      }
      state.y -= 4;
    }
  }

  heading(state, "Concerns & gaps");
  paragraph(state, text(deal.concerns), "No analyst concerns recorded.");

  heading(state, "Missing fields");
  bulletList(state, list(deal.missing_fields), "No fields marked as missing.");

  heading(state, "Red flags");
  bulletList(state, list(deal.red_flags), "No red flags captured yet.", colors.caution);

  const pageCount = doc.getPageCount();
  doc.getPages().forEach((page, index) => {
    page.drawText(`${index + 1}/${pageCount}`, {
      x: PAGE.width - MARGIN - 22,
      y: 22,
      size: 8,
      font: fonts.sans,
      color: colors.tertiary,
    });
  });

  return doc.save();
}
