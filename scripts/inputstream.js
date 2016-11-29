
function InputStream(buffer) {

    if (buffer instanceof ArrayBuffer) {
        this.pointer = 0;
        this.length = buffer.byteLength;
        this.buffer = new Uint8Array(buffer);
    } else {
        throw {
            name: 'InputStreamInstantiationError',
            message: 'InputStream constructor expects a valid ArrayBuffer instance.'
        };
    }

}

InputStream.prototype.read = function (outputBuffer, bytesToRead, byteOffset) {

    let inputPointer = this.pointer,
        inputLimit = this.length;

    if (bytesToRead > 0 && inputPointer < inputLimit) {

        let inputBuffer = this.buffer,
            outputPointer = (byteOffset = byteOffset >= 0 ? byteOffset : 0),
            outputLimit = outputPointer + bytesToRead;

        while (outputPointer < outputLimit && inputPointer < inputLimit) {
            outputBuffer[outputPointer++] = inputBuffer[inputPointer++];
        }

        this.pointer = inputPointer;

        return outputPointer - byteOffset;

    }

    return 0;

};

// 'SEEK_SET': Seek relative to the beginning of stream
// 'SEEK_CUR': Seek relative to current position of the stream pointer
// 'SEEK_END': Seek relative to the end of the stream

InputStream.prototype.seek = function (offset, mode) {

    let length = this.length,
        pointer = this.pointer;

    switch (mode) {
        case 'SEEK_SET':
            pointer = offset;
            break;
        case 'SEEK_END':
            pointer = length + offset;
            break;
        default: // 'SEEK_CUR'
            pointer += offset;
            break;
    }

    if (pointer < 0) {
        pointer = 0;
    } else if (pointer > length) {
        pointer = length;
    }

    this.pointer = pointer;

};

InputStream.prototype.tell = function () {
    return this.pointer;
};

InputStream.fromFile = function (file) {
    return new Promise(function (resolve, reject) {
        if (file instanceof File) {
            let fileReader = new FileReader();
            fileReader.onload = function (event) {
                try {
                    let inputStream = new InputStream(event.target.result);
                    resolve(inputStream);
                } catch (error) { reject(error); }
            };
            fileReader.onerror = function (event) {
                reject({
                    name: 'InputStreamFileReadError',
                    message: 'Error reading file (' + file.name + ')...'
                });
            };
            fileReader.readAsArrayBuffer(file);
        } else {
            reject({
                name: 'InputStreamBadFileError',
                message: 'File argument expected...'
            });
        }
    });
};

module.exports = InputStream;
