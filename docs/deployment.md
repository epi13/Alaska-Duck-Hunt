# Deployment

The production output is static and supports subpath hosting. Asset and service-worker URLs must derive from the configured Vite base path.

## GitHub Pages

The Pages workflow installs with the lockfile, runs the full validation gate, builds with the repository base path, uploads the output artifact, and deploys only from the protected release branch. Pull requests run validation without deployment. No secrets beyond GitHub's generated Pages token are required.

## Generic static hosting

Upload the complete build directory with `index.html`, manifest, icons, assets, and service worker intact. Serve JavaScript and manifest files with correct MIME types and use HTTPS for installation, service workers, fullscreen consistency, and future controller APIs. Configure an SPA fallback to `index.html` if history-based routes are introduced.

## Local and LAN

Use the development server for authoring and the production preview for build verification. LAN testing binds to an explicit local interface and should be treated as untrusted network exposure. PWA installation and Web Bluetooth generally require HTTPS; localhost is the standard development exception.

Service-worker updates use a versioned cache and prompt the player before reload when a hunt is active. Offline verification starts once online to populate the cache, closes the server/network route, then reloads the installed scope and starts a hunt using cached assets.

