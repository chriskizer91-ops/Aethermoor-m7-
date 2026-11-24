# The Ashen Warden's joints (sculpt coordinates, metres: x his right, y forward, z up), from Chris's sheet
# (art-in/3d/sheets/sheet-ashen-warden.webp: 2.2 m to the crown's tips). He stands as the sheet draws him: his sword
# raised in his right hand, his shield before him on his left arm. Shared by sculpt.py and rig.py.
J = dict(
    hip=(0, 0, 1.0), waist=(0, 0, 1.16), chest=(0, 0, 1.3), neck=(0, 0.0, 1.62), head=(0, 0.01, 1.68), top=(0, 0.01, 1.96),
    r_sh=(0.30, 0, 1.57), r_el=(0.37, 0.03, 1.30), r_wr=(0.37, 0.15, 1.52), r_fist=(0.37, 0.17, 1.60),
    l_sh=(-0.30, 0, 1.57), l_el=(-0.37, 0.02, 1.30), l_wr=(-0.34, 0.22, 1.20), l_fist=(-0.33, 0.27, 1.17),
    r_hip=(0.12, 0, 0.98), r_knee=(0.13, 0.01, 0.57), r_ank=(0.13, -0.01, 0.12), r_toe=(0.13, 0.17, 0.03),
    l_hip=(-0.12, 0, 0.98), l_knee=(-0.13, 0.01, 0.57), l_ank=(-0.13, -0.01, 0.12), l_toe=(-0.13, 0.17, 0.03),
    cape=(0, -0.21, 1.14), hem=(0, -0.27, 0.45),
)
BONES = [
    ('hips', None, J['hip'], J['waist']), ('spine', 'hips', J['waist'], J['chest']), ('chest', 'spine', J['chest'], J['neck']),
    ('neck', 'chest', J['neck'], J['head']), ('head', 'neck', J['head'], J['top']),
    ('r_upper', 'chest', J['r_sh'], J['r_el']), ('r_fore', 'r_upper', J['r_el'], J['r_wr']), ('r_hand', 'r_fore', J['r_wr'], J['r_fist']),
    ('l_upper', 'chest', J['l_sh'], J['l_el']), ('l_fore', 'l_upper', J['l_el'], J['l_wr']), ('l_hand', 'l_fore', J['l_wr'], J['l_fist']),
    ('r_thigh', 'hips', J['r_hip'], J['r_knee']), ('r_shin', 'r_thigh', J['r_knee'], J['r_ank']), ('r_foot', 'r_shin', J['r_ank'], J['r_toe']),
    ('l_thigh', 'hips', J['l_hip'], J['l_knee']), ('l_shin', 'l_thigh', J['l_knee'], J['l_ank']), ('l_foot', 'l_shin', J['l_ank'], J['l_toe']),
    ('cape', 'chest', J['cape'], J['hem']),
]
