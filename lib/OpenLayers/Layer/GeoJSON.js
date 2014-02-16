/* Copyright (c) 2014 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/Layer/OSM.js
 */

/**
 * Class: OpenLayers.Layer.GeoJsonTiles
 * Create a layer for presenting tiles of GeoJSON featuers from services that provide tiles in a z/x/y.json URL
 *     compatible with the tile specification of OSM tile servers. This class implementation inherits from 
 *     OpenLayers.Layer.OSM and overrides tileClass and a few other members. 
 *
 * Example:
 * (code)
 *     var layer = new OpenLayers.Layer.GeoJsonTiles(
 *         "My Layer", // name for display in LayerSwitcher
 *         "http://<json server>/tiles/"
 *     );
 * (end)
 * 
 * Inherits from:
 *  - <OpenLayers.Layer.OSM>
 */
OpenLayers.Layer.GeoJSON = OpenLayers.Class(OpenLayers.Layer.OSM, {
    
	/**
     * APIProperty: name
     * {String} The layer name. Defaults to "OpenStreetMap" if the first
     * argument to the constructor is null or undefined.
     */
    name: "GeoJSON",
	
	/** GeoJsonTiles are always an overlay (unless you can think of a reason for it to be a base layer). */
	isBaseLayer: false,
	
	/** File type is always json */
    type: "json", 
    
    /** 
     * Here is the real secret sauce: We replace the image based tiles with a tile that adds features to our
     * embedded feature layer. 
     */
    tileClass: OpenLayers.Tile.GeoJSON,

    /**
     * This is the layer that actually holds the features marshaled by the tiles. If it is not provided when
     * this object is created, then it is created automatically with default styles.
     */
    featureLayer: null,
    
    /**
     * The feature layer is the one the layer switcher needs to operate on.
     */
    displayInLayerSwitcher: false,
    
    setMap: function(map) {
    	OpenLayers.Layer.OSM.prototype.setMap.apply(this, arguments);
		this.map.addLayer(featureLayer);
    },
    
 // Create the feature layer early
    /**
     * Constructor: OpenLayers.Layer.OSM
     *
     * Parameters:
     * name - {String} The layer name.
     * url - {String} The tileset URL scheme.
     * options - {Object} Configuration options for the layer. Any inherited
     *     layer option can be set in this object (e.g.
     *     <OpenLayers.Layer.Grid.buffer>).
     */
    initialize: function(name, url, options) {
        OpenLayers.Layer.OSM.prototype.initialize.apply(this, arguments);
        if (!this.featureLayer) {
    		// Create the feature layer
    		this.featureLayer = featureLayer 
    			= new OpenLayers.Layer.Vector(this.name, {projection: "EPSG:3785"});
    	}    
    },    
    
	CLASS_NAME: "OpenLayers.Layer.GeoJSON",
});