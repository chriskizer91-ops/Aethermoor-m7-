// lean-z.js (Places, November 23): the reader for a --lean page (build.mjs). __z("<base64 deflate>") unpacks a packed
// script and runs it right where it stands (an inline script put in the page runs at once), so every script still runs
// in its own order, before the page says it is ready, exactly as if it were written out.
import { inflateSync, strFromU8 } from '../node_modules/three/examples/jsm/libs/fflate.module.js';
window.__z = (b) => {
  const a = atob(b), u = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) u[i] = a.charCodeAt(i);
  const s = document.createElement('script'); s.text = strFromU8(inflateSync(u)); document.currentScript.after(s);
};
