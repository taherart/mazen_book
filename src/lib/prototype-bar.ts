// Shared by the prototype bar (client) and the root layout (server), so it lives outside both.

export const PROTO_BAR_KEY = "52:proto-bar";

/** Runs before first paint: a returning visitor gets the minimised bar without a layout jump. */
export const PROTO_BAR_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(PROTO_BAR_KEY)})==="min")document.documentElement.dataset.bar="min"}catch(e){}`;
