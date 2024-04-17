import json

data = open("levels.txt").read().split("\n\n")

obj = {}

for x in data:
    name = x.splitlines()[0]
    obj[name] = x

open("levels.json", "w").write(json.dumps(obj, indent=4))