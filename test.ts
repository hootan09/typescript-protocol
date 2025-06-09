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