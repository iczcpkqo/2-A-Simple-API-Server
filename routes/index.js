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

    // let files = getFiles('./outfile/');
    res.send({files: getFilesFromDir('./outfile/')});

    function getFilesFromDir(dir){
        console.log('Path is:' + dir);

        let files = [];
        dir = path.resolve(__dirname, dir);
        const stat = fs.statSync(dir);

        if(stat.isDirectory()) {
            const dirs = fs.readdirSync(dir);
            files = dirs.filter(val => {
                return path.extname(val) === '.pdf';
            });
            return files;
        // } else if(stat.isFile()){
            // return [path.basename(dir)];
        } else{
            throw new Error(`Parameter is NOT a Directory: ${dir}`);
        }
    }

    /**
     * get files from dir
     * @param dir
     * @returns
     */
    function getFiles(dir) {
        console.log(`Passing dir: ${dir}`);
        let files = [];
        dir = path.resolve(__dirname, dir);
        const stat = fs.statSync(dir);

        if (stat.isDirectory()) {
            const dirs = fs.readdirSync(dir);

            dirs.forEach(value => {
                let reFiles = getFiles(path.join(dir, value));
                files.push(...Array.isArray(reFiles)?reFiles:[reFiles]);
            });
            console.log(`Get Files From: ${dir}`);
            console.log(files);
            return files;
        } else if(stat.isFile()){
            // return dir.split('\\').pop();
            return path.basename(dir);
        }
        else {
            throw new Error(`Parameter is neither a directory nor a file: ${dir}`)
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
