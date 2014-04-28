/* Copyright (c) 2006-2013 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */


/**
 * @requires OpenLayers/BaseTypes/Class.js
 * @requires OpenLayers/Util.js
 */

/**
 * Class: OpenLayers.Tile.GeoJson
 * Each tile is a Vector layer with features loaded from GeoJSON tiled data.
 *
 */
OpenLayers.Tile.SeamlessGeoJSON = OpenLayers.Class(OpenLayers.Tile, {

    /**
     * Property: url
     * {String} url of the GeoJSON data for this tile's bounds.
     */
    url: null,

    /**
     * Property: dummyLayer
     * {<Openlayers.Layer>} A Vector layer with features within the bounds of this tile. This layer is never added
     * to the map, but is just used to load and remember the features for this tile.
     */
    dummyLayer: null,

    /* TBD: Retries and Async requests like Image does? */

    /**
     * Constructor: OpenLayers.Tile.GeoJson
     * Constructor for a new <OpenLayers.Tile.GeoJson> instance.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * url - {<String>}
     * size - {<OpenLayers.Size>}
     * options - {Object}
     */
    initialize: function(layer, position, bounds, url, size, options)
    {
    	OpenLayers.Tile.prototype.initialize.apply(this, arguments);
        this.url = url;
        // Create the feature layer early
        if (!this.layer.featureLayer) {
    		// Create the feature layer
    		this.layer.featureLayer = featureLayer
    			= new OpenLayers.Layer.Vector(this.layer.name, {projection: "EPSG:3785"});
    		this.layer.map.addLayer(featureLayer);
    	}
    },


    /**
     * APIMethod: destroy
     * Nullify references to prevent circular references and memory leaks.
     */
    destroy: function() {
    	if (this.dummyLayer) {
    		// We had set map to the map so that the features loaded properly. Now set it back
    		// to null so that the destroy call doesn't cause interaction with the map since the layer
    		// was never "officially" added to the map.
    		this.dummyLayer.map = null;
    		this.dummyLayer.destroy();
    		this.dummyLayer = null;
    	}
    	OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
     * local callback for dummy layer
     */
    featuresAddedEvent: function(evt) {

    },

    /**
     * Method: draw
     * Clear whatever is currently in the tile, then return whether or not
     *     it should actually be re-drawn. This is an example implementation
     *     that can be overridden by subclasses. The minimum thing to do here
     *     is to call <clear> and return the result from <shouldDraw>.
     *
     * Parameters:
     * force - {Boolean} If true, the tile will not be cleared and no beforedraw
     *     event will be fired. This is used for drawing tiles asynchronously
     *     after drawing has been cancelled by returning false from a beforedraw
     *     listener.
     *
     * Returns:
     * {Boolean} Whether or not the tile should actually be drawn. Returns null
     *     if a beforedraw listener returned false.
     */
    draw: function(force) {
        var shouldDraw = OpenLayers.Tile.prototype.draw.apply(this, arguments);
    	// console.log("GeoJson: draw");
        if (!shouldDraw) {
        	// console.log("GeoJson: should NOT draw");
        	return false;
        }
        // get this URL for this tile
        this.url = this.layer.getURL(this.bounds);

        // placeholder for callback
        tile = this;

        // The dummy layer is just used to load the features from the server. An event handler then adds those
        // features to the actual feature layer for the grid we are part of. We keep the dummy layer around and
        // finally destroy it when we clean this tile.
        tileStrategy = new OpenLayers.Strategy.Fixed();

        this.dummyLayer = new OpenLayers.Layer.Vector("GeoJSON"+Math.random(), {
        	projection: "EPSG:3785",
        	strategies: [tileStrategy],
        	protocol: new OpenLayers.Protocol.HTTP({
        		url: this.url,
        		format: new OpenLayers.Format.GeoJSON()
        	}),
        	eventListeners: { "featuresadded": function(evt) {
            	// Add tile's features to the layer
            	featureLayer = tile.layer.addFeatures(evt.features);
        	},
        	"loadstart": function(evt) {
            tile.layer.numLoadingTiles++;
        },
        "loadend": function(evt) {
          tile.layer.numLoadingTiles--;
          if (tile.layer.numLoadingTiles === 0) {
            tile.layer.mergePolygons();
          }
      }}
        });
        // dummy things up ...
        this.dummyLayer.map = this.layer.map;
        this.drawn = false;
        // this.layer.map.addLayer(this.dummyLayer);
        tileStrategy.activate();

        // return false if url doesn't exist for this tile?
        return true;
    },


    /**
     * Method: clear
     * Clear the tile of any bounds/position-related data so that it can
     *     be reused in a new location.
     */
    clear: function() {
    	OpenLayers.Tile.prototype.clear.apply(this, arguments);
    	// console.log("GeoJson: clear");

    	// Destroy the current feature layer for this tile
    	featureLayer = this.layer.featureLayer;
   		if (this.dummyLayer != null) {
   			if (this.dummyLayer.features.length > 0) { featureLayer.removeFeatures(this.dummyLayer.features); }
   			this.dummyLayer.map = null;
   			this.dummyLayer.destroy(); // The API docs say this will remove popups
   			this.dummyLayer = null;
    	}
    },

    /**
     * Method createBackBuffer
     * Called by {OpenLayers.Grid}, but not supported by this "transparent"
     * layer.
     */
    createBackBuffer: function() {},

    CLASS_NAME: "OpenLayers.Tile.SeamlessGeoJSON"
});
