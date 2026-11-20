# Forwarding copies (November 20)

Briarmaw's light model and pictures now live in `../foes/briarmaw/assets/` (the foe kit). These are copies of them,
kept so builds that read this folder (the Fight's `briarmawLook` plugin) keep working. New code: use the kit,
`kit/js/looks.js` `register(assets)` and `foeLook(buildBeast)`, with the assets from `foes/<key>/assets/`.
These copies are refreshed whenever Briarmaw is rebuilt; remove them once nothing reads them.
