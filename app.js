let map;
let selectedLatLng = null;
let selectedPin = null;

// Initial map center (Toronto) – user-selected location will override this
function initMap() {
  const defaultCenter = { lat: 43.6532, lng: -79.3832 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 13,
  });

  map.addListener("click", (e) => {
    selectedLatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };

    if (selectedPin) selectedPin.setMap(null);
    selectedPin = new google.maps.Marker({
      map,
      position: selectedLatLng,
      title: "Selected location",
    });
  });
}

window.initMap = initMap;
