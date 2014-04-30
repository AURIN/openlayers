/**
 * Class: OpenLayers.Format.TopoJSON A parser to read/write TopoJSON safely.
 * Create a new instance with the <OpenLayers.Format.TopoJSON> constructor.
 *
 * Inherits from: - <OpenLayers.Format.JSON>
 *
 * @requires topojson/topojson.v1.min.js
 */
OpenLayers.Format.TopoJSON = OpenLayers
    .Class(
        OpenLayers.Format.GeoJSON,
        {

          /**
           * Constructor: OpenLayers.Format.TopoJSON Create a new parser for
           * TopoJSON.
           *
           * Parameters: options - {Object} An optional object whose properties
           * will be set on this instance.
           */

          /**
           * APIMethod: read Deserialize a TopoJSON string.
           *
           * Parameters: json - {String} A JSON string filter - {Function} A
           * function which will be called for every key and value at every
           * level of the final result. Each value will be replaced by the
           * result of the filter function. This can be used to reform generic
           * objects into instances of classes, or to transform date strings
           * into Date objects.
           *
           * Returns: {Object} An object, array, string, or number .
           */
          read : function(json, filter, collections) {
            var self= this;
            var coords, fc_name, feature, o, obj, point, points, poly, results, ring, topo, topo_geom, x, y, _i, _j, _len, _len1, _ref;
            if (typeof json === "string") {
              obj = OpenLayers.Format.JSON.prototype.read.apply(this, [ json,
                  filter ]);
            } else {
              obj = json;
            }
            if (!obj) {
              OpenLayers.Console.error("Bad TopoJSON: " + json);
            } else if (typeof obj.type !== "string") {
              OpenLayers.Console.error("Bad TopoJSON - no type: " + json);
            } else {
              results = [];
              if ((collections != null)
                  && !OpenLayers.Util.isArray(collections)) {
                collections = [ collections ];
              }
              // FIXME: the call to stringify is not terribly efficient
              for (fc_name in obj.objects) {
                obj.objects[fc_name].geometries.forEach(function(topogeom) {
                  var topoFeat = topojson.feature(obj, topogeom);
                  var olFeat = new OpenLayers.Feature.Vector(
                      OpenLayers.Format.GeoJSON.prototype.read.apply(self,
                          [ JSON.stringify(topoFeat.geometry), "Geometry" ]), topoFeat.properties);
                  results.push(olFeat);
                });
              }
            }
            return results;
          },

          CLASS_NAME : "OpenLayers.Format.TopoJSON"

        });