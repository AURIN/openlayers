/* Copyright (c) 2014 by OpenLayers Contributors (see authors.txt for
 * full list of contributors). Published under the 2-clause BSD license.
 * See license.txt in the OpenLayers distribution or repository for the
 * full text of the license. */

/**
 * @requires OpenLayers/Layer/OSM.js
 * @requires jsts/jsts.js
 * @requires jsts/javascript.util.js
 */

/**
 * Class: OpenLayers.Layer.GeoJsonTiles Create a layer for presenting tiles of
 * GeoJSON featuers from services that provide tiles in a z/x/y.json URL
 * compatible with the tile specification of OSM tile servers. This class
 * implementation inherits from OpenLayers.Layer.OSM and overrides tileClass and
 * a few other members.
 *
 * Example: (code) var layer = new OpenLayers.Layer.GeoJsonTiles( "My Layer", //
 * name for display in LayerSwitcher "http://<json server>/tiles/" ); (end)
 *
 * Inherits from: - <OpenLayers.Layer.OSM>
 */
OpenLayers.Layer.SeamlessGeoJSON = OpenLayers
    .Class(
        OpenLayers.Layer.OSM,
        {

          /**
           * APIProperty: name {String} The layer name. Defaults to
           * "OpenStreetMap" if the first argument to the constructor is null or
           * undefined.
           */
          name : "SeamlessGeoJSON",

          /**
           * GeoJsonTiles are always an overlay (unless you can think of a
           * reason for it to be a base layer).
           */
          isBaseLayer : false,

          /** File type could be "topojson" or "json" (defaults to "json") */
          type : "json",

          /**
           * Here is the real secret sauce: We replace the image based tiles
           * with a tile that adds features to our embedded feature layer.
           */
          tileClass : OpenLayers.Tile.SeamlessGeoJSON,

          /**
           * This is the layer that actually holds the features marshaled by the
           * tiles. If it is not provided when this object is created, then it
           * is created automatically with default styles.
           */
          featureLayer : null,

          /**
           * Layer used to temporarily hold features present in the tiles
           */
          bufferLayer : null,

          /**
           * The feature layer is the one the layer switcher needs to operate
           * on.
           */
          displayInLayerSwitcher : false,

          /**
           * Timeout set to trigger the merging of features
           */
          forcedMergeTimeOut : null,

          /**
           * Timeout set to trigger the clearing of features
           */
          forcedClearTimeOut : null,

          /**
           * Delay (in ms) to trigger the merge after the user stops
           * panning/zooming
           */
          initialDelay : 1000,

          /**
           * Delay (in ms) to trigger the merge after a tile is loaded
           */
          tileloadDelay : 500,

          eventListeners : {
            "moveend" : function(evt) {
//              console.log("moveend " + this.name); // XXX
              this.scheduleMergeFeatures(this.initialDelay);
            },
            "tileloadstart" : function(evt) {
//              console.log("tileloadstart " + this.name); // XXX
            },
            "tileloaderror" : function(evt) {
            },
            "tileloadend" : function(evt) {
//              console.log("moveend " + this.name); // XXX
              this.scheduleMergeFeatures(this.tileloadDelay);
            },
            "tileunload" : function(evt) {
              console.log("tileunload " + this.name); // XXX
            },
          },

          setMap : function(map) {
            OpenLayers.Layer.OSM.prototype.setMap.apply(this, arguments);
            this.map.addLayer(this.featureLayer);
          },

          /**
           * Constructor: OpenLayers.Layer.OSM
           *
           * Parameters: name - {String} The layer name. url - {String} The
           * tileset URL scheme. options - {Object} Configuration options for
           * the layer. Any inherited layer option can be set in this object
           * (e.g. <OpenLayers.Layer.Grid.buffer>).
           */
          initialize : function(name, url, options) {

            this.type = (options && options.format === "topojson") ? "topojson"
                : "json";
            OpenLayers.Layer.OSM.prototype.initialize.apply(this, arguments);
            options.projection = (options.projection) ? options.projection
                : "EPSG:3785";
            this.initialDelay = (options.initialdelay) ? Number(options.initialdelay)
                : this.initialDelay;
            this.tileloadDelay = (options.tileloaddelay) ? Number(options.tileloaddelay)
                : this.tileloadDelay;

            // Creates the -hidden- feature layer
            this.bufferLayer = new OpenLayers.Layer.Vector(this.name, options);

            // Creates the feature layer holding the merged polygons
            this.featureLayer = new OpenLayers.Layer.Vector(this.name, options);
          },

          /*
           * addFeatures : function(features, options) {
           * this.featureLayer.addFeatures(features, options); },
           */
          addTileFeatures : function(features) {
            this.bufferLayer.addFeatures(features, null);
          },

          /**
           * Schedules the merging of tiles after a given time in ms
           *
           * Parameters: delay {Number} delay time in ms
           */
          scheduleMergeFeatures : function(delay) {
            if (this.forcedMergeTimeOut) {
              clearTimeout(this.forcedMergeTimeOut);
            }

            var self = this;
            this.forcedMergeTimeOut = setTimeout(function() {
              self.mergeFeatures();
              self.events.triggerEvent("loadend", {
                object : self
              });
            }, delay);
          },

          /**
           * Schedules the clearing of the features accumulated in the hidden tile layer
           *
           * Parameters: delay {Number} delay time in ms
           */
          scheduleClearFeatures : function(delay) {
            if (this.forcedClearTimeOut) {
              clearTimeout(this.forcedClearTimeOut);
            }

            var self = this;
            this.forcedClearTimeOut = setTimeout(function() {
//              self.bufferLayer.removeAllFeatures();
            }, delay);
          },

          /**
           * Merge the tiled features by their ID
           */
          mergeFeatures : function() {

            var self = this;
            var olParser = new jsts.io.OpenLayersParser();
            var jstsFeatures = {};

            self.bufferLayer.features.forEach(function(feat) {
              if (!feat.attributes.id || !feat.geometry) {
                return;
              }
              var id = feat.attributes.id;
              var geom = olParser.read(feat.geometry);

              if (!jstsFeatures[id]) {
                jstsFeatures[id] = {
                  geometry : geom,
                  attributes : feat.attributes
                };
              } else {
                try {
                jstsFeatures[id] = {
                  geometry : jstsFeatures[id].geometry.union(geom),
                  attributes : feat.attributes
                };
                } catch(e) {
                  console.log("topology error " + e);
                }
              }
            });

            this.featureLayer.removeAllFeatures();

            Object.getOwnPropertyNames(jstsFeatures).forEach(
                function(id) {
                  self.featureLayer.addFeatures(new OpenLayers.Feature.Vector(
                      olParser.write(jstsFeatures[id].geometry),
                      jstsFeatures[id].attributes));
                });

            this.scheduleClearFeatures(this.tileloadDelay * 2); // TODO: make it a parameter ?
          },

          CLASS_NAME : "OpenLayers.Layer.SeamlessGeoJSON"
        });