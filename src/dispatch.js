module.exports = {serveFile}

const fs = require('fs');
const path = require('path');

var mimetype = {
	".js" : "text/javascript",
	".html" : "text/html",
	".css" : "text/css",
	".png" : "image/png",
	".jpg" : "image/jpeg",
};

function serveFile(filePath, res) {
	fs.exists(filePath, function(exists){
    	if (exists) {
    		fs.readFile(filePath, function(err, data){
    			if (err) {
    				res.statusCode = 500;
    				res.end("Could not read file.");
    				return;
    			} else {
                    let ext = path.extname(filePath);

		    		res.statusCode = 200;
		    		res.setHeader('Content-Type', mimetype[ext] || "text/plain");
		    		res.end(data);
		    		return;
    			}
    		});
    	} else {
	    	res.statusCode = 404;
	    	res.end("File not found.");
	    }
    });
}