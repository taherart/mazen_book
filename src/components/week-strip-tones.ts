// Cell colours for <WeekStrip/>, per background. Kept out of the client module so the server
// pages that draw the legend can import the same values.

export const STRIP = {
  paper: { current: "bg-sun text-ink border-ink shadow-print-sm", done: "bg-ink text-white border-ink", mine: "bg-brand text-white border-ink", rest: "bg-white text-ink-soft border-line hover:border-ink hover:text-ink" },
  blue: { current: "bg-sun text-ink border-ink shadow-print-sm", done: "bg-ink text-white border-ink", mine: "bg-white text-brand border-ink", rest: "bg-white/10 text-white border-white/30 hover:border-white hover:bg-white/20" },
};
/** Legend swatches that match the strip's cells for the same tone. */
export const STRIP_LEGEND = {
  paper: [["bg-sun", "تحدي الأسبوع"], ["bg-brand", "بدأتها"], ["bg-ink", "أكملتها"]],
  blue: [["bg-sun", "تحدي الأسبوع"], ["bg-white", "بدأتها"], ["bg-ink", "أكملتها"]],
} as const;
