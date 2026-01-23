let map;
let infoWindow;

let selectedLatLng = null;
let selectedPin = null;

const landmarks = [];

function initMap() {
  const defaultCenter = { lat: 43.6532, lng: -79.3832 };

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 13,
  });

  infoWindow = new google.maps.InfoWindow();

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
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition((pos) => {
    selectedLatLng = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    map.setCenter(selectedLatLng);
    map.setZoom(15);
    placeSelectedPin(selectedLatLng);
  });
}

function placeSelectedPin(latLng) {
  if (selectedPin) selectedPin.setMap(null);
  selectedPin = new google.maps.Marker({
    map,
    position: latLng,
  });
}

function handleAddLandmark(e) {
  e.preventDefault();

  const title = titleInput().value.trim();
  const description = descInput().value.trim();
  const file = imageInput().files[0];

  if (!title || !description || !selectedLatLng) {
    alert("Complete all fields and choose a location.");
    return;
  }

  const landmark = {
    id: crypto.randomUUID(),
    title,
    description,
    imageUrl: file ? URL.createObjectURL(file) : null,
    lat: selectedLatLng.lat,
    lng: selectedLatLng.lng,
    marker: null,
  };

  landmark.marker = createLandmarkMarker(landmark);
  landmarks.push(landmark);

  renderLandmarkList();
  e.target.reset();
}

function createLandmarkMarker(landmark) {
  const marker = new google.maps.Marker({
    map,
    position: { lat: landmark.lat, lng: landmark.lng },
    title: landmark.title,
  });

  marker.addListener("click", () => {
    openInfo(marker, landmark);
    highlightListItem(landmark.id);
  });

  return marker;
}

function openInfo(marker, landmark) {
  const content = `
    <div>
      <strong>${escapeHtml(landmark.title)}</strong>
      <p>${escapeHtml(landmark.description)}</p>
    </div>
  `;
  infoWindow.setContent(content);
  infoWindow.open(map, marker);
}

function renderLandmarkList() {
  const ul = document.getElementById("landmark-items");
  ul.innerHTML = "";

  landmarks.forEach((lm) => {
    const li = document.createElement("li");
    li.dataset.id = lm.id;
    li.textContent = lm.title;

    li.addEventListener("click", () => {
      map.setCenter({ lat: lm.lat, lng: lm.lng });
      map.setZoom(16);
      openInfo(lm.marker, lm);
      highlightListItem(lm.id);
    });

    ul.appendChild(li);
  });
}

function highlightListItem(id) {
  document.querySelectorAll("#landmark-items li").forEach((li) => {
    li.style.outline = li.dataset.id === id ? "2px solid #122a57" : "none";
  });
}

function titleInput() {
  return document.getElementById("title");
}
function descInput() {
  return document.getElementById("description");
}
function imageInput() {
  return document.getElementById("image");
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