// Choices the page must know before first paint, so nothing jumps or flashes when React loads.
// Shared by the client components that change them and the root layout (server) that runs the script.

export const PROTO_BAR_KEY = "52:proto-bar";
export const THEME_KEY = "52:theme";

/** Runs in <head>: a returning visitor gets the minimised prototype bar and their chosen edition. */
export const PRE_PAINT_SCRIPT = `try{var d=document.documentElement,s=localStorage;if(s.getItem(${JSON.stringify(PROTO_BAR_KEY)})==="min")d.dataset.bar="min";if(s.getItem(${JSON.stringify(THEME_KEY)})==="night")d.dataset.theme="night"}catch(e){}`;
