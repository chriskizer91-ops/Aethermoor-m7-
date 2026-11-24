import sys
from PIL import Image
SP=sys.argv[1]
for k in sys.argv[2].split(','):
    ims=[Image.open(f'{SP}/wr-{k}-{v}.png') for v in ['front','side','back']]
    for im in ims: w,h=im.size
    crop=[im.crop((int(w*.25),0,int(w*.75),h)) for im in ims]
    sh=Image.open(f'/home/user/Aethermoor-m7-/prototypes/'+(sys.argv[3] if len(sys.argv)>3 else 'wraiths')+f'/sheets/{k}.webp').convert('RGB')
    cw,ch=crop[0].size; sh.thumbnail((cw*3, ch))
    W=Image.new('RGB',(cw*3, ch+sh.size[1]),(20,20,20))
    for i,c in enumerate(crop): W.paste(c,(i*cw,0))
    W.paste(sh,(0,ch)); W.thumbnail((1200,1200)); W.save(f'{SP}/cmpw-{k}.png')
