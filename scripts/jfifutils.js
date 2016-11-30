
/**
 * Exceptions
 */

const JFIFReaderParseError = 'JFIFReaderParseError';

/**
 * Makers
 */

const MARKER_SOI = 0xFFD8;
const MARKER_EOI = 0xFFD9;
const MARKER_SOS = 0xFFDA;
const MARKER_APP = 0xFFE0;

/**
 * Dependencies
 */

const StreamReader = require('./streamreader');

/**
 * JFIF Segment
 */

function JFIFSegment(id, offset, index) {

    this.id = id;
    this.idString = JFIFSegment.createIDString(id);
    this.offset = offset;
    this.value = null;
    this.description = id >= 0xFFC0 ? (JFIFSegment.Descriptions[id - 0xFFC0] || null) : null;
    this.index = index >= 0 ? index : -1;

}

JFIFSegment.createIDString = function (id) {
    return '0x' + id.toString(16).toUpperCase();
};

JFIFSegment.prototype.setValue = function (buffer, offset, length) {
    this.value = new Uint8Array(buffer, offset, length);
};

JFIFSegment.prototype.isValidJFIFAPP0 = function () {

    let index = this.index,
        value = this.value;

    if (index === 1 && value instanceof Uint8Array && value.byteLength >= 14) {
        return (value[0] << 8 | value[1]) === 0x4A46 && (value[2] << 8 | value[3]) === 0x4946 && value[4] === 00;
    }

    return false;

}

JFIFSegment.prototype.getDataView = function () {

    let value = this.value;

    if (value instanceof Uint8Array) {
        return new DataView(value.buffer, value.byteOffset, value.byteLength);
    }

    return null;

}

/**
 * JFIF Instance
 */

function JFIFInstance() {
    this.isConforming = false;
    this.majorVersion = 0;
    this.minorVersion = 0;
    this.density = { units: 0, x: 0, y: 0 };
    this.thumbnail = { x: 0, y: 0 };
    this.segments = [];
}

JFIFInstance.prototype.addSegment = function (id, offset, index) {
    let segments = this.segments,
        segment = new JFIFSegment(id, offset, index >= 0 ? index : segments.length);
    segments.push(segment);
    return segment;
};

JFIFInstance.prototype.parseJFIFHeader = function () {
    let segment, segments = this.segments;
    if (segments.length > 1 && (segment = segments[1]).isValidJFIFAPP0()) {
        let dataView = segment.getDataView();
        if (dataView !== null && dataView.byteLength >= 14) {
            this.isConforming = true;
            this.majorVersion = dataView.getUint8(5);
            this.minorVersion = dataView.getUint8(6);
            this.density.units = dataView.getUint8(7);
            this.density.x = dataView.getUint16(8, false);
            this.density.y = dataView.getUint16(10, false);
            this.thumbnail.x = dataView.getUint8(12);
            this.thumbnail.x = dataView.getUint8(13);
        }
    }
};

/**
 * JFIF Reader
 */

function JFIFReader(reader) {

    if (reader instanceof StreamReader) {
        this.reader = reader;
    } else {
        throw {
            name: 'JFIFReaderInstantiationError',
            message: 'JFIFReader constructor expects a valid StreamReader instance.'
        }
    }

}

JFIFReader.prototype.parse = function () {

    let reader = this.reader,
        buffer = new Uint8Array(8), // 64 bits ;-)
        data = new DataView(buffer.buffer),
        instance = new JFIFInstance(),
        segmentIndex = 0,
        bytesRead,
        segment,
        length,
        id;

    reader.rewind();

    do {

        // Copy 2 bytes from stream to local buffer...
        bytesRead = reader.read(buffer, 2, 0);

        if (bytesRead !== 2) {
            throw {
                name: JFIFReaderParseError,
                message: 'Unexpected result when reading marker'
            }
        }

        // Read Marker ID from local buffer
        id = data.getUint16(0, false);

        if (id < 0xFF01 || id > 0xFFFE) {
            throw {
                name: JFIFReaderParseError,
                message: ('Invalid marker ' + JFIFSegment.createIDString(id) + ' at position ' + (reader.tell() - 2))
            }
        }

        // Checks if first marker is in fact a SOI marker or if a SOI appears anywhere else on the stream
        if ((segmentIndex === 0 && id !== MARKER_SOI) || (segmentIndex !== 0 && id === MARKER_SOI)) {
            throw {
                name: JFIFReaderParseError,
                message: segmentIndex === 0 ? 'SOI marker not found' : 'Unexpected SOI marker'
            }
        }

        segment = instance.addSegment(id, reader.tell() - 2, segmentIndex++);

        // Markers with NO payload...
        if (id === MARKER_SOI || id === MARKER_EOI || id === MARKER_SOS) {

            if (id === MARKER_SOS) {
                // Start of Scan (SOS)
                // ... seek to 2 bytes before end of stream
                // ... not the best approach but will do for now
                let position = reader.tell();
                reader.seek(-2, 'SEEK_END');
                length = reader.tell() - position;
                segment.setValue(reader.getArrayBuffer(), position, length);
            }

        } else {

            bytesRead = reader.read(buffer, 2, 0);

            if (bytesRead !== 2) {
                throw {
                    name: JFIFReaderParseError,
                    message: 'Unexpected result when reading payload length'
                }
            }

            // payload length (minus 2 bytes from length)
            length = data.getUint16(0, false) - 2;
            if (length > 0) {
                segment.setValue(reader.getArrayBuffer(), reader.tell(), length);
                // seek to next marker
                reader.seek(length, 'SEEK_CUR');
            }

        }

    } while (id !== MARKER_EOI); // End of Image (EOI)

    // everything alright... ;-)
    instance.parseJFIFHeader();

    return instance;

};

/**
 * JFIF Segment Descriptions
 */

JFIFSegment.Descriptions = [];
JFIFSegment.Descriptions[0x00] = "Baseline DCT; Huffman";
JFIFSegment.Descriptions[0x01] = "Extended sequential DCT; Huffman";
JFIFSegment.Descriptions[0x02] = "Progressive DCT; Huffman";
JFIFSegment.Descriptions[0x03] = "Spatial lossless; Huffman";
JFIFSegment.Descriptions[0x04] = "Huffman table";
JFIFSegment.Descriptions[0x05] = "Differential sequential DCT; Huffman";
JFIFSegment.Descriptions[0x06] = "Differential progressive DCT; Huffman";
JFIFSegment.Descriptions[0x07] = "Differential spatial; Huffman";
JFIFSegment.Descriptions[0x08] = "[Reserved: JPEG extension]";
JFIFSegment.Descriptions[0x09] = "Extended sequential DCT; Arithmetic";
JFIFSegment.Descriptions[0x0A] = "Progressive DCT; Arithmetic";
JFIFSegment.Descriptions[0x0B] = "Spatial lossless; Arithmetic";
JFIFSegment.Descriptions[0x0C] = "Arithmetic coding conditioning";
JFIFSegment.Descriptions[0x0D] = "Differential sequential DCT; Arithmetic";
JFIFSegment.Descriptions[0x0E] = "Differential progressive DCT; Arithmetic";
JFIFSegment.Descriptions[0x0F] = "Differential spatial; Arithmetic";
JFIFSegment.Descriptions[0x10] = "Restart";
JFIFSegment.Descriptions[0x11] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x12] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x13] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x14] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x15] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x16] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x17] = JFIFSegment.Descriptions[0x10];
JFIFSegment.Descriptions[0x18] = "Start of Image (SOI)";
JFIFSegment.Descriptions[0x19] = "End of Image (EOI)";
JFIFSegment.Descriptions[0x1A] = "Start of Scan (SOS)";
JFIFSegment.Descriptions[0x1B] = "Quantisation table";
JFIFSegment.Descriptions[0x1C] = "Number of lines";
JFIFSegment.Descriptions[0x1D] = "Restart interval";
JFIFSegment.Descriptions[0x1E] = "Hierarchical progression";
JFIFSegment.Descriptions[0x1F] = "Expand reference components";
JFIFSegment.Descriptions[0x20] = "JFIF Header";
JFIFSegment.Descriptions[0x21] = "[Reserved: application extension]";
JFIFSegment.Descriptions[0x22] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x23] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x24] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x25] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x26] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x27] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x28] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x29] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x2A] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x2B] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x2C] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x2D] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x2E] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x2F] = JFIFSegment.Descriptions[0x21];
JFIFSegment.Descriptions[0x30] = "[Reserved: JPEG extension]";
JFIFSegment.Descriptions[0x31] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x32] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x33] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x34] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x35] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x36] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x37] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x38] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x39] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x3A] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x3B] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x3C] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x3D] = JFIFSegment.Descriptions[0x30];
JFIFSegment.Descriptions[0x3E] = "Comment";
JFIFSegment.Descriptions[0x3F] = "[Invalid]";

module.exports = {
    JFIFSegment: JFIFSegment,
    JFIFInstance: JFIFInstance,
    JFIFReader: JFIFReader
};
