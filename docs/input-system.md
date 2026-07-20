# Input System

Scenes consume actions, never raw device events. Providers emit timestamped normalized events for aim, fire, reload, pause, confirm, back, focus traversal, fullscreen, and mute. A router resolves conflicts, applies remapping and sensitivity, and records the last active device for prompts.

Default bindings are mouse aim/left-click fire, WASD or arrows aim, Space fire, R reload, Escape pause, Enter confirm, F fullscreen, M mute, and Tab focus traversal. Touch offers drag-to-aim plus a separated fire/reload control to reduce accidental shots. Gamepads use left/right stick aim options, trigger fire, face-button reload, and menu navigation.

Aim coordinates normalize to `[0,1]` and are converted into the safe gameplay viewport after letterboxing. Providers attach monotonic timestamps for latency measurement. Remapping prevents trapping the user by always retaining an accessible menu escape and supports restoring defaults.

The simulated Zapper provider exercises calibration, connection, battery, identity, aim, trigger, reload, inertial, and latency events without hardware. BLE and Web Serial adapters remain optional progressive enhancements; unsupported browsers retain all core gameplay.

