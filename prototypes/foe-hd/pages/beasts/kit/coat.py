# A coat of big tufts sculpted INTO the body's surface (session 6's Briarmaw coat, generalised): at every point the
# topmost tuft sets the height, so tufts overlap like shingles, each with a hard lip at its tip. Not hairs (Chris:
# "if you just make it fuzzy with a bunch of little tiny hairs... it won't look like it's supposed to").
#   pass 1: tufts as plain forms; pass 2: each splits into strands (barbs off a midrib), broken tips; pass 3: finer
import numpy as np
from scipy.spatial import cKDTree
from sdf import project, sample_surface, mc, mix, sstep, log

def tri(x): f = x - np.floor(x); return 1 - np.abs(2 * f - 1)

class Coat:
    def __init__(s, body_sdf, lo, hi, length, flow, bare=None, LV=1, VOX=0.01, seed=11, n_samples=220000,
                 spacing=0.36, width=(0.46, 0.10), height=(0.17, 0.05), hmax=0.07, strands=(3, 5), hscale=None, wscale=None,
                 barb=0.95, sample_vox=None, style='tuft', grooves=(4, 7), sway=0.18, tip_soft=1.3, groove_depth=0.16, round_=0.5):
        s.LV, s.VOX = LV, VOX
        rng = np.random.default_rng(seed)
        Vc, Fc = mc(body_sdf, sample_vox or VOX * 2.5, lo, hi)
        P = sample_surface(Vc, Fc, n_samples, rng)
        if bare is not None: P = P[~bare(P)]
        Lp = length(P)
        order = np.argsort(-Lp + 0.03 * Lp.mean() * rng.random(len(P)))
        tree = cKDTree(P); blocked = np.zeros(len(P), bool); take = []
        for i in order:
            if blocked[i]: continue
            take.append(i); blocked[tree.query_ball_point(P[i], spacing * Lp[i])] = True
        TP = P[take]; n = len(TP)
        TP, TN = project(TP, body_sdf)
        TT = flow(TP, TN); TB = np.cross(TN, TT)
        TL = length(TP) * (0.85 + 0.3 * rng.random(n))
        TW = TL * (width[0] + width[1] * rng.random(n)) * (wscale(TP) if wscale else 1)
        TH = np.minimum(TL * (height[0] + height[1] * rng.random(n)), hmax) * (hscale(TP) if hscale else 1)
        s.TS = np.round(mix(strands[0], strands[1], np.clip(TL / TL.max(), 0, 1)) + rng.integers(0, 2, n)).astype(int)
        s.TP, s.TN, s.TT, s.TB, s.TL, s.TW, s.TH = TP, TN, TT, TB, TL, TW, TH
        s.n = n; s.tree = cKDTree(TP); s.HMAX = float(TH.max()); s.reach = float(TL.max()) * 1.1; s.barb = barb
        s.rng = rng; s.style = style; s.sway = sway; s.tip_soft = tip_soft; s.groove_depth = groove_depth; s.round_ = round_
        s.NG = np.round(mix(grooves[0], grooves[1], np.clip(TL / TL.max(), 0, 1)) + rng.random(n) * 2).astype(np.float32)
        log('tufts', n, 'longest', round(float(TL.max()), 3), 'highest', round(s.HMAX, 4))

    def height(s, P, want_id=False):
        if s.style == 'lock': return s.height_lock(P, want_id)
        return s.height_tuft(P, want_id)

    def height_lock(s, P, want_id=False):
        """fur as big flowing locks (a stylised sculpt's fur clumps): flame-shaped, pointed tips, soft sides that melt
        into the locks under them, grooves running down each lock; only the tip has a hard edge"""
        LV, VOX = s.LV, s.VOX
        K = 14
        dist, idx = s.tree.query(P, K, distance_upper_bound=s.reach)
        ok = np.isfinite(dist); idx = np.where(ok, idx, 0)
        TP, TT, TB, TN, TL, TW, TH = s.TP, s.TT, s.TB, s.TN, s.TL, s.TW, s.TH
        D = P[:, None, :] - TP[idx]
        sv = np.einsum('nkj,nkj->nk', D, TT[idx]) / TL[idx]
        w = np.einsum('nkj,nkj->nk', D, TB[idx]) / (TW[idx] * 0.5)
        nrm = np.einsum('nkj,nkj->nk', D, TN[idx])
        ss = np.clip((sv + 0.15) / 1.15, 0, 1)
        # flame: widest a third of the way, drawn to a point at the tip, the tip swaying a little
        sway = s.sway * np.sin(idx * 1.7) * ss ** 2
        w = w - sway
        width = np.sin(np.pi * np.clip(ss, 0, 1) ** 0.5) ** 0.6 * (1 - ss ** 2) ** 0.6 + 0.02
        e = np.abs(w) / width
        ew = max(VOX * s.tip_soft, 0.0015)
        if LV >= 2:      # the tip splits into points, one for each strand
            gq = w * width * s.NG[idx] * 0.5 + 0.5 + 0.13 * idx
            tipend = 1 - 0.22 * tri(gq) ** 1.5
        else:
            tipend = 1
        inside_s = np.clip((tipend - sv) * TL[idx] / ew, 0, 1) * np.clip((sv + 0.15) * TL[idx] / (TL[idx] * 0.25), 0, 1)
        soft = np.clip(1 - e, 0, 1)
        dome = soft ** 0.4 * np.clip(1 - e * e, 0, 1) ** s.round_   # a rounded crest down each lock
        ramp = 0.25 + 0.75 * ss ** 1.1
        h = TH[idx] * ramp * dome * inside_s
        if LV >= 2:
            ng = s.NG[idx]
            g = tri(w * width * ng * 0.5 + 0.5 + 0.13 * idx)          # grooves down the lock, joining at the tip
            h = h * (1 - s.groove_depth * g ** 2.5 * sstep(0.08, 0.35, ss) * (1 - sstep(0.85, 1.0, ss)))
        if LV >= 3:
            g2 = tri(w * width * s.NG[idx] * 1.5 + 0.21 * idx)
            h = h * (1 - 0.06 * g2 ** 2 * sstep(0.15, 0.5, ss))
        h = np.where(np.abs(nrm) < 0.25 * TL[idx] / 0.3 + 0.03, h, 0)
        h = np.where(ok, h, 0)
        j = np.argmax(h, 1); r = np.arange(len(P))
        top = h[r, j]
        q = (w * width * s.NG[idx] * 0.5)[r, j]
        if want_id: return top, idx[r, j], ss[r, j], q
        return top

    def height_tuft(s, P, want_id=False):
        LV, VOX = s.LV, s.VOX
        K = 12
        dist, idx = s.tree.query(P, K, distance_upper_bound=s.reach)
        ok = np.isfinite(dist); idx = np.where(ok, idx, 0)
        TP, TT, TB, TN, TL, TW, TH = s.TP, s.TT, s.TB, s.TN, s.TL, s.TW, s.TH
        D = P[:, None, :] - TP[idx]
        sv = np.einsum('nkj,nkj->nk', D, TT[idx]) / TL[idx]
        w = np.einsum('nkj,nkj->nk', D, TB[idx]) / (TW[idx] * 0.5)
        nrm = np.einsum('nkj,nkj->nk', D, TN[idx])
        ss = np.clip((sv + 0.2) / 1.2, 0, 1)
        width = np.sin(np.pi * ss ** 0.62) ** 0.7
        wl = np.abs(w) * TW[idx] * 0.5; sl = sv * TL[idx]
        q = (sl - s.barb * wl) / (0.012 * TL[idx] / 0.3 + 0.07 * TL[idx])      # barbs scale with the tuft
        if LV >= 2:
            tipend = 1 - 0.10 * tri(q + 0.5); jag = 1 - 0.16 * tri(q + 0.5)
        else:
            tipend = np.ones_like(sv); jag = 1
        e = np.abs(w) / np.maximum(width * jag, 1e-3)
        ew = max(VOX * 1.4, 0.002)
        inside_s = np.clip((tipend - sv) * TL[idx] / ew, 0, 1) * np.clip((sv + 0.2) * TL[idx] / (ew * 4), 0, 1)
        inside_w = np.clip((1 - e) * TW[idx] * 0.5 / ew, 0, 1)
        dome = np.sqrt(np.clip(1 - e ** 2, 0, 1)) ** 0.6
        ramp = 0.2 + 0.8 * ss ** 1.3
        h = TH[idx] * ramp * dome * inside_s * inside_w
        if LV >= 2:
            h = h * (1 - 0.20 * tri(q + 0.5) ** 2 * sstep(0.05, 0.4, ss))
            h = h * (1 - 0.10 * np.exp(-(wl / (0.02 * TW[idx] + 1e-4)) ** 2) * sstep(0.1, 0.5, ss))
        if LV >= 3:
            h = h * (1 - 0.07 * tri(q * 3 + 0.5) ** 2 * sstep(0.2, 0.7, ss))
        h = np.where(np.abs(nrm) < 0.25 * TL[idx] / 0.3 + 0.03, h, 0)
        h = np.where(ok, h, 0)
        j = np.argmax(h, 1); r = np.arange(len(P))
        top = h[r, j]
        if want_id: return top, idx[r, j], ss[r, j], q[r, j]
        return top
