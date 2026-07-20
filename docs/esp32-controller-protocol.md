# ESP32 Controller Protocol Proposal

This is a forward-looking protocol; the shipped game does not require or claim compatibility with physical hardware. Web Bluetooth and Web Serial require secure contexts and explicit user gestures.

## BLE service

Proposed custom service UUID: `a1a50000-4c41-534b-4144-55434b48554e`. Characteristics use the same base with terminal words `0001` (device information, read), `0002` (event stream, notify), `0003` (commands, write), and `0004` (calibration, read/write/notify). UUIDs remain provisional until firmware is released.

Packets begin with protocol version `u8`, message type `u8`, sequence `u16 LE`, and controller timestamp `u32 LE` milliseconds. Event payloads are:

| Type | Payload |
|---|---|
| `0x01` trigger | state `u8` (released/pressed) |
| `0x02` reload | action `u8` |
| `0x03` aim | x `u16`, y `u16` normalized 0..65535 |
| `0x04` gyro | x/y/z signed `i16`, centidegrees/second |
| `0x05` accelerometer | x/y/z signed `i16`, milligravity |
| `0x06` calibration | state `u8`, result `u8` |
| `0x07` battery | percent `u8` |
| `0x08` heartbeat | echoed host sequence `u16` |

Device information is UTF-8 JSON bounded to 256 bytes with protocol version, firmware version, controller identifier, capabilities, and optional hardware revision. Commands cover start/cancel calibration, request status, set report rate, haptic pulse, and clock synchronization.

## Reliability and privacy

Sequence gaps are observable but aim packets need not be retransmitted; control commands receive acknowledgments. The browser estimates latency from clock-sync and heartbeat samples. Disconnect releases the trigger and stops motion immediately. Pairing is user initiated, identifiers remain local, no telemetry is uploaded, and malformed or out-of-range packets are discarded.

Web Serial uses COBS-framed packets with a CRC-16 and the same binary message body. Simulated-controller fixtures must cover rollover, packet loss, disconnect-during-trigger, invalid calibration, and high latency.

