let map;

function initMap() {
  const defaultCenter = { lat: 43.6532, lng: -79.3832 }; // Toronto
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultCenter,
    zoom: 13,
  });
}

window.initMap = initMap;