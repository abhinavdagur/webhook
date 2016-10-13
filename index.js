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
                if (requestBody.result.action) {
                	  //calling EBS WS
                	 if (requestBody.result.action === 'team8-repeatorder'){
                	  	 processRepeatOrder(requestBody.result.parameters.order_number,function(returnedJson){
                	  	 		console.log('result: ', returnedJson);
                	  	 		return res.json({returnedJson});
                	  	 });	
                	  	 
                	 }else if (requestBody.result.action === 'team8-createorder'){
                	 		processCreateOrder(requestBody.result.parameters.item_name,requestBody.result.parameters.quantity,function(returnedJson){
                	 		console.log('result: ', returnedJson);
                	  	 		//return res.json({returnedJson});
                	  	 		return getJson(requestBody,res,speech,returnedJson);
                	  	 });
                	 }else if (requestBody.result.action === 'team8-cancelorder'){
                	 }else if (requestBody.result.action === 'team8-queryorder'){
                	 }else if (requestBody.result.action === 'team8-queryfeworder'){
                	 	  processFewOrders(requestBody.result.parameters.count,requestBody.result.parameters.customer_name,function(returnedJson){
                	 		console.log('result: ', returnedJson);
                	  	 		return res.json({returnedJson});
                	  	 });
                	 	
                	 	
                	 }else if (requestBody.result.action === 'team8-expediteorder'){
                	 
                	 }
                	  
                    speech += 'EBS action: ' + requestBody.result.action;
                }
            }
        }

        

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

function getJson(requestBody,res,speech,returnedJson) {
	
	//return res.json({returnedJson});
	//speech += 'EBS action: ' + requestBody.result.action;
	//console.log('res: ', res);
	//console.log('\n');
	console.log('returnedJson: ', returnedJson);
	console.log('\n');
	//console.log('Status: ', returnedJson.response[]);
	console.log('speech: ', speech);
	console.log('\n');
	console.log('Order#: ', returnedJson.response.salesorder[0].ordernumber);
	//console.log('\n');
	speech += 'New order# '+returnedJson.response.salesorder[0].ordernumber+'.';
	speech +=' EBS action: ' + requestBody.result.action;
	
return res.json({
            speech: speech,
            displayText: speech,
            source: 'EBS-WebService-Response'
        });	
}	

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});

function processFewOrders(count,customerName,callback) {
		getAccessToken(function(tokenName,tokenValue){
		   
		    	callQueryLastOrders(tokenName,tokenValue,function(inputXml){
		    		
		    		console.log("inputXml :"+inputXml);
            var parser = new xml2js.Parser();
            
            parser.parseString(inputXml, function (err, result) {
            	
            	//return callback(JSON.stringify(result));
            	return callback(result);
            	
            	
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
            	
            	//return callback(JSON.stringify(result));
            	return callback(result);
            	
            	
						});		    		
		    		
		    		
		    	});
	
	});
}

function processCreateOrder(itemName,qty,callback) {
	console.log(" In processCreateOrder :");
	getAccessToken(function(tokenName,tokenValue){
		   
		    	callCreateOrder(itemName,qty,tokenName,tokenValue,function(inputXml){
		    		
		    		console.log("inputXml :"+inputXml);
            var parser = new xml2js.Parser();
            
            parser.parseString(inputXml, function (err, result) {
            	
            	//return callback(JSON.stringify(result));
            	return callback(result);
            	
            	
						});		    		
		    		
		    		
		    	});
	
	});
	
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


function callCreateOrder(itemName,qty,tokenName,tokenValue,callBackLastOrders) {
	
    var body = '<params><param>1006</param><param>2626</param><param>1025</param><param>1026</param><param>1</param></params>';
    var returnxml;
    
    var reqPost = http.request(getOptionsPost(body,'ONT_REST_CREATE_ORDER'), function(res) {

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




