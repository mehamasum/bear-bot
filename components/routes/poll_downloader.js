var officegen = require('officegen');

module.exports = function(webserver, controller) {

    webserver.get('/download', function(req, res) {
        var q = decodeURIComponent(req.query['q']);
        var o = decodeURIComponent(req.query['o']);
        var t = req.query['t'];

        res.set({
            "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            'Content-disposition': 'attachment; filename="'+q+'".docx'
        });

        var docx = officegen ({
            'type': 'docx', 
            'creator': 'Bearbot',
            'title': q
        });

        docx.on ( 'finalize', function ( written ) {
            console.log ('Finish to create a docx file.\nTotal bytes created: ' + written + '\n' );
        });

        docx.on ( 'error', function ( err ) {
            console.log ( err );
        });

        // ... (fill docx with data) 
        var pObj = docx.createP();
        pObj.addText (q+ "; " + o+ "; "+t);

        docx.generate (res);
    });

}
