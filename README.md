# Expand RPG Maker Autotile Tileset
This Tiled script adds an option to the File menu to create a Tiled Tileset from an RPG Maker tileset image, expanding it for easier use in Tiled. It saves the expanded tileset as an image or as a TileMap TMX, and then uses that as the source image for a Tileset. The resulting Tileset is usable just like any other Tileset in Tiled.

Because this script needs to prompt the user for file locations, it requires **Tiled 1.10.2 or newer**.

This script is based on devium's Python script that expands RPG Maker tileset images: <https://github.com/devium/tiled-autotile>. The resulting tilesets for A1, A2, A3, and A4 have the same layouts and should be compatible.

## Using this script
If you don't know how to run scripts in Tiled, please see the [Tiled documentation on Scripting](https://doc.mapeditor.org/en/stable/reference/scripting/).

To create a new tileset from an RPG Maker tileset image, go to `File > New RPG Maker Tileset...`. This will open a dialog that works similarly to the regular New Tileset dialog. You can enter your tileset name, the image file to use, (optionally) the transparency colour, tile size, and whether to save the intermediate expanded version of the tileset as a TileMap (TMX) or an image (PNG). After that, you'll be prompted for where to save the resulting Tileset file, and after that, the final Tileset will be open in Tiled.

If you choose to save the intermediate as a TileMap, the resulting Tileset will use that map as its source, making it a "metatileset". This allows you to rearrange the tiles easily and for changes to the original image to propagate to the expanded version, and the resulting file is smaller. However, Tiled metatilesets are not widely supported in parsers yet. You can, however, always replace the source Tilemap with an image later. You can open the TileMap in Tiled, Export as Image, and then change the source in the Tileset to that image. So, don't be afraid to try out using an intermediate Tilemap instead of an image :D

## Limitations
The script can currently only expand tilesets that have the exact A1, A2, A3, and A4 layouts, it will not expand any tilesets that are larger or smaller than these. The vast majority of RPG Maker autotile tilesets fit one of these layouts, so this is not likely to be a problem. However, newer versions of RPG Maker support smaller layouts and RPG Maker XP supports larger layouts, so I may look into supporting this if it's needed.

This script will produce 1x1 (2x2 minitiles) "island" tiles of the various ground terrains as appropriate. Tiled's Terrain feature cannot currently use these correctly, they should be placed manually. They can be labelled as having the surrounding terrain on all sides so that the Terrain tools can work with them correctly, but in this case you'll probably want to set their tile probability to 0 so that they don't get used as variants of the solid surrounding terrain tile.

## TODO
- Currently, the script expands ground autotiles into 47-tile "blob" tilesets, which are versatile, but may be more than what's needed for a particular tileset or game. I'd like to add an option to expand into 16-tile corner-style tilesets instead, which may be a better fit for some games.
- Automatically generate default terrains. These won't always be optimal, but they would save a lot of work in typical scenarios.
