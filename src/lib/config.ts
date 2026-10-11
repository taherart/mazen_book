export const SITE = {
  name: "52 طريقة لزيادة الدخل",
  short: "52 طريقة",
  slogan: "52 أسبوعًا. 52 فرصة. ابدأ تجربتك.",
  description: "52 طريقة عملية لزيادة دخلك من كتاب مازن الضراب. اختر الطريقة التي تناسبك، جرّبها، شارك نتائجك، وتعلّم من تجارب الآخرين.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://52income.com",
  author: "مازن الضراب",
  bookTitle: "52 طريقة لتزيد دخلك «من جد»",
  /** Where "order the book" points. Left empty until the store link is known. */
  bookOrderUrl: process.env.NEXT_PUBLIC_BOOK_ORDER_URL ?? "",
} as const;

/** Week 1 opens at this instant (a Sunday, Riyadh time). Method N is the challenge of week N. */
export const LAUNCH_DATE = process.env.NEXT_PUBLIC_LAUNCH_DATE ?? "2026-10-04T00:00:00+03:00";

/** The first build is a clickable prototype: community data is illustrative and actions stay in the browser. */
export const PROTOTYPE = true;
