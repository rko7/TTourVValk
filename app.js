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

  // Clear message when user edits inputs
  const titleEl = document.getElementById("title");
  const descEl = document.getElementById("description");

  function clearMsgOnInput() {
    setFormMessage("", null);
  }

  if (titleEl) titleEl.addEventListener("input", clearMsgOnInput);
  if (descEl) descEl.addEventListener("input", clearMsgOnInput);

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

  // Clear message when image changes
  if (imgEl) imgEl.addEventListener("change", clearMsgOnInput);

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

    // Auto-clear success message after a short delay
    setTimeout(() => setFormMessage("", null), 2000);

    renderLandmarkList();
  });
}

function setFormMessage(text, kind) {
  const el = document.getElementById("form-message");
  if (!el) return;

  el.textContent = text || "";
  el.classList.remove("is-error", "is-ok");

  // Apply state class only when needed
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

/* Delete a landmark (and its marker) by id */
function deleteLandmarkById(id) {
  const idx = landmarks.findIndex((x) => x.id === id);
  if (idx === -1) return;
  const lm = landmarks[idx];

  // Remove marker from map
  if (lm.marker) lm.marker.setMap(null);

  // If the infoWindow is currently anchored to this marker, close it (safe even if not open)
  if (infoWindow) infoWindow.close();

  // Remove from array
  landmarks.splice(idx, 1);

  // Clear selection if we deleted the selected one
  if (selectedId === id) selectedId = null;
  renderLandmarkList();
}

/* Toggle marker visibility without deleting data */
function toggleLandmarkVisibility(id) {
  const lm = landmarks.find((x) => x.id === id);
  if (!lm) return;
  lm.isVisible = !lm.isVisible;

  // Show/hide marker on the map
  if (lm.marker) lm.marker.setMap(lm.isVisible ? map : null);

  // If we hide the selected landmark, clear selection and close InfoWindow
  if (!lm.isVisible && selectedId === id) {
    selectedId = null;
    if (infoWindow) infoWindow.close();
  }

  renderLandmarkList();
}

function createLandmark({ title, description, imageDataUrl, position }) {
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

  const marker = new google.maps.Marker({
    position,
    map,
    title: title || "Landmark",
  });

  marker.addListener("click", () => {
    const lm = landmarks.find((x) => x.id === id);
    if (lm && !lm.isVisible) return; // Skip when hidden

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

  // Add a delete button inside InfoWindow
  const content = `
    <div style="max-width:260px;">
      <div style="font-weight:800;">${safeTitle}</div>
      <div style="margin-top:6px;">${safeDesc}</div>
      ${imgHtml}
      <div style="margin-top:10px;">
        <button type="button" data-action="delete" data-id="${lm.id}"
          style="border:2px solid #122a57; box-shadow:0 4px 0 #122a57; border-radius:10px; background:#fff; padding:8px 12px; font-weight:800; color:#122a57; cursor:pointer;">
          Delete
        </button>
      </div>
    </div>
  `;

  infoWindow.setContent(content);
  infoWindow.open({ anchor: lm.marker, map });

  // Wire delete button after the InfoWindow DOM is ready
  google.maps.event.addListenerOnce(infoWindow, "domready", () => {
    const btn = document.querySelector('button[data-action="delete"][data-id="' + lm.id + '"]');
    if (!btn) return;

    btn.addEventListener("click", () => {
      const ok = confirm("Delete this landmark?");
      if (!ok) return;
      deleteLandmarkById(lm.id);
    });
  });
}

function renderLandmarkList() {
  const ul = document.getElementById("landmark-items");
  ul.innerHTML = "";

  landmarks.forEach((lm) => {
    const li = document.createElement("li");
    li.dataset.id = lm.id;

    // Visual state for hidden items
    if (!lm.isVisible) li.classList.add("is-hidden");

    // Click list item -> select + open InfoWindow (only if visible)
    li.addEventListener("click", () => {
      if (!lm.isVisible) return; // Do nothing when hidden

        selectedId = lm.id;
        showInfoWindowFor(lm.id);
        renderLandmarkList();
        scrollListItemIntoView(lm.id);
      });

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

    // Actions row: Hide/Show + Delete
    const actions = document.createElement("div");
    actions.style.marginTop = "10px";
    actions.style.display = "flex";
    actions.style.justifyContent = "flex-end";
    actions.style.gap = "8px";

    // Hide/Show button
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.textContent = lm.isVisible ? "Hide" : "Show";
    toggleBtn.classList.add("btn-primary");

    // Prevent list click from firing
    toggleBtn.addEventListener("click", (e) => {    
      e.stopPropagation();    
      toggleLandmarkVisibility(lm.id);
    });

    // Delete button
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.classList.add("btn-primary");

    // Prevent list click from firing when deleting
    delBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ok = confirm("Delete this landmark?");
      if (!ok) return;
      deleteLandmarkById(lm.id);
    });

    actions.appendChild(toggleBtn);
    actions.appendChild(delBtn);
    li.appendChild(actions);

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