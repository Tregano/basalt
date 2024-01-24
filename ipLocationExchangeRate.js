"use strict";

// External dependencies
const axios = require('axios');
const program = require('commander');

const version = '1.0.0';

// RapidAPI apiKey.
const apiKey = '524630b609msh4e6e06a5104c3a6p16fb9cjsn67a9ce99db10';
const ipGeolocationApiEndpoint = 'https://ip-geolocation-ipwhois-io.p.rapidapi.com/json/';
const exchangeRatesApiEndpoint = 'https://exchange-rate-api1.p.rapidapi.com/latest';
const currencyNamesApiEndpoint = 'https://exchange-rate-api1.p.rapidapi.com/codes';

var currencyData = new Object();

// Command line options.
program
    .version(version)
    .option("-i, --ip [ipaddress]",'IP to be used to find the location."')
    .option("-c, --currency [currency]",'Show conversion from local to specific currency."')
    .parse(process.argv);

// Use argument or default value if argument is not passed in.
const userIpAddress = program.opts().ip || '102.39.206.186'
const userCurrency = program.opts().currency || ''

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
        // If userCurrency is set, only return specific currency data.
        if (userCurrency) {
            if (key == userCurrency) {
                result[key] = obj[key];
            }
        } else {
            result[key] = obj[key];
        }
        return result;
    }, {});
}

async function main() {
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
        delete currencyData[geolocationData.currency_code];
        // Sort currencyData object for printing.
        var sortedCurrencyData = await sortObj(currencyData);

        console.log(`Geolocation Data: ${JSON.stringify(geolocationData, null, 4)}`);
        console.log(`Exchange Rates: ${geolocationData.currency} - ${geolocationData.currency_code}:\n ${JSON.stringify(sortedCurrencyData, null, 4)}`);

    } catch (error) {
        console.error('Main error:', error);
    }
}

main();
