"use strict";

// External dependencies
const axios = require('axios');
const program = require('commander');
const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');

// Define variables to be used in script.
const version = '1.1.0';
const port = 3000;
var userIpAddress;
var userCurrency;
const currencyData = new Object();
// Define regex to be used to verify IP addresses.
const regexExp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i;

// RapidAPI apiKey.
const apiKey = '524630b609msh4e6e06a5104c3a6p16fb9cjsn67a9ce99db10';
const ipGeolocationApiEndpoint = 'https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/';
const exchangeRatesApiEndpoint = 'https://exchange-rate-api1.p.rapidapi.com/latest';
const currencyNamesApiEndpoint = 'https://exchange-rate-api1.p.rapidapi.com/codes';

// Create APP and Router to handle requests.
const app = express();
app.use(express.json());

const router = express.Router();

app.listen(port, () => {
    console.log("Server Listening on localhost:" + port);
});

// All routes prefixed with /api
app.use('/api', router);

// JSON parse all requests.
router.use(bodyParser.json());
// Middleware for parsing bodies from URL.
router.use(bodyParser.urlencoded({ extended: true }));
// Pass request to the main function.
router.use(async function (request, response) {
    console.log('Incoming request: ' + util.inspect(request.body));
    var respObj = await main(request.body);
    console.log('Response: ' + util.inspect(respObj));
    // If the response is successful, respond with body.
    if (respObj.body && respObj.code == 200) {
        response.status(respObj.code);
        response.json(respObj.body);
    } else {
        response.sendStatus(respObj.code);
    }
});

// Command line options.
program
    .version(version)
    .option("-i, --ip [ipaddress]", 'IP to be used to find the location."')
    .option("-c, --currency [currency]", 'Show conversion from local to specific currency."')
    .parse(process.argv);


// Use argument or default value if argument is not passed in.
if (program.opts().currency) {
    userCurrency = program.opts().currency;
}

if (program.opts().ip && regexExp.test(program.opts().ip)) {
    // If commandline arguments are used, pass the request to the main function in the same way as the HTTP request.
    userIpAddress = program.opts().ip;
    main(program.opts());
} else {
    // Don't go to main() for commandline options if it's an invalid IP or no value is provided.
    console.log('Not a valid IP');
}

// Function to fetch geolocation data using IP Geolocation API on RapidAPI
async function getGeolocationData(ipAddress) {
    try {
        console.log('Retrieving Geolocation data using provided IP: ' + ipAddress);
        // Collect GEO location data using IP address.
        // API endpoint defined globally.
        const response = await axios.get(ipGeolocationApiEndpoint, {
            // parameters required for API call.
            params: {
                ip: ipAddress
            },
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'ip-geolocation-ipwhois-io.p.rapidapi.com'
            },
        });

        const geolocationData = response.data;
        return geolocationData;

    } catch (error) {
        console.error('Error fetching geolocation data:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to fetch exchange rates using Exchange Rates API on RapidAPI
async function getExchangeRates(geolocationData) {
    try {
        console.log('Retrieving Exchange rates for country: ' + geolocationData.country + ', using currency: ' + geolocationData.currency + '(' + geolocationData.currency_code + '). ' + geolocationData.country_code);
        // Collect exchange rate info for local currency.
        // API endpoint defined globally.
        const response = await axios.get(exchangeRatesApiEndpoint, {
            // parameters required for API call.
            params: {
                base: geolocationData.currency_code,
            },
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'exchange-rate-api1.p.rapidapi.com'
            },
        });

        const exchangeRates = response.data.rates;

        // Process results of API call creating an Object to store the exchange rate.
        return Object.entries(exchangeRates).forEach((entry) => {
            var currency;
            const [key, value] = entry;
            currency = key;
            currencyData[currency].push(`exchange: ${value}`);
        });

    } catch (error) {
        console.error('Error fetching exchange rates:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to fetch currency code and currency name using Exchange Rates API on RapidAPI
async function getCurrencyNames() {
    try {
        console.log('Retrieving List of currency names and codes');
        // Collect currency code and currency name.
        // API endpoint defined globally.
        const response = await axios.get(currencyNamesApiEndpoint, {
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'exchange-rate-api1.p.rapidapi.com'
            },
        });

        const currencyCodes = response.data.supported_codes;
        // Process results of API call creating an Object to store the country code as well as the currency name.
        return currencyCodes.forEach((currencyCode) => {
            var currency;
            var name;
            Object.entries(currencyCode).forEach((entry) => {

                const [key, value] = entry;
                if (key == 'code') {
                    currency = value;
                } else if (key == 'name') {
                    name = value;
                    currencyData[currency] = [];
                    currencyData[currency].push(`name: ${value}`);
                }
            });
        });
    } catch (error) {
        console.error('Error fetching exchange rates:', error.response ? error.response.data : error.message);
        throw error;
    }
}

function sortObj(obj) {
    return Object.keys(obj).sort().reduce(function (result, key) {
        // If userCurrency is set and it is a valid currency, only return specific currency data.
        if (userCurrency && currencyData[userCurrency] !== undefined) {
            if (key == userCurrency) {
                result[key] = obj[key];
            }
        } else {
            result[key] = obj[key];
        }

        return result;
    }, {});
}

async function main(request) {
    // Optional field, sanity check exists in sortObj function.
    if (request.currency) {
        // Convert currency to uppercase.
        userCurrency = request.currency.toUpperCase();
    }
    // Mandatory field and use regex to confirm the IP is in the correct format.
    if (request.ip && regexExp.test(request.ip)) {
        userIpAddress = request.ip;

        try {
            // Exchange Rates API on RapidAPI.
            // Fetch currency data, name and code.
            await getCurrencyNames();

            // IP Geolocation API on RapidAPI.
            // Fetch geolocation data.
            const geolocationData = await getGeolocationData(userIpAddress);

            // Exchange Rates API on RapidAPI.
            // Fetch exchange rates, Local currency compared to rest of the world.
            await getExchangeRates(geolocationData);
            // Delete local exchange data from currencyData object.
            if (userCurrency != geolocationData.currency_code) {
                delete currencyData[geolocationData.currency_code];
            }
            // Sort currencyData object for printing.
            var sortedCurrencyData = await sortObj(currencyData, geolocationData);

            console.log(`Geolocation Data: ${JSON.stringify(geolocationData, null, 4)}`);
            console.log(`Exchange Rates: ${geolocationData.currency} - ${geolocationData.currency_code}:\n ${JSON.stringify(sortedCurrencyData, null, 4)}`);

            var responseObject = new Object();
            if (sortedCurrencyData) {
                responseObject.code = 200;
                responseObject.body = {};
                responseObject.body.currency = geolocationData.currency;
                responseObject.body.currency_code = geolocationData.currency_code;
                if (currencyData[userCurrency] === undefined) {
                    responseObject.body.requested_currency = userCurrency + ' can not be found.';
                }
                responseObject.body.exchange_data = sortedCurrencyData;
            } else {
                responseObject.code = 400;
            }

            return responseObject;

        } catch (error) {
            console.error('Main error:', error);
        }
    } else {
        // If the IP is in the incorrect format, respond with an error. Commandline will only print an error.
        var responseObject = new Object();
        responseObject.code = 400;
        if (program.opts().ip) {
            console.log('Not a valid IP: ' + program.opts().ip);
        }
        return responseObject;
    }
}


