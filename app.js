/* App.js */

mapboxgl.accessToken = 'pk.eyJ1IjoieHh4ZmFudGEiLCJhIjoiY2poNGdoeHM0MG51cDJ3bzQ1MHAydDQ0ZSJ9.YRSL8nTdHO3ivnkP0Abcig';
let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/xxxfanta/cjh4h9yyv1pqt2rnzme6jl7oc',
    zoom: 2.5,
    center: [-96, 37.8]
});

// Add geolocate control to the map.
map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true
}));
/*
map.addControl(new MapboxGeocoder({
    accessToken: mapboxgl.accessToken
}));
*/

// Draw some lines and animate
let destinations = [
    [-122.414, 37.776],
    [-77.032, 38.913],
    [9.994, 53.551]
];

let geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    flyTo: false
});

document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

//document.getElementById('test').appendChild(geocoder.onAdd(map));

// A simple line from origin to destination.
let route = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": destinations
        }
    }]
};

// A single point that animates along the route.
// Coordinates are initially set to origin.
let point = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "properties": {},
        "geometry": {
            "type": "Point",
            "coordinates": destinations[0]
        }
    }]
};

// Number of steps to use in the arc and animation, more steps means
// a smoother arc and animation, but too many steps will result in a
// low frame rate
let steps = 500;
function drawArcsBetweenDestinations() {
    // Calculate the distance in kilometers between route start/end point.
    let lineDistance = turf.lineDistance(route.features[0], 'kilometers');
    let arc = [];

    // Draw an arc between the `origin` & `destination` of the two points
    for (let i = 0; i < lineDistance; i += lineDistance / steps) {
        let segment = turf.along(route.features[0], i, 'kilometers');
        arc.push(segment.geometry.coordinates);
    }

    // Update the route with calculated arc coordinates
    route.features[0].geometry.coordinates = arc;
}
drawArcsBetweenDestinations();
// Used to increment the value of the point measurement against the route.
let counter = 0;

map.on('load', function () {
    // Add a source and layer displaying a point which will be animated in a circle.
    map.addSource('route', {
        "type": "geojson",
        "data": route
    });

    map.addSource('point', {
        "type": "geojson",
        "data": point
    });

    map.addLayer({
        "id": "route",
        "source": "route",
        "type": "line",
        "paint": {
            "line-width": 2,
            "line-color": "#007cbf"
        }
    });

    map.addLayer({
        "id": "point",
        "source": "point",
        "type": "symbol",
        "layout": {
            "icon-image": "airport-15",
            "icon-rotate": ["get", "bearing"],
            "icon-rotation-alignment": "map",
            "icon-allow-overlap": true
        }
    });

    geocoder.on('result', function(ev) {
        let newCoordinates = ev.result.geometry.coordinates;
        let newLocation = {type: 'Point', coordinates: newCoordinates};
        //map.getSource('single-point').setData(newLocation);
        destinations.push(newCoordinates);
        route.features[0].geometry.coordinates.push(newCoordinates);
        redrawPaths();
        drawArcsBetweenDestinations();
    });

    function animate() {
        // Update point geometry to a new position based on counter denoting
        // the index to access the arc.
        point.features[0].geometry.coordinates = route.features[0].geometry.coordinates[counter];

        // Calculate the bearing to ensure the icon is rotated to match the route arc
        // The bearing is calculate between the current point and the next point, except
        // at the end of the arc use the previous point and the current point
        point.features[0].properties.bearing = turf.bearing(
            turf.point(route.features[0].geometry.coordinates[counter >= steps ? counter - 1 : counter]),
            turf.point(route.features[0].geometry.coordinates[counter >= steps ? counter : counter + 1])
        );

        // Update the source with this new data.
        map.getSource('point').setData(point);

        // Request the next frame of animation so long the end has not been reached.
        if (counter < steps) {
            requestAnimationFrame(animate);
        }

        counter = counter + 1;
    }

    function redrawPaths() {
        console.log('RedrawPaths');
        // Set the coordinates of the original point back to origin
        point.features[0].geometry.coordinates = origin;

        // Update the source layer
        map.getSource('point').setData(point);

        // Reset the counter
        counter = 0;

        // Restart the animation.
        animate(counter);
    }

    document.getElementById('replay').addEventListener('click', function() {
        redrawPaths();
    });

    // Start the animation.
    animate(counter);
});
