let map;
let selectedLatLng = null;
let selectedPin = null;

const landmarks = [];

// Initial map center (Toronto) – user-selected location will override this
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

  document
    .getElementById("add-landmark-form")
    .addEventListener("submit", handleAddLandmark);
}

function handleAddLandmark(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const fileInput = document.getElementById("image");
  const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

  if (!title || !description) {
    alert("Please enter a title and description.");
    return;
  }

  if (!selectedLatLng) {
    alert("Pick a location (map click or current location).");
    return;
  }

  // store image in memory (URL string), not uploaded
  let imageUrl = null;
  if (file) imageUrl = URL.createObjectURL(file);

  const landmark = {
    id: crypto.randomUUID(),
    title,
    description,
    imageUrl,
    lat: selectedLatLng.lat,
    lng: selectedLatLng.lng,
  };

  landmarks.push(landmark);

  e.target.reset();
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
