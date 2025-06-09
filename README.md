# Implementing Low-Level Protocols with TypeScript

This README explores how to approach "low-level protocols" within the context of TypeScript, a high-level language. While TypeScript abstracts away many hardware specifics, it provides powerful tools for **binary data manipulation** and interacting with specialized **Web APIs** that offer more granular control over data streams and device communication.

---

## What are "Low-Level Protocols" in TypeScript?

When discussing low-level protocols in TypeScript, we're typically referring to one of these areas:

1.  **Binary Data Manipulation**: Working directly with raw bytes, `ArrayBuffer`s, and `DataView`s to implement custom serialization/deserialization for specific data formats or network packets.
2.  **Interfacing with Web APIs for Direct Access**: Utilizing browser APIs like **Web Sockets**, **WebRTC**, **WebUSB**, or **Web Bluetooth** to gain closer control over network communication or hardware interactions.
3.  **Implementing Simple Communication Layers**: Creating custom, often text-based, protocols built on top of existing transport mechanisms (like Web Sockets), where you define the message structure and state management.

---

## Example: A Simple Binary Messaging Protocol

Let's dive into an example demonstrating **binary data manipulation** by implementing a basic, custom binary protocol. This protocol defines a simple message structure and includes functions to **serialize** it into an `ArrayBuffer` and **deserialize** it back into a usable object.

### Protocol Definition

Our custom message will consist of:

* **`commandCode`**: A 1-byte unsigned integer (e.g., `0x01` for "SEND\_MESSAGE").
* **`payloadLength`**: A 4-byte unsigned 32-bit integer, indicating the byte length of the payload.
* **`payload`**: A variable-length string, UTF-8 encoded.

### Code Implementation

```typescript
// 1. Protocol Definition (Conceptual)
//    - Command Code: 1 byte (e.g., 0x01 for "SEND_MESSAGE", 0x02 for "ACK")
//    - Payload Length: 4 bytes (Uint32, length of the payload in bytes)
//    - Payload: Variable length (UTF-8 encoded string)

// 2. Data Structures for our Message
enum CommandCode {
    SendMessage = 0x01,
    Acknowledge = 0x02,
    Error = 0xFF,
}

interface ProtocolMessage {
    commandCode: CommandCode;
    payload: string;
}

// 3. Serialization Function (Writing to a Buffer)
function serializeMessage(message: ProtocolMessage): ArrayBuffer {
    const textEncoder = new TextEncoder();
    const payloadBytes = textEncoder.encode(message.payload);
    const payloadLength = payloadBytes.byteLength;

    // Calculate total buffer size: 1 byte for commandCode + 4 bytes for payloadLength + payloadBytes.length
    const bufferSize = 1 + 4 + payloadLength;
    const buffer = new ArrayBuffer(bufferSize);
    const dataView = new DataView(buffer);

    // Write commandCode (1 byte at offset 0)
    dataView.setUint8(0, message.commandCode);

    // Write payloadLength (4 bytes at offset 1)
    dataView.setUint32(1, payloadLength, false); // false for big-endian, true for little-endian

    // Write payload (variable bytes starting at offset 5)
    for (let i = 0; i < payloadBytes.length; i++) {
        dataView.setUint8(5 + i, payloadBytes[i]);
    }

    return buffer;
}

// 4. Deserialization Function (Reading from a Buffer)
function deserializeMessage(buffer: ArrayBuffer): ProtocolMessage {
    const dataView = new DataView(buffer);
    const textDecoder = new TextDecoder('utf-8');

    // Read commandCode (1 byte from offset 0)
    const commandCode: CommandCode = dataView.getUint8(0);

    // Read payloadLength (4 bytes from offset 1)
    const payloadLength = dataView.getUint32(1, false); // false for big-endian

    // Read payload (variable bytes from offset 5 to 5 + payloadLength)
    const payloadBuffer = new Uint8Array(buffer, 5, payloadLength);
    const payload = textDecoder.decode(payloadBuffer);

    return {
        commandCode,
        payload,
    };
}

// --- Example Usage ---

// Create a message
const originalMessage: ProtocolMessage = {
    commandCode: CommandCode.SendMessage,
    payload: "Hello, binary world! This is a test message with some UTF-8 characters like éàç.",
};

console.log("Original Message:", originalMessage);

// Serialize the message
const serializedBuffer = serializeMessage(originalMessage);
console.log("Serialized Buffer (ArrayBuffer):", serializedBuffer);
console.log("Serialized Buffer (bytes):", new Uint8Array(serializedBuffer));

// Deserialize the message
const deserializedMessage = deserializeMessage(serializedBuffer);
console.log("Deserialized Message:", deserializedMessage);

// Verify
if (originalMessage.commandCode === deserializedMessage.commandCode &&
    originalMessage.payload === deserializedMessage.payload) {
    console.log("Serialization and deserialization successful!");
} else {
    console.error("Error: Mismatch after serialization/deserialization.");
}

// Example with a different command
const ackMessage: ProtocolMessage = {
    commandCode: CommandCode.Acknowledge,
    payload: "Message received successfully!",
};

const serializedAck = serializeMessage(ackMessage);
const deserializedAck = deserializeMessage(serializedAck);
console.log("\nACK Message Test:");
console.log("Original ACK:", ackMessage);
console.log("Deserialized ACK:", deserializedAck);
```
---
## Key Low-Level Aspects Explained

Our example utilizes several core JavaScript/TypeScript features for **binary data manipulation**:

* **`ArrayBuffer`**: Represents a fixed-length raw binary data buffer. It's a chunk of memory that cannot be directly manipulated.
* **`DataView`**: This is crucial for **byte-level operations**. It provides methods like `getUint8()`, `setUint32()`, etc., to read and write different numerical types at specific byte **offsets** within an `ArrayBuffer`, correctly handling **endianness**. This is where you're truly working at the byte level.
* **`TextEncoder` and `TextDecoder`**: Web APIs used for converting strings to and from **UTF-8 encoded `Uint8Array`s**. This is vital for representing high-level string data as low-level bytes.
* **`Uint8Array`**: A "view" into an `ArrayBuffer` specifically for 8-bit unsigned integers (bytes). It's useful for iterating over raw byte data or creating a byte-level representation of data.
* **Manual Offset Management**: We explicitly calculate and use byte offsets (`0`, `1`, `5`, `5 + i`) to correctly place and retrieve different parts of our message within the `ArrayBuffer`. This manual control is characteristic of low-level protocol implementations.
* **Endianness**: The `setUint32()` and `getUint32()` methods allow specifying endianness (`true` for little-endian, `false` for big-endian). This is critical for ensuring multi-byte numbers are interpreted consistently across different systems, especially when transmitting data over a network.

---
## When to Use This Approach in TypeScript

While TypeScript and JavaScript abstract many low-level details, directly manipulating binary data is valuable in several scenarios:

* **Custom Binary File Formats**: Reading or writing proprietary file formats (e.g., custom image formats, game save files).
* **Hardware Interaction**: When using APIs like **WebUSB** or **Web Bluetooth**, you often send and receive specific binary data packets to control devices.
* **Optimized Network Communication**: For performance-critical applications where standard text-based protocols (like JSON) are too verbose, and you need maximum control over byte efficiency.
* **Implementing Sub-protocols over WebSockets**: Defining your own binary message framing within an existing WebSocket connection for highly structured data.
* **Emulators or Interpreters**: Building tools that need to parse or generate bytecode for custom virtual machines or instruction sets.

By leveraging **`ArrayBuffer`**, **`DataView`**, and other related APIs, TypeScript allows developers to work closely with the raw binary representation of data, achieving a level of control that's as low-level as typically possible in modern browser or Node.js environments.



## run: 
```sh
#node 22
$ node --experimental-transform-types test.ts
```