/*
 * Libs
 */
import L from "leaflet";
import * as turf from "@turf/turf";
const inside = require("point-in-geopolygon");
import _ from "lodash";
import "leaflet.markercluster";
import * as GeoJson from "geojson";
import "react-toastify/dist/ReactToastify.css";
import "./styles.scss";
import * as Reducer from "./reducer";
import { objectToGeojson, getAllObjectsAsFeature } from "./helpers/utils";
import { DefaultIcon, Icons } from "./components/Icons";
/*
 * Assets
 */
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

let map: L.Map;
let geoJsonLayer: L.GeoJSON;
let markerGroup: any;

export type FeatureProperties = Reducer.SingleObject;
export type GeojsonFeature = GeoJson.Feature<
  GeoJson.Geometry,
  FeatureProperties
>;

/*
 * @param opts
 */
export function init(opts: {
  onContextSearch: (context: Reducer.CoordinateQuery) => void;
  onZoomChange: (zoomLevel: number) => void;
  onClick: (el: Reducer.SingleObject) => void;
  onLayersClick: (info: Reducer.State["clickedLayer"]) => void;
}) {
  //Define basemap layers

  //brtKaart layer
  const brtKaart = L.tileLayer(
    "https://geodata.nationaalgeoregister.nl/tiles/service/wmts/brtachtergrondkaart/EPSG:3857/{z}/{x}/{y}.png",
    {
      attribution:
        'Kaartgegevens &copy; <a href="https://www.kadaster.nl/" target="_blank" rel = "noreferrer noopener">Kadaster</a> | <a href="https://www.verbeterdekaart.nl" target="_blank" rel = "noreferrer noopener">Verbeter de kaart</a> ',
    }
  );
  //luchtfoto layer
  const luchtfotorgb = L.tileLayer(
    "https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/2020_ortho25/EPSG:3857/{z}/{x}/{y}.jpeg",
    {
      attribution:
        'Landelijke Voorziening Beeldmateriaal &copy; <a href="https://www.pdok.nl/" target="_blank" rel = "noreferrer noopener">PDOK</a> ',
    }
  );
  //OSM layer
  const OSM = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  );

  // Google maps

  //   googleStreets = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
  //     maxZoom: 20,
  //     subdomains:['mt0','mt1','mt2','mt3']
  // });

  //Group the basemap layers...here changed
  let baseMaps = {
    "Luchtfoto's": luchtfotorgb,
    "Open Street Map": OSM,
    // "googleStreets": googleStreets
    "BRT Achtergrondkaart": brtKaart,
  };

  //Define the map
  map = L.map("map", {
    minZoom: 8,
    center: [52.20936, 5.2],
    zoom: 8,
    maxBounds: [
      [56, 10],
      [49, 0],
    ],
    layers: [brtKaart, luchtfotorgb, OSM], //include two baseMap layers
  });
  // (window as any).map = map; //for debugging mariam what is for

  //Add layer control(select basemap) for the last version
  L.control.layers(baseMaps).addTo(map);

  //When you click on the card, all locations get back around.

  map.on("contextmenu", (e) => {
    let latLong = (e as any).latlng;

    //Close Pop Ups from the map
    // map.closePopup();/// mariam What is for

    opts.onContextSearch({
      lng: latLong.lat.toString(),
      lat: latLong.lng.toString(),
    });
  });

  //enable the zoom
  // map.doubleClickZoom.enabled();

  /**
   * The function that the card calls every time it want to add a marker.
   **/
  const addMarker = (feature: GeojsonFeature, latlng: L.LatLng): any => {
    // Create a marker
    let marker = L.marker(latlng);

    marker.feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [latlng.lat, latlng.lng] },
      properties: feature.properties,
    };
    markerGroup.addLayer(marker);

    //Method that are called to open the marker
    let onHover = function(this: L.Marker) {
      this.openPopup();
      this.setIcon(Icons);
    }.bind(marker);

    //Method that is called to close the marker
    let onHoverOff = function(this: L.Marker) {
      this.closePopup();
      this.setIcon(DefaultIcon);
    }.bind(marker);

    //When you click on it Go to that marker
    marker.on(
      "click",
      () => {
        opts.onClick(feature.properties as any);
      },
      marker.openPopup()
    );

    // When you cross the marker Let the pop up
    marker.on("mouseover", onHover);

    // When you leave it from it
    marker.on("mouseout", onHoverOff);
    return marker;
  };

  const addMarkerForNonPoint = (feature: GeojsonFeature, latlng: L.LatLng) => {
    //Create a marker
    let marker = L.marker(latlng);
    marker.feature = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [latlng.lat, latlng.lng] },
      properties: feature.properties,
    };
    // this is the popup and the html that will appear.
    marker.bindPopup(
      `<div class = "marker">
                      <b><a href= 
                      https://data.pldn.nl/
                       target="_blank">PLDN</a></b>
                      <br/>
                      ${Object.keys(feature.properties)
                        .map((k) => {
                          if (k === "geo" || k === "sub") return "";
                          return `<b>${k[0].toUpperCase() + k.slice(1)}: ${
                            feature.properties[k]
                          }</b>`;
                        })
                        .join("<br/>")}
                      <br/>
                      <div>
              `,
      {
        autoPan: false,
        closeButton: false,
      }
    );

    //Method that are called to open the marker
    let onHover = function(this: L.Marker) {
      this.openPopup();
      this.setIcon(Icons); //icons??? not default
    }.bind(marker);

    //Method that is called to close the marker
    let onHoverOff = function(this: L.Marker) {
      this.setIcon(DefaultIcon);
    }.bind(marker);

    //When you cross the marker Let the pop up see
    marker.on("mouseover", onHover);

    //When you leave it from it
    marker.on("mouseout", onHoverOff);

    // I comment this to zoom to marker Now
    //When you click on it Go to that marker
    marker.on("click", function(this: L.Marker) {
      // here should go to marker but????
      opts.onClick(feature.properties);
      this.openPopup();
    });
    return marker;
  };
  /**
   * Called every time a geojson object is drawn.
   **/
  const handleGeoJsonLayerDrawing = (
    feature: GeojsonFeature,
    layer: L.Layer
  ) => {
    if (feature.geometry.type === "Point") return;

    //First find the center
    let latLong = getCenterGeoJson(feature);

    //On this center add a marker
    markerGroup.addLayer(addMarkerForNonPoint(feature, latLong));

    //If you click on it there then
    layer.on("click", (e: any) => {
      //Check if there are several layers
      let contains = getAllGeoJsonObjectContainingPoint(
        e.latlng.lng,
        e.latlng.lat
      );

      //If only one is low
      if (contains.length < 2) {
        opts.onClick(feature.properties as any);
      } else {
        opts.onLayersClick({
          x: e.originalEvent.pageX,
          y: e.originalEvent.pageY,
          values: contains.reverse().map((res) => res.properties),
        });
      }
    });
  };

  geoJsonLayer = L.geoJSON([] as any, {
    onEachFeature: handleGeoJsonLayerDrawing,
    pointToLayer: addMarker as any,
    style: {
      color: "LightSeaGreen",
    },
  }).addTo(map);

  // the group for the markers
  markerGroup = (L as any).markerClusterGroup({
    showCoverageOnHover: false,
  });

  map.addLayer(markerGroup);

  //This is for mobile application.If dragged then closes the context menu.
  map.on("dragstart", () => {});
  map.on("zoomend" as any, () => {
    opts.onZoomChange(map.getZoom());
  });
}

export function closePopup() {
  if (map) map.closePopup();
}
export function centerMap() {
  map.setView([52.20936, 5.2], 8);
}
export function updateMap(opts: {
  selectedObject?: Reducer.SingleObject;
  searchResults?: Reducer.State["searchResults"];
  properties?: Reducer.State["properties"];
  updateZoom: boolean;
}) {
  map.closePopup();
  markerGroup.clearLayers();
  geoJsonLayer.clearLayers(); // Mariam
  let points = opts.searchResults.map((s) => {
    let newS = {} as Reducer.SingleObject;
    newS.geo = s.geo;
    newS.sub = s.sub;
    for (let [k, v] of Object.entries(opts.properties)) {
      if (v) {
        newS[k] = s[k];
      }
    }
    return newS;
  });
  // If there is a clicking result, render only this one
  if (opts.selectedObject) {
    geoJsonLayer.addData(objectToGeojson(opts.selectedObject));
    map.fitBounds(L.featureGroup([geoJsonLayer, markerGroup]).getBounds());
  } else if (points.length) {
    // opts.searchResults.length mariam
    let features = getAllObjectsAsFeature(points) as any; // opts.searchResults changed to points mariam
    geoJsonLayer.addData(features);
    map.fitBounds(L.featureGroup([geoJsonLayer, markerGroup]).getBounds());
  } else if (opts.updateZoom) {
    centerMap();
  }
}

export function toggleClustering(toggle: boolean) {
  if (toggle) {
    map.removeLayer(markerGroup);

    markerGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
    });
    map.addLayer(markerGroup);
  } else {
    map.removeLayer(markerGroup);

    markerGroup = L.featureGroup().addTo(map);
  }
}

const getAllFeaturesFromLeaflet = () => {
  return geoJsonLayer
    .getLayers()
    .map((l: any) => l.feature) as GeojsonFeature[];
};

export function findMarkerByUrl(registratie: string) {
  return markerGroup.getLayers().find((l: any) => {
    const feature: GeojsonFeature = l.feature;
    return feature.properties.sub === registratie;
  });
}

/**
 * Get all Geojson objects that are in the results holder where this item is in.
 */
const getAllGeoJsonObjectContainingPoint = (lng: number, lat: number) => {
  return getAllFeaturesFromLeaflet().filter((res) => {
    if (res.geometry.type !== "MultiPolygon" && res.geometry.type !== "Polygon")
      return false;
    let col = { type: "FeatureCollection", features: [res] };
    //Filter, when ER -1 exceeds, the point is not in the polygon.
    return inside.feature(col, [lng, lat]) !== -1;
  });
};

const getCenterGeoJson = (geojson: any): L.LatLng => {
  let centroid = turf.center(geojson);

  //maak er een geojson en feature van. = make it a geojson and feature.
  let geoJsonFeature = geojson.geometry
    ? geojson
    : { type: "Feature", geometry: geojson };
  geojson = geojson.geometry ? geojson.geometry : geojson;

  //Multipolygon werkt niet met turf.booleanContains. = Multipolygon does not work with turf.booleanContains.
  if (geojson.type !== "MultiPolygon") {
    //als deze niet in het geojson object ligt, gebruik dan de centroid = if it is not in the geojson object, use the centroid
    if (!turf.booleanContains(geoJsonFeature, centroid)) {
      centroid = turf.centroid(geoJsonFeature);
    }

    //anders gebruik point on feature = otherwise use point on feature
    if (!turf.booleanContains(geojson, centroid)) {
      centroid = turf.pointOnFeature(geojson);
    }
  } else {
    //gebruik inside voor multipolygon om te controlleren. = use inside for multipolygon to check.
    let lon = centroid.geometry.coordinates[0];
    let lat = centroid.geometry.coordinates[1];
    let col = { type: "FeatureCollection", features: [geoJsonFeature] };
    let isInside = inside.feature(col, [lon, lat]) !== -1;

    if (!isInside) {
      centroid = turf.centroid(geojson);
    }

    lon = centroid.geometry.coordinates[0];
    lat = centroid.geometry.coordinates[1];
    col = { type: "FeatureCollection", features: [geoJsonFeature] };
    isInside = inside.feature(col, [lon, lat]) !== -1;

    if (!isInside) {
      centroid = turf.pointOnFeature(geojson);
    }
  }

  //Get the bar and lung
  let lon = centroid.geometry.coordinates[0];
  let lat = centroid.geometry.coordinates[1];

  return L.latLng(lat, lon);
};
