
const StreamReader = require('./stupidstreamreader');
const JFIFUtils = require('./jfifutils');

function App(window, document) {

    this.isRunning = false;
    this.window = window;
    this.document = document;
    this.elements = {
        header: null,
        input: null,
        output: {
            textarea: null,
            canvas: null
        }
    };

}

App.prototype.updateHeader = function () {
    this.elements.header.innerHTML += '!';
};

App.prototype.setInputHandler = function () {
    this.elements.input.addEventListener('change', this.inputChanged.bind(this), false);
};

App.prototype.inputChanged = function (event) {
    let files = event.target.files || e.dataTransfer.files;
    if (files && files.length > 0) {
        this.processFile(files[0]);
    }
};

App.prototype.start = function () {

    const doc = this.document, els = this.elements;

    // get pointers to main elements
    els.header = doc.querySelector('body h1');
    els.input = doc.getElementById('input');

    let output = doc.getElementById('output');
    els.output.textarea = output.querySelector('textarea');
    els.output.canvas = output.querySelector('canvas');

    // bootstrap...
    this.updateHeader();
    this.setInputHandler();

};

App.prototype.run = function () {

    if (this.isRunning === true) {
        return;
    }

    this.isRunning = true;
    this.start();

};

App.prototype.processJPEGStream = function (streamReader) {
    try {
        let jfifInstance, jfifReader = new JFIFUtils.JFIFReader(streamReader);
        jfifInstance = jfifReader.parse();
        return jfifInstance;
    } catch (e) {
        console.log(`Error processing JPEG file...\n(${e.name}) ${e.message}`);
        return null;
    }
};

App.prototype.println = function (text) {
    const textarea = this.elements.output.textarea;
    if (textarea !== null) {
        textarea.value += text + '\n';
    }
};

App.prototype.processFile = function (file) {

    const app = this;

    app.println('New file selected!');
    app.println(`Name: ${file.name}`);
    app.println(`Type: ${file.type}`);
    app.println(`Size: ${file.size}`);

    StreamReader.fromFile(file).then(function (streamReader) {
        app.println('File successfully read!');
        window.myStuff = {
            streamReader: streamReader,
        };
        if (file.type === 'image/jpeg') {
            let instance = app.processJPEGStream(streamReader);
            if (instance instanceof JFIFUtils.JFIFInstance) {
                app.println('JPEG file successfully parsed!');
                if (instance.isConforming) {
                    app.println('JPEG file is JFIF conformant!');
                    app.println('----------------[SEGMENTS]----------------')
                    instance.segments.forEach(function (segment) {
                        app.println(`${segment.idString} ${segment.description} @ ${segment.index}`);
                    });
                }
                window.myStuff.jfifInstance = instance;
            }
        }
    }, function (error) {
        app.println(`Error: ${error.message}`);
    });
};

module.exports = App;
