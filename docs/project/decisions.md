# Chris's decisions (newest first)

Written by the hub. His newer word beats anything older, here or anywhere in the repo.

## November 24

Chris went through everything on his phone (his playtest page, https://claude.ai/artifact/7BNj1rvFhus7KaBVYbGnxQ; his
marks and notes are in its store, `checks` and `calls`).

- **Every game page opens and plays on his phone,** Act One with full pictures too (pictures beside the page as files).
  So pages may go past 16 MB that way; single-file pages stay for when a link must be one file.
- **"I think polish of the 3D models needs to happen."** His notes:
  - The winged foes "are flapping their wings too fast. I think like one flap a second or even slower would be good."
  - "We need to come back to the wraiths' 3D models; they could all use a polish pass. Iron and forge as well."
  - The Gear Room: "if all of the buttons were collapsible so I could see the model, that would be good."
- **Fights are held in arenas that look like the land you are in** (his answer to call 1, instead of fighting on the
  spot). It also ends what he saw in Act Three's fights: "the characters are phasing through the wall ... the character
  furthest to the left was inside the wall even while it was attacking."
- **The Mother's Hollow takes the name Envoi and Moon Faire use: the fen's dark heart** (call 8: "Use the lore name
  from Moon Faire and Envoi"). The hub reads that as Envoi's and Coven's name for the same place, the fen's dark heart;
  M7's other names there (the Lanternfen, the Lantern Mother) stay.
- **Kept as suggested:** the heroes stand on the field and step forward on their turn (2); real 3D dice (3); the card
  reveal as approved, over the 3D (4); Frostmere earlier on the road up (5); small beasts at 1.3 times life size (5b);
  the Rotwarden 2.5 m and the sapwight 2.0 m (5c); "the Hearth Road" (6); Fawnrest and the Highfold no longer join (7);
  Envoi's places with no M7 place stay scenery (9); the 3D game offers to start from an M7 save code, reading it only,
  "yes, they keep their own saves" (10).

## November 21

- **A place map** (Chris): "a mini map for a more detailed map than the Atlas continent map, a mini map that gives you
  orientation for where you are in a location." Places makes it (`world3d/m7/minimap.js`: a small map in a corner
  drawn from the place's own painting, the party's mark and facing, the whole place's map when tapped, with the ways
  out, people, chests and the Hearthfire); Together feeds it the game's live marks. Suggested and open: top-left
  corner, north kept up (a rotating map as a setting).
- **No model may stretch when it moves.** Chris, on his phone, of the Rotwarden's "Blacken the Sap" (walkers page):
  "when they move their arms they stretch themselves" (to every session doing 3D models). His picture:
  `from-chris/2026-11-21-rotwarden-stretch.webp`: as the arms spread, his waist, belt and the straps across his middle
  are dragged out sideways into a web after them. The cause is the skin weights: his arms hang beside his hips at rest,
  so automatic weights gave hip, belt and strap points to the arm bones. Every foe and hero is checked for it on every
  move, by eye and by a stretch check in the kit (`jobs/foes.md`).

## November 20

- **Full-detail sculpts: aim at about 500,000 to 1 million triangles**, "to get the amount of detail that you need. It
  can be more than that if it needs to be" (his laptop can take 2 or 3 million). **Each full-detail model is kept as an
  asset he can look at**; the game uses the baked light version (about 50,000 triangles). He saw the crowd test (six
  full-detail Briarmaws and the four heroes) at 144 frames a second on his laptop and called the baked one "kind of
  amazing looking". (To session 6, passed on to every session; Briarmaw's sculpt is 988,394 triangles.)
- **The foes in full detail, the way session 6 made Briarmaw** ("already looking fantastic; I'm excited to see other
  foes rendered with the techniques it learned"), with more sessions building them: sessions 7 (beasts) and 8
  (walkers) join session 6 (`docs/project/jobs/foes.md`).
- **To session 6, on the full-detail foe** (relayed in its slip): start with a 100,000-triangle shape model, then add
  the detail; no fuzz of tiny hairs ("that'll look fuzzy, but it won't look like it's supposed to").
- **A sixth session builds one foe in full detail**: a 600,000 to 1,000,000-triangle sculpt baked onto a
  50,000-triangle light version, so many foes and characters can be on screen at once; shown side by side with the
  painted cut-out and the code-built model, so he can choose. "Building games takes months or years, and we will do it
  in a week."
- **The foes as they are now aren't good enough** ("need serious work, or we need to think about it a different way").
- **Five sessions build the 3D game**: session one the hub, three jobs alongside it (the Fight, Models, Places), and a
  fresh fifth to put it all together. Project notes in the repo (`docs/project/`).
- **Build the 3D game the way Aethermoor was built, a milestone at a time, with M7's current combat**, all of it in
  3D: the battle (as M2 was), then loot and levelling. The plan: `docs/3d-game-plan.md`.
- **The party doesn't walk in a straight line**: the three who don't lead walk as a loose group round the leader.
- He loves the 3D world built from M7's own maps, and that it fits the map.
- Sent all 136 pictures asked for (`art-requests/RECEIVED.md`).
- **The lore**: as close to M7's story (or M1 and M2's) as possible, set on the atlas of Aethermoor. Bending M7's lore
  and changing the order to fit Coven of the Moon Faire's world is fine: "That's the big game."
- **Never alter the other games' artifacts** (their maps, their pages): everything is copied into this repo.
- **The world**: this game is on the same continent as Moon Faire and Envoi. Reuse their finished 3D world (the walking
  places with the small map, the big map and the 3D continent); never their witches, battle or story. Keep M7's lore,
  combat, loot and gear. It's another time on the same continent.
- **The heroes**: the storybook shape, High detail only (no sprite shape, no chibi). Their outfits change with every
  item, as in the game. Every weapon must look epic. Hair never through a hat.
- **Surfaces**: item surfaces come from a texture pack wrapped round the code-built shapes, not pictures printed on the
  models.
- **The creatures**: every foe M7 has, in 3D.
- **Art requests**: all picture prompts in one HTML page with references and palettes; he sends the pictures back as
  zips.
