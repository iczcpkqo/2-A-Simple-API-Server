var express = require('express');
var router = express.Router();
var multer = require('multer');

/**
 * Set path and file name
 * @type {DiskStorage}
 */
var storage = multer.diskStorage(
    {
        destination: 'routes/uploads/',
        filename: function (req, file, cb) {
            cb(null, file.originalname + '-' + Date.now() + ".pdf");
        }
    }
);
var upload = multer({storage: storage});
const fs = require('fs');
const path = require("path");

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

/**
 * Upload file, it should be only real PDF
 */
router.post('/upload', upload.single('uploaded_file'), function (req, res, next) {

    console.log(req);
    console.log("=====");
    console.log(req.file);
    console.log("=====");

    try {
        if (!req.file) {
            res.send({
                status: false,
                message: 'No file uploaded'
            });
        } else {
            addCover(req.file.filename);
            res.send({
                status: true,
                message: 'File is uploaded',
                path: req.file.path
            });
        }

    } catch (err) {
        res.status(500).send(err);
    }
});

/**
 * test for merge, add the cover to a test pdf
 */
router.get('/merge', function (req, res, next) {
    // addCover('./uploads/testpage.pdf')
    addCover('testpage.pdf')
});

/**
 * add the default cover to a file
 * @param filename
 */
function addCover(filename) {
    const {PDFDocument} = require('pdf-lib')
    const mergePDF = async ({sourceFiles, outputFile}) => {
        const pdfDoc = await PDFDocument.create()
        for (let i = 0; i < sourceFiles.length; i++) {
            const localPath = sourceFiles[i]
            const PDFItem = await PDFDocument.load(fs.readFileSync(localPath))
            for (let j = 0; j < PDFItem.getPageCount(); j++) {
                const [PDFPageItem] = await pdfDoc.copyPages(PDFItem, [j])
                pdfDoc.addPage(PDFPageItem)
            }
        }
        const pdfBytes = await pdfDoc.save()
        fs.writeFileSync(outputFile, pdfBytes)

    }

    const sourceFiles = [
        path.resolve(__dirname, './cover/cover.pdf'),
        path.resolve(__dirname, './uploads/' + filename)
    ]

// const outputFile = path.resolve(__dirname, '')
    const mergePdf = async () => {
        const time = Date.now()
        await mergePDF({
            sourceFiles,
            outputFile: path.resolve(__dirname, './outfile/' + filename),
        })
        console.log(filename + ` ${Date.now()} added`);
    }

    mergePdf();
}

/**
 * api for get all the files which has added a cover
 */
router.get('/getfiles', function (req, res, next) {

    getFiles('./outfile/');

    /**
     * get files from dir
     * @param dir
     * @returns {string}
     */
    function getFiles(dir) {
        let files = [];
        dir = path.resolve(__dirname, dir);
        const stat = fs.statSync(dir);
        console.log(stat);
        if (stat.isDirectory()) {
            const dirs = fs.readdirSync(dir);

            dirs.forEach(value => {
                files.push(getFiles(path.join(dir, value)));
            })
            console.log(files);
            res.send({files: files});
        } else if (stat.isFile()) {
            console.log('== path:', dir);
            return dir.split('\\').pop();
        }
    }

});


/**
 * download a file by name
 */
router.get('/download/:name', function (req, res, next) {

    console.log("=== download ===");
    console.log(req.params.name);
    res.download('./routes/outfile/'+req.params.name);
});

module.exports = router;
