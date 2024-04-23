


import json


data = open("./public/images/images.json").read()

textures = json.loads(data)["frames"].keys()

print("export interface TextureMap {")

for tex in textures:
    print('"' + tex + '"'+": PIXI.Texture<PIXI.Resource>,")

print("}")
