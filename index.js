'use strict';

const express = require('express');
const bodyParser = require('body-parser');

//EBS WS changes start
/*var https = require('https');
var http = require('http');
var username = 'operations';
var password = 'welcome';
var reqPost;
var tokenName;
var tokenValue;
var xml2js = require('xml2js');*/
//EBS WS changes End

const restService = express();
restService.use(bodyParser.json());

restService.post('/hook', function (req, res) {

    console.log('hook request');

    try {
        var speech = 'empty speech';

        if (req.body) {
            console.log('Request Body: ', req.body);
            var requestBody = req.body;

            if (requestBody.result) {
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                if (requestBody.result.action) {
                	  //calling EBS WS
                	  //callGetAccessToken();
                	  
                    speech += 'EBS action: ' + requestBody.result.action;
                }
            }
        }

        console.log('result: ', speech);

        return res.json({
            speech: speech,
            displayText: speech,
            source: 'apiai-webhook-sample'
        });
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});

/*function callGetAccessToken() {

    var optionsgetAccessToken = {
        host: 'rws3220164.us.oracle.com', // here only the domain name (no http/https !)
        port: 8003,
        auth: username + ':' + password,
        connection: 'keep-alive',
        path: '/OA_HTML/RF.jsp?function_id=mLogin', // the rest of the url with parameters if needed
        method: 'GET' // do GET
    };

    var reqGet = http.request(optionsgetAccessToken, function(res) {

        console.info('inside getting the token Info');

        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);


        res.on('data', function(d) {
            console.info('GET result:\n');
            console.info(d.toString());
            
            var extractedData = "";
            var parser = new xml2js.Parser();
            
            parser.parseString(d, function (err, result) {
              tokenName = result.response.data[0].accessTokenName.toString();
              tokenValue = result.response.data[0].accessToken.toString();
              console.dir(tokenName);
              console.dir(tokenValue);
						});
            
            console.info('\n\nCall completed');
            
        });
        res.on('end', () => {
    			console.log('No more data in response.');
    			console.info('tokenName :'+tokenName);
    			console.info('tokenValue :'+tokenValue);
	        if (res.statusCode == '200') {
    				callPost();
    			}
    				
  			});


    });
    console.info(reqGet);
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
}


function callPost() {
    var body = '<params>121212</params>';
    
    var postheaders = {
        'content-type': 'text/xml',
        'Cookie': tokenName+'='+tokenValue,
        'Cache-Control': 'no-cache',
        'Content-Length': Buffer.byteLength(body, 'utf8')
    };


    var optionspost = {
        host: 'rws3220164.us.oracle.com', // here only the domain name (no http/https !)
        port: 8003,
        path: '/OA_HTML/RF.jsp?function_id=ONT_REST_SALES_ORDERS&resp_id=21623&resp_appl_id=660&security_group_id=0',
        method: 'POST',
        headers: postheaders
    };


    
    var reqPost = http.request(optionspost, function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            process.stdout.write(d);
            console.info('\n\nPOST completed');
        });
    });
    console.info('after POST body' + body);
    // write the xml data
    reqPost.write(body);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
}
*/