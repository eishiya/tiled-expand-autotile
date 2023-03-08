# Expand RPG Maker Autotile Tileset
This Tiled script adds an option to the Tileset menu to expand an RPG Maker autotile tileset, for easier use as Terrains in Tiled. It outputs a map, which you can then export as an image to use in a tileset, or save to use as the direct source of a Metatileset (if you set a Tiled Map as the source "image" of a Tileset, the map will be used as an image. This feature is not widely supported in parsers yet since it's not documented, but it's very useful for avoiding the need to save an expanded tileset as a large image).

Because this script relies on outputting a map from the script to the editor, it requires **Tiled 1.8 or newer**.

This script is based on devium's Python script that expands RPG Maker tileset images: <https://github.com/devium/tiled-autotile>. The resulting tilesets for A1, A2, A3, and A4 have the same layouts and should be compatible.

## Using this script
If you don't know how to run scripts in Tiled, please see the [Tiled documentation on Scripting](https://doc.mapeditor.org/en/stable/reference/scripting/).

To use this script, create a tileset in Tiled from your RPG Maker tileset image, but set the tile size to *half* the size of the tiles, so that each tile in the tileset corresponds to a minitile. So, if your tileset has 48px tiles, set the tile size to 24px. In some cases, the script can detect that you've set the size to the full tile size and will offer to correct this, but this will mess up any terrains you had and any maps already using the tileset, so it's recommended to set the tile size correctly yourself.

When your tileset is ready, click Tileset > Expand RPG Maker Tileset to Blob and follow any prompts. The script can automatically detect A3 and A4 tilesets and should not give any prompts. It can't distinguish between A1 and A2, so it'll ask you which type your tileset is if it detects one of those.

You will end up with a Tiled Map open in the editor, which contains your expanded tileset. You can export it as an image and then close the map, or you can save the map to use as a tileset image directly.

If you save it as a map file, create a new tileset with the map file as its source Image, you can make a metatileset, which will allow you to use my [Terrain import script](https://github.com/eishiya/tiled-scripts/blob/main/ImportMetatileTerrains.js) to copy terrains from the original RPG Maker tileset to the expanded tileset, which would save you time in labelling the tiles. You can swap out the map "image" for a regular image after this if you like, and still keep the imported terrains.

## Limitations
The script can currently only expand tilesets that have the exact A1, A2, A3, and A4 layouts, it will not expand any tilesets that are larger or smaller than these. The vast majority of RPG Maker autotile tilesets fit one of these layouts, so this is not likely to be a problem. However, newer versions of RPG Maker support smaller layouts and RPG Maker XP supports larger layouts, so I may look into supporting this if it's needed.

This script will produce 1x1 (2x2 minitiles) "island" tiles of the various ground terrains as appropriate. Tiled's Terrain feature cannot currently use these correctly, they should be placed manually. They can be labelled as having the surrounding terrain on all sides so that the Terrain tools can work with them correctly, but in this case you'll probably want to set their tile probability to 0 so that they don't get used as variants of the solid surrounding terrain tile.

## TODO
- Currently, the script expands ground autotiles into 47-tile "blob" tilesets, which are versatile, but may be more than what's needed for a particular tileset or game. I'd like to add an option to expand into 16-tile corner-style tilesets instead, which may be a better fit for some games.
