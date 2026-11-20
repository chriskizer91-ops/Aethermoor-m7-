// M7's own hero strip (game/src/ui/battle/party.js), every card as it is, with one change of place: the heroes
// themselves stand on the field in 3D, each over its own card, so the strip's little pixel figures are not drawn
// (fight.css hides their canvas and lets the 3D show through the space above the cards). Every move the screen
// asks of the strip (attack, cast, hurt, a flash, a fall) is also played by the hero on the ground (arena.js).
import { Party as Party2D } from '../../game/src/ui/battle/party.js';
import { arena } from './arena.js';

export class Party extends Party2D {
  constructor(host, heroes, opts) {
    super(host, heroes, opts);
    for (const h of heroes) arena.byUnit.set(h.id, h.heroId || h.id);
    host.classList.add('f3-party');
  }
  layout() {
    super.layout();
    // the space over the cards is where the 3D hero stands: a hero's height on a phone, more on a laptop
    const w = this.host.getBoundingClientRect().width;
    this.host.style.setProperty('--strip-h', `${w < 600 ? 150 : 180}px`);
    if (arena.stage) arena.stage.relayout();
  }
  update(u) { const r = super.update(u); try { arena.heroState(u); } catch (e) { console.warn(e); } return r; }
  setActor(id) { super.setActor(id); arena.setActor(id); }
  attack(id, ms) { super.attack(id, ms); arena.heroAttack(id); }
  cast(id, ms) { super.cast(id, ms); arena.heroCast(id); }
  hurt(id, big = false) { super.hurt(id, big); arena.heroHurt(id, big); }
  flashColor(id, tint, ms) { super.flashColor(id, tint, ms); arena.heroFlash(id, tint); }
  busy(t) { return super.busy(t) || arena.busy(); }
}
