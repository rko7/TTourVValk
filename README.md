# TTour-VValk

TTourVValk is a front-end walking tour web application that lets users create their own walking routes by adding meaningful landmarks to a map.

Instead of rushing from place to place, this app focuses on slow exploration — noticing small details, personal memories, and places that matter to you.

## Why “TTour-VValk”?

The name comes from the Korean word **뚜벅뚜벅 (ttu-beok ttu-beok)**, which describes the sound and feeling of walking steadily on foot.

In Korean, *뚜벅뚜벅* is often used to represent walking slowly without a vehicle, step by step, taking your time.  
It reflects the idea of moving at your own pace, paying attention to your surroundings, and building your own path rather than following the fastest route.

TTourVValk combines that feeling with the idea of a walking tour — a personal journey shaped by where you choose to stop.

## What You Can Do

### Create Landmarks
- Add landmarks with a **title**, **short description**, and **image upload**
- Assign a landmark location by:
  - Clicking directly on the map
  - Using your **current location** (browser Geolocation)
  - Entering **latitude/longitude manually** (Set Coordinates)

### Explore and Manage Landmarks
- See all landmarks as **markers on the map**
- Click a marker to view details in a Google Maps **InfoWindow**
- View landmarks in the **sidebar list** and click an item to open its InfoWindow
- **Hide/Show** landmarks without deleting them (marker is removed/added back on the map)
- **Delete** landmarks (from list and from the map)
- Confirmation prompt appears before deleting

### UI / UX Improvements
- Inline validation messages (success/error) with clear feedback
- Selected landmark is visually highlighted in the list
- File upload displays the selected file name
- Responsive layout for smaller screens (map stays visible)

## Tech Stack
- HTML / CSS / JavaScript
- Google Maps JavaScript API

## Run Locally (No Backend)

This project is front-end only (no backend, no database).

- Open `index.html` in your browser.
- Google Maps API key is required to run this project. Please insert your own key.

### Notes
- Landmarks are stored in memory only while the page is open (no LocalStorage).
- Refreshing the page resets landmarks.
- Geolocation requires browser permission.

### Project Requirements Coverage (Quick Checklist)
- Google Map loads and is interactive
- Add landmark with title + description + image
- Landmark location set via map click / current location / manual coordinates
- Markers display on map and show InfoWindow details
- Landmark list updates dynamically and stays in sync with markers
- Delete and Hide/Show supported with UI controls
- Responsive layout supported
