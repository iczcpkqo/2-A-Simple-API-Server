var express = require('express');
var router = express.Router();
var multer = require('multer');
var storage = multer.diskStorage(
    {
        destination: 'routes/uploads/',
        filename: function (req, file, cb) {
            //req.body is empty...
            //How could I get the new_file_name property sent from client here?
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

router.post('/upload', upload.single('uploaded_file'), function (req, res, next) {

    // console.log(req.file, req.body)
    // console.log(req.file, req.body)
    console.log(req);
    console.log("=====");
    console.log(req.file);
    console.log("=====");
    // console.log(req);

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

//test
router.get('/merge', function (req, res, next) {
    // addCover('./uploads/testpage.pdf')
    addCover('testpage.pdf')
});

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
        // path.resolve(__dirname, './uploads/testpage.pdf')
        path.resolve(__dirname, './uploads/' + filename)
    ]

// const outputFile = path.resolve(__dirname, '')
    const mergePdf = async () => {
        const time = Date.now()
        await mergePDF({
            sourceFiles,
            outputFile: path.resolve(__dirname, './outfile/' + filename),
        })
        // console.log(`test2耗时：${Date.now() - time}ms`)
        console.log(filename + ` ${Date.now()} added`);
    }

    mergePdf();
}

router.get('/getfiles', function (req, res, next) {

    // let files = new Array();
    // let files = getFiles('./outfile/');
    getFiles('./outfile/');

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
            // console.log('== name:', dir.split('\\').pop());
            // files.push(dir.split('\\').pop());
            return dir.split('\\').pop();
        }
    }

});


router.get('/download/:name', function (req, res, next) {

    console.log("=== download ===");
    console.log(req.params.name);
    res.download('./routes/outfile/'+req.params.name);
});

module.exports = router;
