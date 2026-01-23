let map;
let infoWindow;

let selectedLatLng = null;
let selectedPin = null;

// All landmark data lives in memory only
const landmarks = [];

function initMap() {
  // Default center (Toronto) used only as an initial fallback
  const defaultCenter = { lat: 43.6532, lng: -79.3832 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 13,
  });

  infoWindow = new google.maps.InfoWindow();

  // Pick coordinates by clicking the map
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

function handleAddLandmark(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const fileInput = document.getElementById("image");
  const file = fileInput.files[0];

  if (!title || !description) {
    alert("Please enter a title and description.");
    return;
  }

  if (!selectedLatLng) {
    alert("Pick a location first.");
    return;
  }

  let imageUrl = null;
  if (file) imageUrl = URL.createObjectURL(file);

  const landmark = {
    id: crypto.randomUUID(),
    title,
    description,
    imageUrl,
    lat: selectedLatLng.lat,
    lng: selectedLatLng.lng,
    marker: null,
  };

  landmark.marker = createLandmarkMarker(landmark);
  landmarks.push(landmark);

  e.target.reset();
}

function createLandmarkMarker(landmark) {
  const marker = new google.maps.Marker({
    map,
    position: { lat: landmark.lat, lng: landmark.lng },
    title: landmark.title,
  });

  marker.addListener("click", () => {
    const imgHtml = landmark.imageUrl
      ? `<div style="margin-top:8px">
           <img src="${landmark.imageUrl}" style="max-width:220px;border-radius:8px" />
         </div>`
      : "";

    const content = `
      <div style="max-width:260px">
        <strong>${escapeHtml(landmark.title)}</strong>
        <p>${escapeHtml(landmark.description)}</p>
        ${imgHtml}
      </div>
    `;

    infoWindow.close();
    infoWindow.setContent(content);
    infoWindow.open(map, marker);
  });

  return marker;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c];
  });
}

window.initMap = initMap;
