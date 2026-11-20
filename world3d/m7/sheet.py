# sheet.py: puts a check's stills side by side (top and walk for each place) into sheet.jpg in the same folder
import sys, glob
from PIL import Image
d = sys.argv[1]; fs = sorted(glob.glob(d + '/*-top.jpg'))
W = Image.new('RGB', (1350, 320 * len(fs)))
for i, f in enumerate(fs):
    W.paste(Image.open(f).resize((450, 320)), (0, i * 320)); W.paste(Image.open(f.replace('-top', '-walk')).resize((450, 320)), (450, i * 320)); W.paste(Image.open(f.replace('-top', '-over')).resize((450, 320)), (900, i * 320))
W.save(d + '/sheet.jpg', quality=75)
