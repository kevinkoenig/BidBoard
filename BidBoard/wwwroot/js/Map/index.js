var NameSpace = NameSpace || {};

NameSpace.MapObject = function () {
    // noinspection JSUnusedGlobalSymbols
    let markers = [];
    let features = [];
    let map = null;
    let fipsCodes = [];
    let searchBox;
    const rapidApiKey = "24e8733f94msh3b1afac6ebbd7d9p184f52jsnb8190b8c98bf";
    const rapidApiHost = "vanitysoft-boundaries-io-v1.p.rapidapi.com";
    const findFipsCode = (county, state) => fipsCodes.find(element => element.county === county && element.state === state);
    
    let 
        findAddressComponent = function (place, type) {
            let names = {
                shortName: "",
                longName: ""
            };
            place.address_components.forEach(component => {
                component.types.forEach(componentType => {
                    if (componentType === type) {
                        names.shortName = component.short_name;
                        names.longName = component.long_name;
                    }
                });
            });
            
            return names;
        },
        
        shortenCounty = function (county) {
            if (county.indexOf("County")) {
                let countyComponents = county.split(" ");
                countyComponents.pop();
                if (countyComponents.length) {
                    return countyComponents.join(" ");
                }
            }
            
            return county;
        },
    
        getPlaceBoundaryApiUrl = function (place) {
            if (place.address_components && place.address_components.length) {
                let component = place.address_components[0];
                let url = "";
                let state = findAddressComponent(place, "administrative_area_level_1").longName;
                switch(component.types[0]) {
                    case "postal_code":
                        url = `https://vanitysoft-boundaries-io-v1.p.rapidapi.com/reaperfire/rest/v1/public/boundary?zipcode=${component.short_name}&city=null&state=null&county=null&limit=30`;
                        break;
                        
                    case "street_number":
                    case "locality":
                    case "administrative_area_level_3":  // town
                        let lat = place.geometry.location.lat();
                        let lng = place.geometry.location.lng();
                        url = `https://vanitysoft-boundaries-io-v1.p.rapidapi.com/reaperfire/rest/v1/public/boundary/within?showwithinpoint=showWithinPoint&latitude=${lat}&longitude=${lng}`;
                        break;
                    case "sublocality_level_1": {
                        let county = shortenCounty(findAddressComponent(place, "administrative_area_level_2").shortName);
                        let state = findAddressComponent(place, "administrative_area_level_1").shortName;
                        if (county && state) {
                            let fipsCode = findFipsCode(county, state);
                            if (fipsCode) {
                                url = `https://vanitysoft-boundaries-io-v1.p.rapidapi.com/reaperfire/rest/v1/public/boundary/fips/${fipsCode.code}?showDetails=true`;
                            }
                        }
                    }
                    break;
                    case "administrative_area_level_2":  // county
                        let county = shortenCounty(component.short_name);
                        let state = findAddressComponent(place, "administrative_area_level_1").shortName;
                        
                        if (state) {
                            let fipsCode = findFipsCode(county, state);
                            if (fipsCode) {
                                url = `https://vanitysoft-boundaries-io-v1.p.rapidapi.com/reaperfire/rest/v1/public/boundary/fips/${fipsCode.code}?showDetails=true`;
                            }
                        }
                        break;
                    case "administrative_area_level_1": // state
                        url = `https://vanitysoft-boundaries-io-v1.p.rapidapi.com/reaperfire/rest/v1/public/boundary/state/${component.short_name}`;
                        
                        break;
                }
                return {
                    url: url,
                    isState: component.types[0] === "administrative_area_level_1",
                    state: state
                };
            }
            
            return null;
        },
    
        addGeographicBoundaries = function (place) {
            let placeInfo = getPlaceBoundaryApiUrl(place)
            if (!placeInfo) { return; }
        
            let settings = {
                "async": true,
                "crossDomain": true,
                "url": placeInfo.url,
                "method": "GET",
                "headers": {
                    "x-rapidapi-host": rapidApiHost,
                    "x-rapidapi-key": rapidApiKey,
                    "accept": "application/json"
                }
            }
        
            $.ajax(settings).then(function (response) {
                map.data.setStyle({
                    strokeColor: "#9f7878",
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: "#9f7878",
                    fillOpacity: 0.25
                });
                features = map.data.addGeoJson(response);
                if (response.features.length) {
                    if (! placeInfo.isState) {
                        let zips = [];
                        response.features.forEach(feature => {
                            if (feature.properties.zipCode)
                                zips.push(feature.properties.zipCode);
                            else if (feature.properties.zipCodes)
                                zips = zips.concat(zips, feature.properties.zipCodes);
                        });
                        NameSpace.projects.setZipCodesFilter(zips);
                    }
                    else if (placeInfo.isState) {
                        NameSpace.projects.setStateFilter(placeInfo.state);
                    }
                }
            });
        },
    
        removeAllMarkers = function () {
            // remove the overlays
            markers.forEach(marker => marker.setMap(null));
            features.forEach(feature => map.data.remove(feature));
            markers = [];
            features = [];
        },
    
        processPlacesChanged = function () {
            const places = searchBox.getPlaces();
            if (places.length === 0) {
                return;
            }
        
            // remove the overlays
            removeAllMarkers();
        
            const bounds = new google.maps.LatLngBounds();
        
            places.forEach(place => {
                addGeographicBoundaries(place);
        
                if (!place.geometry) {
                    return;
                }
        
                const icon = {
                    url: place.icon,
                    size: new google.maps.Size(71,71),
                    origin: new google.maps.Point(0,0),
                    anchor: new google.maps.Point(17,34),
                    scaledSize: new google.maps.Size(25,25)
                };
                let marker = new google.maps.Marker({
                    map,
                    icon,
                    title: place.name,
                    position: place.geometry.location
                });
                markers.push(marker);

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            
            map.fitBounds(bounds);
        },
    
        startMap = function(curPos) {
            map = new google.maps.Map($("#map").get(0), { zoom: 12, center: curPos });
            
            const input = $("#map-search");
            searchBox = new google.maps.places.SearchBox(input.get(0));
            map.addListener("bounds_changed", () => {
                searchBox.setBounds(map.getBounds());
            });

            searchBox.addListener("places_changed", processPlacesChanged);
        };

    $(window).on("q2c.resize.window", function (e) {
        $("#map-container").height(e.contentHeight - 50);
        if (NameSpace.projects) {
            NameSpace.projects.resize(e.contentHeight - 50);
        }
    });

    $.get("/api/FipsCodes")
        .then((data) => {
            NameSpace.projects = new NameSpace.Projects();
            NameSpace.filters = new NameSpace.Filters();
            window.dispatchEvent(new Event("resize"));
            
            fipsCodes = data;
            let curPos = {lat: -25.344, lng: 131.036};
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    curPos = {lat: position.coords.latitude, lng: position.coords.longitude};
                    startMap(curPos);
                });
            } else
                startMap(curPos);
        });
    
    return {
        removeAllMarkers: removeAllMarkers
    }
};

// noinspection JSUnusedGlobalSymbols
function initMap () {
    NameSpace.mapObject = new NameSpace.MapObject();
}
