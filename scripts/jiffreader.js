
const JIFFReaderParseError = 'JIFFReaderParseError';
const StreamReader = require('./streamreader');


function JIFFSegment(id, offset, length) {

    let idString = 'x' + id.toString(16);

    this.id = id;
    this.idString = idString;
    this.offset = offset;
    this.length = length;
    this.description = JIFFSegment.Descriptions.hasOwnProperty(idString) ? JIFFSegment.Descriptions[idString] : null;

}

function JIFFInstance() {
    this.version = "";
    this.segments = {};
}

JIFFInstance.prototype.addSegment = function () {
};

function JIFFReader(reader) {

    if (reader instanceof StreamReader) {
        this.reader = reader;
    } else {
        throw {
            name: 'JIFFReaderInstantiationError',
            message: 'JIFFReader constructor expects a valid StreamReader instance.'
        }
    }

}

JIFFReader.prototype.parse = function () {

    let reader = this.reader,
        buffer = new Uint8Array(32),
        data = new DataView(buffer.buffer),
        id;

    reader.rewind();

    if (reader.read(buffer, 2, 0) !== 2) {
        throw {
            name: JIFFReaderParseError,
            message: 'Unexpected End Of Stream'
        }
    }

    if ((id = data.getUint16(0, false)) !== 0xFFD8) {
        throw {
            name: JIFFReaderParseError,
            message: 'SOI Marker Not Found'
        }
    }

    new JIFFSegment(id, 0);

    // Read JIFF Header
    if (reader.read(buffer, 2, 0) !== 2) {
        return false;
    }

};

JIFFSegment.Descriptions['xffc0'] = "Baseline DCT; Huffman";
JIFFSegment.Descriptions['xffc1'] = "Extended sequential DCT; Huffman";
JIFFSegment.Descriptions['xffc2'] = "Progressive DCT; Huffman";
JIFFSegment.Descriptions['xffc3'] = "Spatial lossless; Huffman";
JIFFSegment.Descriptions['xffc4'] = "Huffman table";
JIFFSegment.Descriptions['xffc5'] = "Differential sequential DCT; Huffman";
JIFFSegment.Descriptions['xffc6'] = "Differential progressive DCT; Huffman";
JIFFSegment.Descriptions['xffc7'] = "Differential spatial; Huffman";
JIFFSegment.Descriptions['xffc8'] = "[Reserved: JPEG extension]";
JIFFSegment.Descriptions['xffc9'] = "Extended sequential DCT; Arithmetic";
JIFFSegment.Descriptions['xffca'] = "Progressive DCT; Arithmetic";
JIFFSegment.Descriptions['xffcb'] = "Spatial lossless; Arithmetic";
JIFFSegment.Descriptions['xffcc'] = "Arithmetic coding conditioning";
JIFFSegment.Descriptions['xffcd'] = "Differential sequential DCT; Arithmetic";
JIFFSegment.Descriptions['xffce'] = "Differential progressive DCT; Arithmetic";
JIFFSegment.Descriptions['xffcf'] = "Differential spatial; Arithmetic";
JIFFSegment.Descriptions['xffd0'] = "Restart";
JIFFSegment.Descriptions['xffd1'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd2'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd3'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd4'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd5'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd6'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd7'] = JIFFSegment.Descriptions['xffd0'];
JIFFSegment.Descriptions['xffd8'] = "Start of Image (SOI)";
JIFFSegment.Descriptions['xffd9'] = "End of Image (EOI)";
JIFFSegment.Descriptions['xffda'] = "Start of Scan (SOS)";
JIFFSegment.Descriptions['xffdb'] = "Quantisation table";
JIFFSegment.Descriptions['xffdc'] = "Number of lines";
JIFFSegment.Descriptions['xffdd'] = "Restart interval";
JIFFSegment.Descriptions['xffde'] = "Hierarchical progression";
JIFFSegment.Descriptions['xffdf'] = "Expand reference components";
JIFFSegment.Descriptions['xffe0'] = "JFIF Header";
JIFFSegment.Descriptions['xffe1'] = "[Reserved: application extension]";
JIFFSegment.Descriptions['xffe2'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe3'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe4'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe5'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe6'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe7'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe8'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffe9'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffea'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffeb'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffec'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffed'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffee'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xffef'] = JIFFSegment.Descriptions['xffe1'];
JIFFSegment.Descriptions['xfff0'] = "[Reserved: JPEG extension]";
JIFFSegment.Descriptions['xfff1'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff2'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff3'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff4'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff5'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff6'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff7'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff8'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfff9'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfffa'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['0xfffb'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfffc'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfffd'] = JIFFSegment.Descriptions['xfff0'];
JIFFSegment.Descriptions['xfffe'] = "Comment";
JIFFSegment.Descriptions['xffff'] = "[Invalid]";
