import json

# beware all ye who enter this file


def main():
    text = open("levels.txt", "r").read()
    levels = parseText(text)
    for level in levels:
        f = open(level["name"] + ".json", "w")
        f.write(json.dumps(level, indent=4))
        f.close()


def parseEntry(entry):
    data = {}

    data["name"] = entry[0]

    keyPairs = list(filter(lambda x: "=" in x, entry))
    for k in keyPairs:
        info = k.split("=")
        data[info[0]] = info[1]

    return data


# private static int[] parseContinuedPiece(String paramString, int paramInt1, char paramChar, int paramInt2)
def parseContinuedPiece(paramString: str, paramInt1: int, paramChar: str,
                        paramInt2: int):
    i = 100
    j = 0
    if paramInt1 == 0:
        j = 43536
        i += 22000 + paramInt2
    else:
        j = paramInt1 * 100 + paramInt2

    while ((paramInt1 + 1 < len(paramString))
           and (paramString[paramInt1 + 1] == paramChar)):
        paramInt1 += 1
        i += 100

    if paramInt1 + 1 == len(paramString):
        i = 22000

    return [j, i, paramInt1]


def parseLevelLayer(entry, layer):
    ents = entry["entities"]

    i = int(-len(layer) * 100 / 2)
    print(i, layer)

    j = 0
    while j < len(layer):
        char = layer[j]
        arrayOfInt = []
        k = 0
        if char == "#":
            arrayOfInt = parseContinuedPiece(layer, j, "#", i)
            # x, y, width, type
            ents["ground"].append({
                "x": arrayOfInt[0],
                "y": 0,
                "width": arrayOfInt[1],
                "type": "normal"
            })
            j = arrayOfInt[2]

            pass

        # end of while loop
        j += 1


def parseLevel(entry):
    layers = filter(lambda x: "layer" in x, entry)
    layers = list(map(lambda x: entry[x], layers))

    entry["entities"] = {
        "ground": [],
        "water": [],
        "coast": [],
        "hill": [],
        "runway": [],
        "flag": [],
        "bunker": [],
    }

    for layer in layers:
        parseLevelLayer(entry, layer)

    for key in list(entry):
        if "layer" in key:
            entry.pop(key)

    return entry


def parseText(text: str):
    entries = text.split("\n\n")
    entries = list(map(str.splitlines, entries))
    data = []
    for e in entries:
        entry = parseEntry(e)
        entry = parseLevel(entry)
        data.append(entry)

    return data


main()