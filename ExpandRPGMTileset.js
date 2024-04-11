/* 	Expand RPG Maker Tileset by eishiya, last updated 11 Apr 2024

	Adds an action to the File menu that lets you create a new tileset from
	an RPG Maker tileset image.
	
	When running this action, you will be prompted for your image file,
	the tile size, and a name for the tileset. Then, the script will generate
	an expanded version of the tileset either as a TMX or as an image, and
	finally it will prompt you for a location to save the final tileset.
	
	When you use the action, the script will attempt to automatically identify
	which autotile layout (A1, A2, A3, A4) based on the size of the tileset.
	A1 and A2 have the same size, so you may be asked to select which one it is,
	while A3 and A4 should be automatically identified.
	The other RPG Maker tileset types do not utilize subtiles, so you don't
	need to run this script on them, and this script does not support them. You
	can use standard Tileset creation for those.
	
	The subtile -> tile mappings are from devium's Python script, so tilesets
	generated with either of these scripts should be compatible.
	https://github.com/devium/tiled-autotile
	
	This script assumes margins and spacing of 0, as is typical for RPG Maker
	tilesets. It may produce incorrect results in other scenarios.
	
	TODO: Add an option to expand the tileset into a corner-based terrain
	instead of to blob, with the layout matching fmoo's unpacker.
	TODO: Automatically create Terrains for the tileset.
	
	Requires Tiled 1.10.2+.
	This script saves your preferences for the dialog with your Project, using
	the "ExpandRPGMTileset" prefix. You can opt out of saving preferences
	by setting useProject below to false.
	If no Project is open, preferences will not be saved.
*/

var expandRPGM = tiled.registerAction("ExpandRPGMTileset", function(action) {
	// ============================= CONFIGURATION =============================
	let useProject = true; //set to false if you don't want to save your preferences to your Project.
	// =========================================================================
	
	if(!tiled.project || !tiled.versionLessThan || tiled.versionLessThan("1.10.2"))
		useProject = false;
	let project = useProject? tiled.project : null;
	
	let dialog = new Dialog("New RPG Maker Tileset...");
	dialog.newRowMode = Dialog.ManualRows;
	dialog.minimumWidth = 200;
	dialog.addHeading("Tileset", true);
	let nameInput = dialog.addTextInput("Name:");
	let name = "";
	nameInput.editingFinished.connect(function() {name = nameInput.text;});
	dialog.addHeading("Image", true);
	let sourceInput = dialog.addFilePicker("Source:");
	sourceInput.filter = "Images (*.png *.xpm *.jpeg *.jpg *.bmp *.gif *.qoi *.svg *.cur *.webp)";
	dialog.addNewRow();
	dialog.addLabel("");
	let useColorInput = dialog.addCheckBox("Use transparent color:", false);
	let useColor = false;
	useColorInput.stateChanged.connect(function() {useColor = useColorInput.checked});
	if(project && project.property("ExpandRPGMTileset_UseTransparentColor") > 0)
		useColorInput.checked = project.property("ExpandRPGMTileset_UseTransparentColor");
	let colorInput = dialog.addColorButton();
	let color = "";
	colorInput.colorChanged.connect(function(newColor) {color = newColor});
	if(project && project.property("ExpandRPGMTileset_TransparentColor") > 0)
		colorInput.color = project.property("ExpandRPGMTileset_TransparentColor");
	dialog.addNewRow();
	/*let typeInput = dialog.addComboBox("Layout:", ["Auto", "A1", "A2", "A3", "A4"]);
	let layoutType = 0;
	typeInput.currentIndexChanged.connect(function() {
		let index = typeInput.currentIndex;
		layoutType = index;
	});
	if(project && project.property("ExpandRPGMTileset_Layout"))
		layoutType.currentIndex = project.property("ExpandRPGMTileset_Layout");
	dialog.addLabel("");
	dialog.addNewRow();*/
	let tileWidthInput = dialog.addNumberInput("Tile width:");
	tileWidthInput.decimals = 0;
	tileWidthInput.minimum = 1;
	let tileWidth = 1;
	tileWidthInput.valueChanged.connect(function(number) {tileWidth = number});
	if(project && project.property("ExpandRPGMTileset_TileWidth") > 0)
		tileWidthInput.value = project.property("ExpandRPGMTileset_TileWidth");
	dialog.addLabel("px");
	dialog.addNewRow();
	let tileHeightInput = dialog.addNumberInput("Tile height:");
	tileHeightInput.decimals = 0;
	tileHeightInput.minimum = 1;
	let tileHeight = 1;
	tileHeightInput.valueChanged.connect(function(number) {tileHeight = number});
	if(project && project.property("ExpandRPGMTileset_TileHeight") > 0)
		tileHeightInput.value = project.property("ExpandRPGMTileset_TileHeight");
	dialog.addLabel("px");
	dialog.addNewRow();
	let intermediateInput = dialog.addComboBox("Save intermediate as:", ["TileMap", "Image"]);
	intermediateInput.toolTip = 'Saving as a TileMap will save space and be more flexible than saving as an image, but not all engines support Tilemaps. You can replace the TileMap with an image later.';
	intermediateFormat = 0;
	intermediateInput.currentIndexChanged.connect(function() {
		let index = intermediateInput.currentIndex;
		intermediateFormat = index;
	});
	if(project && project.property("ExpandRPGMTileset_IntermediateFormat"))
		intermediateInput.currentIndex = project.property("ExpandRPGMTileset_IntermediateFormat");
	dialog.addNewRow();
	let confirmButton = dialog.addButton("Save As...");
	confirmButton.enabled = false;
	confirmButton.clicked.connect(function() {dialog.accept();});
	let source = "";
	sourceInput.fileUrlChanged.connect(function(url) {
		if(!tiled.versionLessThan || tiled.versionLessThan("1.11.0"))
			source = url.toString().replace(/^file:\/{3}/, (tiled.platform == 'windows')? '' : '/');
		else
			source = sourceInput.fileName;
		if(!url || !File.exists(source))
			confirmButton.enabled = false;
		else
			confirmButton.enabled = true;
	});
	let cancelButton = dialog.addButton("Cancel");
	cancelButton.clicked.connect(function() {dialog.reject();});
	let confirmed = dialog.exec();
	if(!confirmed) return;
	
	if(!File.exists(source)) {
		tiled.warn("Non-existent file chosen: "+source+". Tileset will not be created.");
		return;
	}
	//let sourceImage = new Image(source);
	//let imageWidth = sourceImage.width;
	//let imageHeight = sourceImage.height;
	
	//Save properties:
	if(project) {
		project.setProperty("ExpandRPGMTileset_TileWidth", tileWidth);
		project.setProperty("ExpandRPGMTileset_TileHeight", tileHeight);
		//project.setProperty("ExpandRPGMTileset_Layout", layoutType);
		project.setProperty("ExpandRPGMTileset_IntermediateFormat", intermediateFormat);
		project.setProperty("ExpandRPGMTileset_UseTransparentColor", useColor);
		if(color != "")
			project.setColorProperty("ExpandRPGMTileset_TransparentColor", color);
	}
	
	if(!name || name == "") {
		name = FileInfo.baseName(source);
	}
	
	//Create the intermediate tileset:
	let tileset = new Tileset(name + " Subtiles");
	tileset.tileWidth = Math.floor(tileWidth/2);
	tileset.tileHeight = Math.floor(tileHeight/2);
	if(useColor && color) {
		tileset.transparencyColor = color;
	}
	if(!tiled.versionLessThan || tiled.versionLessThan("1.11.0"))
		tileset.image = source;	
	else
		tileset.imageFileName = source;
	
	//Get this tileset's size:
	let tilesetWidth = Math.floor(tileset.imageWidth / tileset.tileWidth);
	let tilesetHeight = Math.floor(tileset.imageHeight / tileset.tileHeight);
	if(tilesetWidth * tilesetHeight > tileset.tileCount) {
		let allow = tiled.confirm("This tileset appears to have non-0 margins and spacing, which is unusual. You may get nonsense results if you continue. Continue anyway?");
		if(!allow) return;
	}
	
	//Auto-correcting the tileset size is not necessary, since we generated the tileset.
	/*if(tilesetWidth == 16 || tilesetHeight == 12 || tilesetHeight == 8 || tilesetHeight == 15) {
		let fixTilesize = tiled.confirm("This tileset appears to have its tile size set to the full tile size rather than the subtile size, so there are not enough tiles to continue. Would you like the script to attempt to adjust the tile size automatically?");
		if(fixTilesize) {
			tileset.setTileSize(tileset.tileWidth/2, tileset.tileHeight/2);
			tilesetWidth = Math.floor(tileset.imageWidth / tileset.tileWidth);
			tilesetHeight = Math.floor(tileset.imageHeight / tileset.tileHeight);
		} else return;
	}*/
	
	//A1: Animated tiles, 16x12 tiles (32 x 24 subtiles)
	//A2: Ground tiles, 16x12 tiles (32x24 subtiles)
	//A3: Building tiles, 16x8 tiles (32x16 subtiles)
	//A4: Walls, 16x15 tiles (32x30 subtiles)
	//A5: Normal, 8x16 tiles, no subtiles, so no expanding is needed
	
	//Sublayouts:
	//combinations is a list of tiles in the expanded sheet. Each tile is defined by its four subtiles, which in turn are defined as subtile x,y coords within the subtile subsheet.
	let autotile = {
		//Terrain (water, ground, etc)
		T: {inputWidth: 2, inputHeight: 3, outputWidth: 7, outputHeight: 7,
			combinations: [
				[[0, 2], [1, 3], [1, 2], [0, 3]],
				[[2, 2], [1, 3], [1, 2], [2, 3]],
				[[2, 2], [3, 3], [3, 2], [2, 3]],
				[[0, 2], [3, 3], [3, 2], [0, 3]],
				[[2, 4], [3, 1], [1, 4], [2, 3]],
				[[2, 4], [3, 1], [1, 4], [2, 1]],
				[[2, 4], [1, 3], [1, 4], [2, 1]],
				[[0, 4], [1, 3], [1, 4], [0, 3]],
				[[2, 4], [1, 3], [1, 4], [2, 3]],
				[[2, 4], [3, 3], [3, 4], [2, 3]],
				[[0, 4], [3, 3], [3, 4], [0, 3]],
				[[2, 4], [3, 1], [3, 0], [2, 3]],
				[[2, 0], [3, 1], [3, 0], [2, 1]],
				[[2, 0], [1, 3], [1, 4], [2, 1]],
				[[0, 4], [1, 5], [1, 4], [0, 5]],
				[[2, 4], [1, 5], [1, 4], [2, 5]],
				[[2, 4], [3, 5], [3, 4], [2, 5]],
				[[0, 4], [3, 5], [3, 4], [0, 5]],
				[[2, 4], [1, 3], [3, 0], [2, 3]],
				[[2, 0], [1, 3], [3, 0], [2, 3]],
				[[2, 0], [1, 3], [1, 4], [2, 3]],
				[[0, 2], [1, 5], [1, 2], [0, 5]],
				[[2, 2], [1, 5], [1, 2], [2, 5]],
				[[2, 2], [3, 5], [3, 2], [2, 5]],
				[[0, 2], [3, 5], [3, 2], [0, 5]],
				[[2, 2], [3, 1], [1, 2], [2, 3]],
				[[2, 2], [3, 1], [1, 2], [2, 1]],
				[[2, 2], [1, 3], [1, 2], [2, 1]],
				[[0, 4], [3, 1], [1, 4], [0, 3]],
				[[2, 4], [3, 3], [3, 4], [2, 1]],
				[[2, 0], [3, 1], [1, 4], [2, 3]],
				[[2, 4], [1, 3], [3, 0], [2, 1]],
				[[2, 4], [1, 5], [3, 0], [2, 5]],
				[[2, 0], [1, 5], [3, 0], [2, 5]],
				[[2, 0], [1, 5], [1, 4], [2, 5]],
				[[0, 4], [3, 1], [3, 0], [0, 3]],
				[[2, 0], [3, 3], [3, 4], [2, 1]],
				[[0, 2], [3, 1], [1, 2], [0, 3]],
				[[2, 2], [3, 3], [3, 2], [2, 1]],
				[[2, 4], [3, 1], [3, 0], [2, 1]],
				[[2, 0], [3, 1], [1, 4], [2, 1]],
				[],
				[[0, 4], [1, 3], [3, 0], [0, 3]],
				[[2, 0], [3, 3], [3, 4], [2, 3]],
				[[0, 4], [1, 5], [3, 0], [0, 5]],
				[[2, 0], [3, 5], [3, 4], [2, 5]],
				[[2, 0], [3, 1], [3, 0], [2, 3]],
				[[2, 0], [1, 3], [3, 0], [2, 1]],
				[]
			]
		},
		//Wall (top acts like terrain, bottom is static)
		W: {inputWidth: 2, inputHeight: 2, outputWidth: 4, outputHeight: 4,
			combinations: [
				[[0, 0], [1, 1], [1, 0], [0, 1]],
				[[2, 0], [1, 1], [1, 0], [2, 1]],
				[[2, 0], [3, 1], [3, 0], [2, 1]],
				[[0, 0], [3, 1], [3, 0], [0, 1]],
				[[0, 2], [1, 1], [1, 2], [0, 1]],
				[[2, 2], [1, 1], [1, 2], [2, 1]],
				[[2, 2], [3, 1], [3, 2], [2, 1]],
				[[0, 2], [3, 1], [3, 2], [0, 1]],
				[[0, 2], [1, 3], [1, 2], [0, 3]],
				[[2, 2], [1, 3], [1, 2], [2, 3]],
				[[2, 2], [3, 3], [3, 2], [2, 3]],
				[[0, 2], [3, 3], [3, 2], [0, 3]],
				[[0, 0], [1, 3], [1, 0], [0, 3]],
				[[2, 0], [1, 3], [1, 0], [2, 3]],
				[[2, 0], [3, 3], [3, 0], [2, 3]],
				[[0, 0], [3, 3], [3, 0], [0, 3]]
			]
		},
		//Unchanged, but we still have to output them in terms of subtiles
		//TODO: Tiles might be out of order.
		U: {inputWidth: 2, inputHeight: 3, outputWidth: 2, outputHeight: 3,
			combinations: [
				[[0,0], [1,1], [1,0], [0,1]],
				[[2,0], [3,1], [3,0], [2,1]],
				[[0,2], [1,3], [1,2], [0,3]],
				[[2,2], [3,3], [3,2], [2,3]],
				[[0,4], [1,5], [1,4], [0,5]],
				[[2,4], [3,5], [3,4], [2,5]]
			]
		}
	};
	
	//Layouts:
	let layout = {
		A1: {
			autotiles: [
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.U],
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.U],
				[autotile.T, autotile.T, autotile.T, autotile.U, autotile.T, autotile.T, autotile.T, autotile.U],
				[autotile.T, autotile.T, autotile.T, autotile.U, autotile.T, autotile.T, autotile.T, autotile.U]
			],
			outputWidth: 0,
			outputHeight: 0
		},
		A2: {
			autotiles: [
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T],
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T],
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T],
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T]
			],
			outputWidth: 0,
			outputHeight: 0
		},
		A3: {
			autotiles: [
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W],
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W],
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W],
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W]
			],
			outputWidth: 0,
			outputHeight: 0
		},
		A4: {
			autotiles: [
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T],
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W],
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T],
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W],
				[autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T, autotile.T],
				[autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W, autotile.W],
			],
			outputWidth: 0,
			outputHeight: 0
		}
	};
	//Calculate layout output dimensions:
	for(let type in layout) {
		if (layout.hasOwnProperty(type)) {
			layoutType = layout[type];
			let widths = [];
			let height = 0;
			for(let row = 0; row < layoutType.autotiles.length; ++row) {
				widths[row] = 0;
				let curHeight = 0;
				for(let sublayout = 0; sublayout < layoutType.autotiles[row].length; ++sublayout) {
					widths[row] += layoutType.autotiles[row][sublayout].outputWidth;
					if(curHeight < layoutType.autotiles[row][sublayout].outputHeight)
						curHeight = layoutType.autotiles[row][sublayout].outputHeight;
				}
				height += curHeight;
			}
			layoutType.outputWidth = Math.max(...widths);
			layoutType.outputHeight = height;
		}
	}
	
	function expandAutotile(autotile, target, targetX, targetY, sourceX, sourceY) {
		for(let x = 0; x < autotile.outputWidth; ++x) {
			for(let y = 0; y < autotile.outputHeight; ++y) {
				let tileDef = autotile.combinations[x + y*autotile.outputWidth];
				if(tileDef.length > 3) {
					let drawTile = tileset.tile( sourceX + tileDef[0][0] + (sourceY + tileDef[0][1])*tilesetWidth );
					target.setTile(targetX + x*2, targetY + y*2, drawTile); //top left
					drawTile = tileset.tile( sourceX + tileDef[1][0] + (sourceY + tileDef[1][1])*tilesetWidth );
					target.setTile(targetX + x*2 + 1, targetY + y*2 + 1, drawTile); //bottom right
					drawTile = tileset.tile( sourceX + tileDef[2][0] + (sourceY + tileDef[2][1])*tilesetWidth );
					target.setTile(targetX + x*2 + 1, targetY + y*2, drawTile); //top right
					drawTile = tileset.tile( sourceX + tileDef[3][0] + (sourceY + tileDef[3][1])*tilesetWidth );
					target.setTile(targetX + x*2, targetY + y*2 + 1, drawTile); //bottom left
				} //Don't draw anything if there's no tile to be output
			}
		}
		return autotile.outputWidth*2;
	}
	
	
	let autotileType = null;
	if(tilesetWidth == 32 && tilesetHeight == 24) {
		if(tiled.confirm("Is this an A1 (animated tiles) tileset? Click Yes for A1, No for A2 (ground tiles)."))
			autotileType = layout.A1;
		else autotileType = layout.A2;
	} else if(tilesetWidth == 32 && tilesetHeight == 16) {
		autotileType = layout.A3;
	} else if(tilesetWidth == 32 && tilesetHeight == 30) {
		autotileType = layout.A4;
	} else {
		tiled.alert("This tileset has dimensions other than those found in A1, A2, A3, and A4 tilesets and cannot be correctly expanded.\nMake sure you've set the tile size correctly, and that margins and spacing are 0.");
		return;
	}
	
	//Make a new map for the given tileset:
	let map = new TileMap();
	map.orientation = TileMap.Orthogonal;
	map.setSize(autotileType.outputWidth*2, autotileType.outputHeight*2);
	map.setTileSize(tileset.tileWidth, tileset.tileHeight);
	map.addTileset(tileset);

	map.macro("Expand RPG Maker Tileset", function() {
		var newLayer = new TileLayer(tileset.name + " Expanded");
		var newLayerEdit = newLayer.edit();
		//Iterate over each subsheet in the layout and generate its expanded version
		let outputX = 0, outputY = 0;
		let inputX = 0, inputY = 0;
		let outputRowHeight = 0;
		let inputRowHeight = 0;
		
		for(let autotileRow = 0; autotileRow < autotileType.autotiles.length; ++autotileRow) {
			outputX = 0;
			inputX = 0;
			outputY += outputRowHeight;
			inputY += inputRowHeight;
			outputRowHeight = 0;
			inputRowHeight = 0;
			for(let autotileCol = 0; autotileCol < autotileType.autotiles[autotileRow].length; ++autotileCol) {
				let autotileDef = autotileType.autotiles[autotileRow][autotileCol];
				outputX += expandAutotile(autotileDef, newLayerEdit, outputX, outputY, inputX*2, inputY*2);
				inputX += autotileDef.inputWidth;
				outputRowHeight = Math.max(outputRowHeight, autotileDef.outputHeight*2);
				inputRowHeight = Math.max(inputRowHeight, autotileDef.inputHeight);
			}
		}
		newLayerEdit.apply();
		map.addLayer(newLayer);
	});
	//tiled.activeAsset = map;
	//Save this map to the file's location.
	let fileSuffix = ".tmx";
	if(intermediateFormat == 1)
		fileSuffix = "_expanded.png";
	let path = FileInfo.path(source) + "/" + FileInfo.baseName(source) + fileSuffix;
	if(File.exists(path)) {
		if(!tiled.confirm("File "+path+" already exists. Would you like to overwrite it? If No, tileset creation will be aborted."))
			return;
	}
	if(intermediateFormat == 0) { //TileMap
		let tmxWriter = tiled.mapFormat("tmx");
		let error = tmxWriter.write(map, path);
		if(error && error != "") {
			tiled.error("Failed to write intermediate TMX file "+path+", RPG Maker metatileset creation aborted. Reported error:\n"+error);
			return;
		}
	} else if(intermediateFormat == 1) { //Image
		let mapImage = map.toImage();
		let saved = mapImage.save(path);
		if(!saved) {
			tiled.error("Failed to write intermediate image file "+path+", RPG Maker tileset creation aborted.");
			return;
		}
	} else
		return;
	
	//Create the final tileset:
	let newTileset = new Tileset(name);
	newTileset.tileWidth = tileWidth;
	newTileset.tileHeight = tileHeight;
	if(useColor && color) {
		newTileset.transparencyColor = color;
	}
	if(!tiled.versionLessThan || tiled.versionLessThan("1.11.0"))
		newTileset.image = path;
	else
		newTileset.imageFileName = path;
	
	//tiled.activeAsset = newTileset;
	let saveLocation = tiled.promptSaveFile(FileInfo.path(source), "Tiled Tileset files (*.tsx *.xml);;JSON Tileset files (*.tsj *.json)", "Save Tileset As");
	if(saveLocation && saveLocation != "") {
		let format = tiled.tilesetFormatForFile(saveLocation);
		if(!format) {
			tiled.warn("Could not find valid Tileset format for"+FileInfo.fileName(saveLocation)+", saving in TSX format.");
			format = tiled.tilesetFormat("tsx");
		}
		format.write(newTileset, saveLocation);
		tiled.open(saveLocation);
	} //else, the user cancelled. Do nothing.
});
expandRPGM.text = "New RPG Maker Tileset...";

tiled.extendMenu("File", [
	{ action: "ExpandRPGMTileset", before: "Save" },
	{ separator: true }
]);
