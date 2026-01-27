let map;
let infoWindow;

let landmarks = []; // { id, title, description, imageDataUrl, position:{lat,lng}, marker, isVisible }
let selectedId = null;

let pendingPosition = null;
let pendingMarker = null;

const DEFAULT_CENTER = { lat: 43.6532, lng: -79.3832 }; // start in Toronto

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: DEFAULT_CENTER,
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  infoWindow = new google.maps.InfoWindow();

  map.addListener("click", (e) => {
    setPendingPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setFormMessage("Location selected.", "ok");
  });

  wireUpForm();
  renderLandmarkList();
}

function wireUpForm() {
  const form = document.getElementById("add-landmark-form");
  const useCurrentBtn = document.getElementById("use-current-location");

  // primary buttons style
  if (useCurrentBtn) useCurrentBtn.classList.add("btn-primary");

  // Create/attach coords button (keep existing if already present)
  let coordsBtn = document.getElementById("enter-coords");
  if (!coordsBtn) {
    const locationControls = document.querySelector(".location-controls");
    coordsBtn = document.createElement("button");
    coordsBtn.type = "button";
    coordsBtn.id = "enter-coords";
    locationControls.appendChild(coordsBtn);
  }
  coordsBtn.type = "button";
  coordsBtn.textContent = "Set Coordinates";
  coordsBtn.classList.add("btn-primary");

  // Submit button
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.classList.add("btn-primary");

  // Custom file name display
  const imgEl = document.getElementById("image");
  const fileNameEl = document.getElementById("file-name");
  if (imgEl && fileNameEl) {
    imgEl.addEventListener("change", () => {
      const file = imgEl.files && imgEl.files[0];
      fileNameEl.textContent = file ? file.name : "No file chosen";
    });
  }

  // Use current location
  if (useCurrentBtn) {
    useCurrentBtn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        setFormMessage("Geolocation is not supported in this browser.", "error");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPendingPosition(p);
          map.panTo(p);
          map.setZoom(15);
          setFormMessage("Using your current location.", "ok");
        },
        () => setFormMessage("Unable to get your current location.", "error"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  // Set coordinates
  coordsBtn.addEventListener("click", () => {
    const latStr = prompt("Latitude?");
    const lngStr = prompt("Longitude?");
    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setFormMessage("Please enter valid numbers for latitude and longitude.", "error");
      return;
    }

    const p = { lat, lng };
    setPendingPosition(p);
    map.panTo(p);
    map.setZoom(15);
    setFormMessage("Coordinates set.", "ok");
  });

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("description");

    const title = titleEl.value.trim();
    const description = descEl.value.trim();
    const file = imgEl.files && imgEl.files[0];

    if (!title) {
      setFormMessage("Please enter a title.", "error");
      titleEl.focus();
      return;
    }
    if (!description) {
      setFormMessage("Please enter a short description.", "error");
      descEl.focus();
      return;
    }
    if (!pendingPosition) {
      setFormMessage("Pick a location (map click, current location, or set coordinates).", "error");
      return;
    }
    if (!file) {
      setFormMessage("Please choose an image.", "error");
      imgEl.focus();
      return;
    }

    const imageDataUrl = await fileToDataUrl(file);

    const landmark = createLandmark({
      title,
      description,
      imageDataUrl,
      position: pendingPosition,
    });

    landmarks.push(landmark);

    pendingPosition = null;
    clearPendingMarker();

    form.reset();
    if (fileNameEl) fileNameEl.textContent = "No file chosen";

    setFormMessage("Landmark added.", "ok");
    renderLandmarkList();
  });
}

function setFormMessage(text, kind) {
  const el = document.getElementById("form-message");
  if (!el) return;

  el.textContent = text || "";
  el.classList.remove("is-error", "is-ok");

  if (kind === "error") el.classList.add("is-error");
  if (kind === "ok") el.classList.add("is-ok");
}

function setPendingPosition(position) {
  pendingPosition = position;

  if (!pendingMarker) {
    pendingMarker = new google.maps.Marker({
      position,
      map,
      clickable: false,
      title: "Selected location",
    });
  } else {
    pendingMarker.setPosition(position);
    pendingMarker.setMap(map);
  }
}

function clearPendingMarker() {
  if (pendingMarker) pendingMarker.setMap(null);
}

function createLandmark({ title, description, imageDataUrl, position }) {
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

  const marker = new google.maps.Marker({
    position,
    map,
    title: title || "Landmark",
  });

  marker.addListener("click", () => {
    selectedId = id;
    showInfoWindowFor(id);
    renderLandmarkList();
    scrollListItemIntoView(id);
  });

  return {
    id,
    title,
    description,
    imageDataUrl,
    position,
    marker,
    isVisible: true,
  };
}

function showInfoWindowFor(id) {
  const lm = landmarks.find((x) => x.id === id);
  if (!lm) return;

  const safeTitle = escapeHtml(lm.title || "");
  const safeDesc = escapeHtml(lm.description || "");

  const imgHtml = lm.imageDataUrl
    ? `<div style="margin-top:8px;"><img src="${lm.imageDataUrl}" alt="${safeTitle}" style="max-width:220px;max-height:160px;border-radius:8px;display:block;" /></div>`
    : "";

  const content = `
    <div style="max-width:260px;">
      <div style="font-weight:800;">${safeTitle}</div>
      <div style="margin-top:6px;">${safeDesc}</div>
      ${imgHtml}
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.open({ anchor: lm.marker, map });
}

function renderLandmarkList() {
  const ul = document.getElementById("landmark-items");
  ul.innerHTML = "";

  landmarks.forEach((lm) => {
    const li = document.createElement("li");
    li.dataset.id = lm.id;

    const title = document.createElement("div");
    title.textContent = lm.title || "(Untitled)";
    title.style.fontWeight = "800";

    const desc = document.createElement("div");
    desc.textContent = lm.description || "";
    desc.style.marginTop = "6px";

    li.appendChild(title);
    li.appendChild(desc);

    if (lm.imageDataUrl) {
      const img = document.createElement("img");
      img.src = lm.imageDataUrl;
      img.alt = lm.title || "Landmark photo";
      img.style.marginTop = "10px";
      img.style.width = "100%";
      img.style.maxHeight = "160px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "10px";
      li.appendChild(img);
    }

    if (lm.id === selectedId) {
      li.classList.add("is-selected");
    }

    ul.appendChild(li);
  });
}

function scrollListItemIntoView(id) {
  const el = document.querySelector(`#landmark-items li[data-id="${id}"]`);
  if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}