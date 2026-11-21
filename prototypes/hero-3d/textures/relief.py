#!/usr/bin/env python3
"""Sculpted relief tiles for the 3D heroes and people (November 20: "the heroes at the full-detail foes' level").

The outfits are built in code from the game's own numbers, piece by piece, so every item can be switched; a sculpt
baked onto one fixed model (the way the full-detail foes are made) would lose that. Instead each kind of surface gets
its sculpted detail as a small tile that repeats over any piece made of it, laid on in 3D (triplanar) by kit.js:

    metal    hammer dents, a few scratches            mail     (the rings are in Chris's mail picture already)
    leather  creases and pebbling                     hide     deep wrinkles and pores
    cloth    weave, small soft wrinkles                wood     carved grain running along the haft
    stone    chips                                    bone     growth rings and pits
    horn     ridges round it                          hair     strands running down
    skin     fine pores

Each tile holds two things: red = height (the shader turns its slopes into light and shade, like a normal map), green =
cavity (how shut in each spot is: dark in the bottom of a crease, a dent, between threads), the occlusion a sculpt bake
would give. Everything is made from tileable noise (filtered in frequency, so it wraps), the same each run (fixed seed).
Writes relief/*.webp and relief.js (data URLs).

    python3 relief.py
"""
import base64, io, os
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'relief')
N = 256
rng = np.random.default_rng(20)
fy = np.fft.fftfreq(N)[:, None]; fx = np.fft.fftfreq(N)[None, :]


def noise(scale, sx=1.0, sy=1.0, power=0.0):
    """Tileable noise: white noise filtered to features about `scale` px (stretched sx along x, sy along y)."""
    w = rng.standard_normal((N, N))
    f = np.hypot(fx * sx, fy * sy) * scale
    k = np.exp(-f * f * 2.0) * (1.0 if not power else np.maximum(f, 1e-3) ** -power)
    k[0, 0] = 0
    a = np.real(np.fft.ifft2(np.fft.fft2(w) * k))
    return (a - a.mean()) / (a.std() + 1e-9)


def blur(a, s):
    k = np.exp(-2 * (np.pi ** 2) * (s ** 2) * (fx ** 2 + fy ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * k))


def norm(a):
    a = a - a.min(); return a / (a.max() + 1e-9)


def ridged(scale, sx=1, sy=1):
    """Creases: the zero lines of noise, as thin grooves."""
    return -np.exp(-np.abs(noise(scale, sx, sy)) * 3.0)


def dents(n, rmin, rmax, depth=1.0):
    """Round dimples scattered over the tile (wrapping round its edges), like a hammered plate."""
    h = np.zeros((N, N)); yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(n):
        cx, cy, r = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(rmin, rmax)
        dx = (xx - cx + N / 2) % N - N / 2; dy = (yy - cy + N / 2) % N - N / 2
        h -= np.exp(-(dx * dx + dy * dy) / (r * r)) * depth * rng.uniform(0.5, 1)
    return h


def scratches(n, length=60):
    h = np.zeros((N, N))
    for _ in range(n):
        x, y, a = rng.uniform(0, N), rng.uniform(0, N), rng.uniform(0, np.pi)
        for t in np.linspace(0, length * rng.uniform(0.4, 1), 200):
            h[int(y + np.sin(a) * t) % N, int(x + np.cos(a) * t) % N] -= 1
    return blur(h, 0.6)


def weave(period=8):
    yy, xx = np.mgrid[0:N, 0:N] * (2 * np.pi / period)
    warp = np.sin(xx) * (np.sin(yy * 0.5) > 0); weft = np.sin(yy) * (np.sin(xx * 0.5) <= 0)
    return np.abs(np.sin(xx)) * 0.5 + np.abs(np.sin(yy)) * 0.5 + (warp + weft) * 0.25


def make(kind):
    if kind == 'metal':
        h = dents(70, 6, 22) * 0.8 + scratches(14) * 0.35 + noise(40) * 0.25
    elif kind == 'leather':
        h = ridged(26) * 1.0 + ridged(9) * 0.35 + noise(2.2) * 0.25
    elif kind == 'hide':
        h = ridged(34) * 1.2 + ridged(14) * 0.5 + dents(160, 1.2, 2.4, 0.6) + noise(3) * 0.2
    elif kind == 'cloth':
        h = norm(weave(8)) * 0.8 + noise(30) * 0.5 + ridged(26) * 0.35   # weave and small soft wrinkles, no direction (laid on from any side)
    elif kind == 'wood':
        h = noise(18, 0.12, 1.0) * 1.0 + ridged(10, 0.08, 1.0) * 0.7 + noise(3, 0.3, 1) * 0.15
    elif kind == 'stone':
        h = np.maximum(noise(30), noise(30) * 0.8) + ridged(20) * 0.6 + noise(4) * 0.3
    elif kind == 'bone':
        h = noise(26, 1.0, 0.1) * 0.6 + dents(60, 1, 2.5, 0.8) + noise(6) * 0.2
    elif kind == 'horn':
        h = noise(10, 1.0, 0.05) * 1.0 + ridged(8, 1.0, 0.1) * 0.6 + noise(30) * 0.3
    elif kind == 'hair':
        h = noise(2.5, 0.06, 1.0) * 1.0 + noise(7, 0.08, 1.0) * 0.6
    elif kind == 'skin':
        h = dents(500, 0.7, 1.4, 0.7) + noise(30) * 0.4
    h = norm(h)
    # cavity: how far below its neighbourhood each spot sits (a crease bottom is shut in, a ridge is open)
    cav = blur(h, 5) - h
    ao = np.clip(1.0 - np.maximum(cav, 0) * 5.0, 0.35, 1.0)
    rgb = np.stack([h, ao, h * 0 + 0.5], -1)
    return Image.fromarray((rgb * 255 + 0.5).astype(np.uint8), 'RGB')


KINDS = ['metal', 'leather', 'hide', 'cloth', 'wood', 'stone', 'bone', 'horn', 'hair', 'skin']


def main():
    os.makedirs(OUT, exist_ok=True)
    out, total = {}, 0
    for k in KINDS:
        img = make(k); b = io.BytesIO(); img.save(b, 'WEBP', quality=82, method=6); d = b.getvalue()
        open(os.path.join(OUT, k + '.webp'), 'wb').write(d); total += len(d)
        out[k] = 'data:image/webp;base64,' + base64.b64encode(d).decode()
    js = ('// Made by relief.py: sculpted relief tiles per kind of surface (red: height, green: cavity). Do not edit by hand.\n'
          'export const RELIEF = {\n' + ''.join(f'  {k}: "{v}",\n' for k, v in out.items()) + '};\n')
    open(os.path.join(HERE, 'relief.js'), 'w').write(js)
    print(f'{len(out)} relief tiles: {total / 1024:.0f} KB')


if __name__ == '__main__':
    main()
