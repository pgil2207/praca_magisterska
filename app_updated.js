require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GeoJSONLayer",
    "esri/layers/MediaLayer",
    "esri/layers/support/ImageElement",
    "esri/layers/support/ExtentAndRotationGeoreference",
    "esri/layers/support/CornersGeoreference",
    "esri/geometry/Extent",
    "esri/geometry/Point",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapToggle",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Legend",
    "esri/widgets/Expand"
], function(
    Map, MapView, GeoJSONLayer, MediaLayer, ImageElement, 
    ExtentAndRotationGeoreference, CornersGeoreference, Extent, Point,
    LayerList, BasemapToggle, BasemapGallery, Legend, Expand
) {

    // Configuration
    const appConfig = {
        mapCenter: [22.568445, 51.246452],
        mapZoom: 13.5,
        basemap: "streets-vector"
    };

    // Color palettes for layers
    const kolorWarstwy = ['#1FB8CD', '#FFC185', '#B4413C', '#ECEBD5', '#5D878F', '#DB4545', '#D2BA4C', '#964325', '#944454', '#13343B'];
    let indeksKoloru = 0;

    // Google Drive API configuration
    const GOOGLE_DRIVE_CONFIG = {
        apiKey: 'YOUR_API_KEY_HERE', // Replace with actual API key
        clientId: 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com', // Replace with actual client ID
        discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        scopes: 'https://www.googleapis.com/auth/drive.readonly'
    };

    // Initialize map
    const mapa = new Map({
        basemap: appConfig.basemap
    });

    // Initialize map view
    const widokMapy = new MapView({
        container: "viewDiv",
        map: mapa,
        center: appConfig.mapCenter,
        zoom: appConfig.mapZoom
    });

    // Initialize widgets when view is ready
    widokMapy.when(function() {
        inicjalizujWidgety();
        console.log('Mapa załadowana pomyślnie');
    });

    /**
     * Initialize ArcGIS widgets
     */
    function inicjalizujWidgety() {
        // LayerList widget
        const listaWarstw = new LayerList({
            view: widokMapy,
            listItemCreatedFunction: function(event) {
                const item = event.item;
                if (item.layer.type !== "group") {
                    item.panel = {
                        content: "legend",
                        open: false
                    };
                }
            }
        });

        const expandListaWarstw = new Expand({
            view: widokMapy,
            content: listaWarstw,
            expandIconClass: "esri-icon-layers",
            expandTooltip: "Lista warstw"
        });

        // BasemapToggle widget
        const przelacznikMapy = new BasemapToggle({
            view: widokMapy,
            nextBasemap: "hybrid"
        });

        // BasemapGallery widget
        const galeriaMap = new BasemapGallery({
            view: widokMapy
        });

        const expandGaleriaMap = new Expand({
            view: widokMapy,
            content: galeriaMap,
            expandIconClass: "esri-icon-basemap",
            expandTooltip: "Galeria map bazowych"
        });

        // Legend widget
        const legenda = new Legend({
            view: widokMapy
        });

        const expandLegenda = new Expand({
            view: widokMapy,
            content: legenda,
            expandIconClass: "esri-icon-legend",
            expandTooltip: "Legenda"
        });

        // Add widgets to view
        widokMapy.ui.add(expandListaWarstw, "top-right");
        widokMapy.ui.add(przelacznikMapy, "bottom-right");
        widokMapy.ui.add(expandGaleriaMap, "top-right");
        widokMapy.ui.add(expandLegenda, "top-right");
    }

    /**
     * Initialize toolbar event handlers
     */
    function inicjalizujObslugeToolbar() {
        console.log('Inicjalizacja obsługi toolbar...');

        // About button
        const przyciskOProgramie = document.getElementById('aboutBtn');
        if (przyciskOProgramie) {
            przyciskOProgramie.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const splashScreen = document.getElementById('splashScreen');
                if (splashScreen) {
                    splashScreen.classList.remove('hidden');
                }
            });
        }

        // MapAnalyst button
        const przyciskMapAnalyst = document.getElementById('mapAnalystBtn');
        if (przyciskMapAnalyst) {
            przyciskMapAnalyst.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                try {
                    window.open('https://mapanalyst.org', '_blank', 'noopener,noreferrer');
                    pokazPowiadomienie('Otwieranie strony MapAnalyst...');
                } catch (error) {
                    console.error('Błąd przy otwieraniu MapAnalyst:', error);
                    pokazPowiadomienie('Wystąpił błąd przy otwieraniu strony MapAnalyst.', 'error');
                }
            });
        }

        // NEW: Georeferencing button - opens Map Warper or internal tool
        const przyciskGeoref = document.getElementById('georefBtn');
        if (przyciskGeoref) {
            przyciskGeoref.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                // Show options: internal tool or Map Warper  
                const options = confirm('Wybierz narzędzie georeferencji:\n\nOK - Map Warper (zewnętrzne)\nAnuluj - Pomoc do wewnętrznego narzędzia');
                if (options) {
                    // Open Map Warper
                    window.open('https://mapwarper.net', '_blank', 'noopener,noreferrer');
                    pokazPowiadomienie('Otwieranie Map Warper - narzędzia do georeferencji');
                } else {
                    // Show help modal
                    const helpModal = document.getElementById('georefHelpModal');
                    if (helpModal) {
                        helpModal.classList.remove('hidden');
                    }
                }
            });
        }

        // NEW: Upload shapefile button
        const przyciskUploadShp = document.getElementById('uploadShpBtn');
        if (przyciskUploadShp) {
            przyciskUploadShp.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleUploadPanel('uploadPanel');
            });
        }

        // NEW: Upload raster button
        const przyciskUploadRaster = document.getElementById('uploadRasterBtn');
        if (przyciskUploadRaster) {
            przyciskUploadRaster.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleUploadPanel('rasterUploadPanel');
            });
        }

        // Handle modal closures
        setupModalHandlers();
    }

    /**
     * Toggle upload panels
     */
    function toggleUploadPanel(panelId) {
        // Hide all panels first
        const panels = ['uploadPanel', 'rasterUploadPanel'];
        panels.forEach(id => {
            const panel = document.getElementById(id);
            if (panel && id !== panelId) {
                panel.classList.add('hidden');
            }
        });

        // Toggle the requested panel
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.toggle('hidden');
        }
    }

    /**
     * Setup modal event handlers
     */
    function setupModalHandlers() {
        // Splash screen handlers
        const splashScreen = document.getElementById('splashScreen');
        const closeSplash = document.getElementById('closeSplash');
        const closeSplashBtn = document.getElementById('closeSplashBtn');

        function closeSplashScreen() {
            if (splashScreen) {
                splashScreen.classList.add('hidden');
            }
        }

        if (closeSplash) closeSplash.addEventListener('click', closeSplashScreen);
        if (closeSplashBtn) closeSplashBtn.addEventListener('click', closeSplashScreen);
        if (splashScreen) {
            splashScreen.addEventListener('click', function(event) {
                if (event.target === splashScreen) {
                    closeSplashScreen();
                }
            });
        }

        // Georef help modal handlers
        const georefHelpModal = document.getElementById('georefHelpModal');
        const closeGeorefHelp = document.getElementById('closeGeorefHelp');
        const closeGeorefHelpBtn = document.getElementById('closeGeorefHelpBtn');

        function closeGeorefHelpModal() {
            if (georefHelpModal) {
                georefHelpModal.classList.add('hidden');
            }
        }

        if (closeGeorefHelp) closeGeorefHelp.addEventListener('click', closeGeorefHelpModal);
        if (closeGeorefHelpBtn) closeGeorefHelpBtn.addEventListener('click', closeGeorefHelpModal);
        if (georefHelpModal) {
            georefHelpModal.addEventListener('click', function(event) {
                if (event.target === georefHelpModal) {
                    closeGeorefHelpModal();
                }
            });
        }

        // Escape key handler
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                closeSplashScreen();
                closeGeorefHelpModal();
            }
        });
    }

    /**
     * Initialize shapefile upload handling
     */
    function inicjalizujObslugePlikow() {
        console.log('Inicjalizacja obsługi plików shapefile...');

        const inputPlik = document.getElementById('fileInput');
        const etykietaPlik = document.querySelector('.file-label');
        const nazwaPliku = document.getElementById('fileName');
        const przyciskDodaj = document.getElementById('addLayerBtn');

        if (!inputPlik || !etykietaPlik || !nazwaPliku || !przyciskDodaj) {
            console.error('Nie znaleziono elementów do obsługi plików shapefile');
            return;
        }

        // File selection
        etykietaPlik.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            inputPlik.click();
        });

        // File change handler
        inputPlik.addEventListener('change', function(event) {
            const plik = event.target.files[0];
            if (plik) {
                if (!plik.name.toLowerCase().endsWith('.zip')) {
                    pokazPowiadomienie('Wybierz plik ZIP zawierający shapefile.', 'error');
                    nazwaPliku.textContent = '';
                    przyciskDodaj.disabled = true;
                    przyciskDodaj.classList.remove('btn--primary');
                    przyciskDodaj.classList.add('btn--secondary');
                    return;
                }

                nazwaPliku.textContent = `Wybrany plik: ${plik.name}`;
                przyciskDodaj.disabled = false;
                przyciskDodaj.classList.remove('btn--secondary');
                przyciskDodaj.classList.add('btn--primary');
            } else {
                nazwaPliku.textContent = '';
                przyciskDodaj.disabled = true;
                przyciskDodaj.classList.remove('btn--primary');
                przyciskDodaj.classList.add('btn--secondary');
            }
        });

        // Add layer handler
        przyciskDodaj.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const plik = inputPlik.files[0];
            if (plik) {
                try {
                    await dodajWarstweZShapefile(plik);
                    // Reset form
                    inputPlik.value = '';
                    nazwaPliku.textContent = '';
                    przyciskDodaj.disabled = true;
                    przyciskDodaj.classList.remove('btn--primary');
                    przyciskDodaj.classList.add('btn--secondary');
                } catch (error) {
                    console.error('Błąd przy dodawaniu warstwy:', error);
                    pokazPowiadomienie(`Błąd parsowania pliku: ${error.message}`, 'error');
                }
            }
        });
    }

    /**
     * NEW: Initialize raster file upload handling
     */
    function inicjalizujObslugeRasterow() {
        console.log('Inicjalizacja obsługi plików rastrowych...');

        const inputRaster = document.getElementById('rasterFileInput');
        const etykietaRaster = document.querySelector('#rasterUploadPanel .file-label');
        const nazwaRaster = document.getElementById('rasterFileName');
        const przyciskDodajRaster = document.getElementById('addRasterLayerBtn');
        const kontroleGeoref = document.getElementById('georefControls');
        const przyciskGoogleDrive = document.getElementById('googleDriveBtn');
        const przyciskAutoDetect = document.getElementById('autoDetectBtn');

        if (!inputRaster || !etykietaRaster || !nazwaRaster || !przyciskDodajRaster) {
            console.error('Nie znaleziono elementów do obsługi plików rastrowych');
            return;
        }

        // File selection
        etykietaRaster.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            inputRaster.click();
        });

        // File change handler
        inputRaster.addEventListener('change', function(event) {
            const plik = event.target.files[0];
            if (plik) {
                const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/tif'];
                if (!supportedTypes.includes(plik.type) && !plik.name.toLowerCase().match(/\.(jpg|jpeg|png|tiff|tif|geotiff)$/)) {
                    pokazPowiadomienie('Wybierz plik obrazu (JPG, PNG, TIFF).', 'error');
                    nazwaRaster.textContent = '';
                    kontroleGeoref.classList.add('hidden');
                    przyciskDodajRaster.disabled = true;
                    return;
                }

                nazwaRaster.textContent = `Wybrany plik: ${plik.name}`;
                kontroleGeoref.classList.remove('hidden');
                przyciskDodajRaster.disabled = false;
                przyciskDodajRaster.classList.remove('btn--secondary');
                przyciskDodajRaster.classList.add('btn--primary');

                // Try to auto-detect EXIF coordinates
                tryAutoDetectCoordinates(plik);
            } else {
                nazwaRaster.textContent = '';
                kontroleGeoref.classList.add('hidden');
                przyciskDodajRaster.disabled = true;
            }
        });

        // Google Drive integration
        if (przyciskGoogleDrive) {
            przyciskGoogleDrive.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                inicjalizujGoogleDrive();
            });
        }

        // Auto-detect coordinates
        if (przyciskAutoDetect) {
            przyciskAutoDetect.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const plik = inputRaster.files[0];
                if (plik) {
                    tryAutoDetectCoordinates(plik);
                } else {
                    pokazPowiadomienie('Najpierw wybierz plik obrazu.', 'warning');
                }
            });
        }

        // Add raster layer handler
        przyciskDodajRaster.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            const plik = inputRaster.files[0];
            if (plik) {
                try {
                    await dodajWarstweRastrowa(plik);
                    // Reset form
                    inputRaster.value = '';
                    nazwaRaster.textContent = '';
                    kontroleGeoref.classList.add('hidden');
                    przyciskDodajRaster.disabled = true;
                    przyciskDodajRaster.classList.remove('btn--primary');
                    przyciskDodajRaster.classList.add('btn--secondary');
                    clearCoordinateInputs();
                } catch (error) {
                    console.error('Błąd przy dodawaniu warstwy rastrowej:', error);
                    pokazPowiadomienie(`Błąd dodawania warstwy: ${error.message}`, 'error');
                }
            }
        });
    }

    /**
     * NEW: Add raster layer to map using MediaLayer
     */
    async function dodajWarstweRastrowa(plik) {
        const progressContainer = document.getElementById('rasterProgressContainer');
        const progressFill = document.getElementById('rasterProgressFill');
        const progressText = document.getElementById('rasterProgressText');

        try {
            // Show progress
            progressContainer.classList.remove('hidden');
            progressFill.style.width = '20%';
            progressText.textContent = 'Ładowanie obrazu...';

            // Get coordinates from form
            const coordinates = getCoordinatesFromForm();
            if (!coordinates) {
                throw new Error('Wprowadź współrzędne georeferencji');
            }

            progressFill.style.width = '50%';
            progressText.textContent = 'Tworzenie warstwy...';

            // Create image URL
            const imageUrl = URL.createObjectURL(plik);

            // Create corners georeference
            const georeference = new CornersGeoreference({
                bottomLeft: new Point({
                    x: coordinates.sw.lng,
                    y: coordinates.sw.lat,
                    spatialReference: { wkid: 4326 }
                }),
                bottomRight: new Point({
                    x: coordinates.se.lng,
                    y: coordinates.se.lat,
                    spatialReference: { wkid: 4326 }
                }),
                topLeft: new Point({
                    x: coordinates.nw.lng,
                    y: coordinates.nw.lat,
                    spatialReference: { wkid: 4326 }
                }),
                topRight: new Point({
                    x: coordinates.ne.lng,
                    y: coordinates.ne.lat,
                    spatialReference: { wkid: 4326 }
                })
            });

            // Create image element
            const imageElement = new ImageElement({
                image: imageUrl,
                georeference: georeference
            });

            // Create media layer
            const mediaLayer = new MediaLayer({
                source: [imageElement],
                title: `🖼️ ${plik.name}`,
                opacity: 0.8
            });

            // Add to map
            mapa.add(mediaLayer);

            progressFill.style.width = '80%';
            progressText.textContent = 'Dodawanie do mapy...';

            // Wait for layer to load and zoom to extent
            await mediaLayer.when();

            // Calculate extent from coordinates
            const extent = new Extent({
                xmin: Math.min(coordinates.nw.lng, coordinates.sw.lng),
                ymin: Math.min(coordinates.sw.lat, coordinates.se.lat),
                xmax: Math.max(coordinates.ne.lng, coordinates.se.lng),
                ymax: Math.max(coordinates.nw.lat, coordinates.ne.lat),
                spatialReference: { wkid: 4326 }
            });

            await widokMapy.goTo(extent.expand(1.2), { duration: 1500 });

            progressFill.style.width = '100%';
            progressText.textContent = 'Gotowe!';

            pokazPowiadomienie(`Pomyślnie dodano warstwę rastrową "${plik.name}".`, 'success');

            // Clean up after delay
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                progressFill.style.width = '0%';
                URL.revokeObjectURL(imageUrl);
            }, 1000);

        } catch (error) {
            progressContainer.classList.add('hidden');
            progressFill.style.width = '0%';
            throw error;
        }
    }

    /**
     * Get coordinates from form inputs
     */
    function getCoordinatesFromForm() {
        const nwLng = parseFloat(document.getElementById('nwLng').value);
        const nwLat = parseFloat(document.getElementById('nwLat').value);
        const neLng = parseFloat(document.getElementById('neLng').value);
        const neLat = parseFloat(document.getElementById('neLat').value);
        const swLng = parseFloat(document.getElementById('swLng').value);
        const swLat = parseFloat(document.getElementById('swLat').value);
        const seLng = parseFloat(document.getElementById('seLng').value);
        const seLat = parseFloat(document.getElementById('seLat').value);

        // Validate coordinates
        const coords = [nwLng, nwLat, neLng, neLat, swLng, swLat, seLng, seLat];
        if (coords.some(coord => isNaN(coord))) {
            return null;
        }

        return {
            nw: { lng: nwLng, lat: nwLat },
            ne: { lng: neLng, lat: neLat },
            sw: { lng: swLng, lat: swLat },
            se: { lng: seLng, lat: seLat }
        };
    }

    /**
     * Clear coordinate input fields
     */
    function clearCoordinateInputs() {
        const inputs = ['nwLng', 'nwLat', 'neLng', 'neLat', 'swLng', 'swLat', 'seLng', 'seLat'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.value = '';
        });
    }

    /**
     * NEW: Try to auto-detect coordinates from EXIF data
     */
    function tryAutoDetectCoordinates(plik) {
        // Note: EXIF coordinate detection would require additional library
        // This is a placeholder for the functionality
        pokazPowiadomienie('Funkcja automatycznego wykrywania współrzędnych z EXIF będzie dostępna w przyszłych wersjach.', 'info');

        // For demonstration, set some example coordinates
        if (confirm('Czy chcesz użyć przykładowych współrzędnych dla testu?')) {
            document.getElementById('nwLng').value = '22.5';
            document.getElementById('nwLat').value = '51.3';
            document.getElementById('neLng').value = '22.6';
            document.getElementById('neLat').value = '51.3';
            document.getElementById('swLng').value = '22.5';
            document.getElementById('swLat').value = '51.2';
            document.getElementById('seLng').value = '22.6';
            document.getElementById('seLat').value = '51.2';

            pokazPowiadomienie('Ustawiono przykładowe współrzędne. Dostosuj je według potrzeb.', 'success');
        }
    }

    /**
     * NEW: Initialize Google Drive integration
     */
    async function inicjalizujGoogleDrive() {
        try {
            // Check if Google API is loaded
            if (typeof gapi === 'undefined') {
                // Load Google API
                await loadGoogleAPI();
            }

            // Initialize and authenticate
            await gapi.load('client:auth2', async () => {
                await gapi.client.init({
                    apiKey: GOOGLE_DRIVE_CONFIG.apiKey,
                    clientId: GOOGLE_DRIVE_CONFIG.clientId,
                    discoveryDocs: [GOOGLE_DRIVE_CONFIG.discoveryDoc],
                    scope: GOOGLE_DRIVE_CONFIG.scopes
                });

                // Sign in
                const authInstance = gapi.auth2.getAuthInstance();
                if (!authInstance.isSignedIn.get()) {
                    await authInstance.signIn();
                }

                // List image files
                await listGoogleDriveImages();
            });

        } catch (error) {
            console.error('Błąd Google Drive:', error);
            pokazPowiadomienie('Błąd połączenia z Google Drive. Sprawdź konfigurację API.', 'error');
        }
    }

    /**
     * Load Google API dynamically
     */
    function loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (typeof gapi !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * List images from Google Drive
     */
    async function listGoogleDriveImages() {
        try {
            const response = await gapi.client.drive.files.list({
                pageSize: 20,
                fields: 'files(id, name, mimeType, thumbnailLink)',
                q: "mimeType contains 'image/'"
            });

            const files = response.result.files;
            if (files && files.length > 0) {
                showGoogleDriveFilePicker(files);
            } else {
                pokazPowiadomienie('Nie znaleziono plików obrazów w Google Drive.', 'info');
            }
        } catch (error) {
            console.error('Błąd pobierania plików:', error);
            pokazPowiadomienie('Błąd pobierania plików z Google Drive.', 'error');
        }
    }

    /**
     * Show Google Drive file picker modal
     */
    function showGoogleDriveFilePicker(files) {
        // Create a simple file picker modal
        // This is a simplified version - in production you might want to use Google Picker API
        const fileList = files.map(file => 
            `<div class="drive-file-item" data-file-id="${file.id}" data-file-name="${file.name}">
                ${file.thumbnailLink ? `<img src="${file.thumbnailLink}" alt="${file.name}">` : '📷'}
                <span>${file.name}</span>
            </div>`
        ).join('');

        const modalHtml = `
            <div class="modal" id="drivePickerModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>📚 Wybierz plik z Google Drive</h2>
                        <button class="close-btn" onclick="closeDrivePickerModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="drive-file-list">${fileList}</div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add click handlers for files
        document.querySelectorAll('.drive-file-item').forEach(item => {
            item.addEventListener('click', () => {
                const fileId = item.dataset.fileId;
                const fileName = item.dataset.fileName;
                downloadFromGoogleDrive(fileId, fileName);
                closeDrivePickerModal();
            });
        });
    }

    /**
     * Download file from Google Drive
     */
    async function downloadFromGoogleDrive(fileId, fileName) {
        try {
            pokazPowiadomienie('Pobieranie pliku z Google Drive...', 'info');

            const response = await gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });

            // Convert response to blob and create file object
            const blob = new Blob([response.body], { type: 'image/jpeg' });
            const file = new File([blob], fileName, { type: blob.type });

            // Simulate file selection
            const event = { target: { files: [file] } };
            const inputRaster = document.getElementById('rasterFileInput');

            // Trigger the file change handler
            const changeEvent = new Event('change');
            Object.defineProperty(changeEvent, 'target', { value: { files: [file] } });
            inputRaster.dispatchEvent(changeEvent);

            pokazPowiadomienie(`Pobrano plik: ${fileName}`, 'success');

        } catch (error) {
            console.error('Błąd pobierania pliku:', error);
            pokazPowiadomienie('Błąd pobierania pliku z Google Drive.', 'error');
        }
    }

    /**
     * Close Google Drive picker modal
     */
    window.closeDrivePickerModal = function() {
        const modal = document.getElementById('drivePickerModal');
        if (modal) {
            modal.remove();
        }
    };

    // ... (Keep all existing shapefile functions: dodajWarstweZShapefile, parseShapefile, etc.)
    // ... (Keep all existing helper functions: pokazPowiadomienie, etc.)

    /**
     * Parse shapefile using shpjs
     */
    async function dodajWarstweZShapefile(plik) {
        const progressContainer = document.getElementById('progressContainer');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        try {
            progressContainer.classList.remove('hidden');
            progressFill.style.width = '20%';
            progressText.textContent = 'Parsowanie pliku...';

            const geojson = await parseShapefile(plik);
            progressFill.style.width = '60%';
            progressText.textContent = 'Tworzenie warstwy...';

            await dodajGeoJSONDoMapy(geojson, plik.name);
            progressFill.style.width = '100%';
            progressText.textContent = 'Gotowe!';

            setTimeout(() => {
                progressContainer.classList.add('hidden');
                progressFill.style.width = '0%';
            }, 1000);

        } catch (error) {
            console.error('Błąd parsowania shapefile:', error);
            progressContainer.classList.add('hidden');
            progressFill.style.width = '0%';
            throw error;
        }
    }

    async function parseShapefile(plik) {
        try {
            const arrayBuffer = await plik.arrayBuffer();

            if (typeof shp === 'undefined') {
                throw new Error('Biblioteka shp nie została załadowana');
            }

            const geojson = await shp(arrayBuffer);

            if (!geojson || (!geojson.features && !Array.isArray(geojson))) {
                throw new Error('Nieprawidłowy format danych w pliku shapefile');
            }

            if (Array.isArray(geojson)) {
                return {
                    type: "FeatureCollection",
                    features: geojson.flatMap(layer => 
                        layer.features || (layer.type === 'Feature' ? [layer] : [])
                    )
                };
            }

            return geojson;

        } catch (error) {
            console.error('Błąd parsowania shapefile:', error);
            throw new Error(`Błąd parsowania shapefile: ${error.message}`);
        }
    }

    async function dodajGeoJSONDoMapy(geojson, nazwaPliku) {
        try {
            const features = geojson.features || [];
            if (features.length === 0) {
                throw new Error('Plik nie zawiera żadnych obiektów geograficznych');
            }

            const geometryType = okreslTypGeometrii(features);
            const renderer = stworzRenderer(geometryType);

            const blob = new Blob([JSON.stringify(geojson)], {
                type: "application/json"
            });
            const url = URL.createObjectURL(blob);

            const popupTemplate = stworzPopupTemplate(features[0]);

            const warstwa = new GeoJSONLayer({
                url: url,
                title: `📁 ${nazwaPliku} (${features.length} obiektów)`,
                renderer: renderer,
                popupTemplate: popupTemplate,
                outFields: ["*"]
            });

            mapa.add(warstwa);
            await warstwa.when();

            try {
                const extent = await warstwa.queryExtent();
                if (extent.extent) {
                    await widokMapy.goTo(extent.extent.expand(1.2), {
                        duration: 1500
                    });
                }
            } catch (extentError) {
                console.warn('Nie można zoomować do extent warstwy:', extentError);
            }

            pokazPowiadomienie(`Pomyślnie dodano warstwę "${nazwaPliku}" z ${features.length} obiektami.`, 'success');
            indeksKoloru = (indeksKoloru + 1) % kolorWarstwy.length;

            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);

        } catch (error) {
            console.error('Błąd dodawania GeoJSON do mapy:', error);
            throw error;
        }
    }

    function okreslTypGeometrii(features) {
        const typy = {};
        features.forEach(feature => {
            if (feature.geometry && feature.geometry.type) {
                const typ = feature.geometry.type;
                typy[typ] = (typy[typ] || 0) + 1;
            }
        });

        const najczestszy = Object.keys(typy).reduce((a, b) => typy[a] > typy[b] ? a : b);
        return najczestszy;
    }

    function stworzRenderer(typGeometrii) {
        const kolor = kolorWarstwy[indeksKoloru];

        switch (typGeometrii) {
            case 'Point':
            case 'MultiPoint':
                return {
                    type: "simple",
                    symbol: {
                        type: "simple-marker",
                        color: kolor,
                        size: 8,
                        outline: {
                            color: [255, 255, 255],
                            width: 1
                        }
                    }
                };
            case 'LineString':
            case 'MultiLineString':
                return {
                    type: "simple",
                    symbol: {
                        type: "simple-line",
                        color: kolor,
                        width: 2
                    }
                };
            case 'Polygon':
            case 'MultiPolygon':
                return {
                    type: "simple",
                    symbol: {
                        type: "simple-fill",
                        color: kolor + '4D',
                        outline: {
                            color: kolor,
                            width: 1
                        }
                    }
                };
            default:
                return {
                    type: "simple",
                    symbol: {
                        type: "simple-marker",
                        color: kolor,
                        size: 6
                    }
                };
        }
    }

    function stworzPopupTemplate(feature) {
        if (!feature || !feature.properties) {
            return {
                title: "Obiekt",
                content: "Brak dodatkowych informacji"
            };
        }

        const atrybuty = Object.keys(feature.properties);
        const content = atrybuty.map(attr => {
            return `<b>${attr}:</b> {${attr}}<br>`;
        }).join('');

        return {
            title: "Obiekt z shapefile",
            content: content || "Brak atrybutów",
            fieldInfos: atrybuty.map(attr => ({
                fieldName: attr,
                visible: true
            }))
        };
    }

    /**
     * Show notification to user
     */
    function pokazPowiadomienie(wiadomosc, typ = 'info') {
        const istniejace = document.querySelectorAll('.notification');
        istniejace.forEach(function(el) {
            el.remove();
        });

        const powiadomienie = document.createElement('div');
        powiadomienie.className = `notification ${typ}`;
        powiadomienie.textContent = wiadomosc;
        document.body.appendChild(powiadomienie);

        setTimeout(function() {
            if (powiadomienie.parentNode) {
                powiadomienie.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(function() {
                    if (powiadomienie.parentNode) {
                        powiadomienie.remove();
                    }
                }, 300);
            }
        }, 5000);

        powiadomienie.addEventListener('click', function() {
            powiadomienie.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(function() {
                if (powiadomienie.parentNode) {
                    powiadomienie.remove();
                }
            }, 300);
        });
    }

    // Initialize application
    console.log('GIS Aplikacja z rasterami i georeferencją została zainicjalizowana.');

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            inicjalizujObslugeToolbar();
            inicjalizujObslugePlikow();
            inicjalizujObslugeRasterow();
        });
    } else {
        inicjalizujObslugeToolbar();
        inicjalizujObslugePlikow();
        inicjalizujObslugeRasterow();
    }
});