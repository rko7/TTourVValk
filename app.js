let map;
let selectedLatLng = null;
let selectedPin = null;

//// Initial map center (Toronto) – user-selected location will override this
function initMap() {
  const defaultCenter = { lat: 43.6532, lng: -79.3832 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 13,
  });

  map.addListener("click", (e) => {
    selectedLatLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    placeSelectedPin(selectedLatLng);
  });

  document
    .getElementById("use-current-location")
    .addEventListener("click", handleUseCurrentLocation);
}

function handleUseCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      selectedLatLng = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      map.setCenter(selectedLatLng);
      map.setZoom(15);
      placeSelectedPin(selectedLatLng);
    },
    () => {
      alert("Could not access location.");
    }
  );
}

function placeSelectedPin(latLng) {
  if (selectedPin) selectedPin.setMap(null);
  selectedPin = new google.maps.Marker({
    map,
    position: latLng,
    title: "Selected location",
  });
}

window.initMap = initMap;
