
const StreamReader = require('./streamreader');

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

App.prototype.processFile = function (file) {
    const out = this.elements.output;
    out.textarea.value = `Name: ${file.name}\nType: ${file.type}\nSize: ${file.size}\n`;
    StreamReader.fromFile(file).then(function (streamReader) {
        out.textarea.value += 'File successfully read!';
        window.myStreamReader = streamReader;
    }, function (error) {
        out.textarea.value += `Error: ${error.message}`;
    });
};

module.exports = App;
