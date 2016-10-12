'use strict';

const express = require('express');
const bodyParser = require('body-parser');

//EBS WS changes start
var https = require('https');
var http = require('http');
var username = 'operations';
var password = 'welcome';
var reqPost;
var tokenName;
var tokenValue;
var xml2js = require('xml2js');
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
						console.log('requestBody.result: ', requestBody.result);
            if (requestBody.result) {
                speech = '';
								console.log('fulfillment: ', requestBody.result.fulfillment);
                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }
								console.log('requestBody.result: ', requestBody.result);
								console.log('requestBody.result.result.parameters.order_number: ', requestBody.result.parameters.order_number);
                if (requestBody.result.action) {
                	  //calling EBS WS
                	 if (requestBody.result.action === 'repeat.order'){
                	  	 processRepeatOrder(requestBody.result.parameters.order_number,function(returnedJson){
                	  	 		console.log('result: ', returnedJson);
                	  	 		return res.json({returnedJson});
                	  	 });	
                	  	 
                	 }else if (requestBody.result.action === 'create.order'){
                	 		processCreateOrder(requestBody.result.parameters.item_name,requestBody.result.parameters.quantity,function(returnedJson){
                	 		console.log('result: ', returnedJson);
                	  	 		return res.json({returnedJson});
                	  	 });
                	 }else if (requestBody.result.action === 'cancel.order'){
                	 }else if (requestBody.result.action === 'query.order'){
                	 }else if (requestBody.result.action === 'expedite.order'){
                	 
                	 }
                	  
                    speech += 'EBS action: ' + requestBody.result.action;
                }
            }
        }

        console.log('result: ', speech);

        /*return res.json({
            speech: speech,
            displayText: speech,
            source: 'ebs-team-integration'
        });*/
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

function processLastOrders(callback) {
		getAccessToken(function(tokenName,tokenValue){
		   
		    	callQueryLastOrders(tokenName,tokenValue,function(inputXml){
		    		
		    		console.log("inputXml :"+inputXml);
            var parser = new xml2js.Parser();
            
            parser.parseString(inputXml, function (err, result) {
            	
            	return callback(JSON.stringify(result));
            	
            	
						});		    		
		    		
		    		
		    	});
	
	})
}


function processRepeatOrder(orderNumber,callback) {
		getAccessToken(function(tokenName,tokenValue){
		   
		    	callRepeatOrders(orderNumber,tokenName,tokenValue,function(inputXml){
		    		
		    		console.log("inputXml :"+inputXml);
            var parser = new xml2js.Parser();
            
            parser.parseString(inputXml, function (err, result) {
            	
            	return callback(JSON.stringify(result));
            	
            	
						});		    		
		    		
		    		
		    	});
	
	})
}

function processCreateOrder(itemName,qty) {
	
	
}

function getAccessToken(callBackAccessToken) {

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
            
            var parser = new xml2js.Parser();
            
            parser.parseString(d, function (err, result) {
              tokenName = result.response.data[0].accessTokenName.toString();
              tokenValue = result.response.data[0].accessToken.toString();
              console.dir(tokenName);
              console.dir(tokenValue);
              console.info('Got Token Name and value');
						});
            
            console.info('\n\nCall completed');
            
        });
        res.on('end', () => {
    			console.log('No more data in response.');
	        if (res.statusCode == '200') {
    				return callBackAccessToken(tokenName,tokenValue);
    			}
    				
  			});


    });
    console.info(reqGet);
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
}

function getOptionsPost(body,EBSFunctionName){
	
	var postheaders = {
        'content-type': 'text/xml',
        'Cookie': tokenName+'='+tokenValue,
        'Cache-Control': 'no-cache',
      'Content-Length': Buffer.byteLength(body, 'utf8')}

	 var optionspost = {
        host: 'rws3220164.us.oracle.com',
        port: 8003,
        path: '/OA_HTML/RF.jsp?function_id='+EBSFunctionName+'&resp_id=21623&resp_appl_id=660&security_group_id=0',
        method: 'POST',
        headers: postheaders
    };
 
 return optionspost;
	
	     
}

function callRepeatOrders(orderNumber,tokenName,tokenValue,callBackLastOrders) {
    var body = '<params>'+orderNumber+'</params>';
    var returnxml;
    
    var reqPost = http.request(getOptionsPost(body,'ONT_REST_SALES_ORDERS'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            returnxml = d;
            //console.info('\n\nPOST completed');
        });
        
        res.on('end', () => {
	        if (res.statusCode == '200') {
    				return callBackLastOrders(returnxml);
    			}
    				
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
function callQueryLastOrders(tokenName,tokenValue,callBackLastOrders) {
    var body = '<params>121212</params>';
    var returnxml;
    
    var reqPost = http.request(getOptionsPost(body,'ONT_REST_SALES_ORDERS'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            returnxml = d;
            //console.info('\n\nPOST completed');
        });
        
        res.on('end', () => {
	        if (res.statusCode == '200') {
    				return callBackLastOrders(returnxml);
    			}
    				
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




                