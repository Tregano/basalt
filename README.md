# basalt
Basalt Technical assesment

This script will retrieve the Geolocation data of a provided IP address using the RapidAPI IP Geolocation API.
Thereafter it will retrieve the Exchange rate of your local currency compared to the rest of the world or a specific currency, depends on the options you use.
It can be used as a commandline tool as well as an API client.

Command line:
 Arguments:
  -i, --ip <PUBLIC IP ADDRESS> (Mandatory field).
  -c, --currency <Currency code to which you want to compare in relation to the currency of the country in which the IP address is from.>

 How-to:
  This example will return the Exchange rate between ZAR and USD:
    node ipLocationExchangeRate.js --ip 102.39.206.186 --currency USD

  This example will return the Exchange rate between ZAR and the rest of the world:
    node ipLocationExchangeRate.js --ip 102.39.206.186
 
API request:

 Start up the script by running, node ipLocationExchangeRate.js, from the cloned directory. 
 This will start up an API client on localhost:3000.

 Use the provided postman requests to test.

 https://winter-space-439897.postman.co/workspace/Team-Workspace~9726aaa1-61af-476f-8df8-2fcaaf26c004/collection/32551876-17fc4707-f109-4453-9ae5-dad1324a106f?action=share&creator=32551876

 Example requests:

 endpoint: http://localhost:3000/api
 request body 1:
 {
    "ip": "102.39.206.186",
 }
 response: All exchange rates.

 request body 2:
 {
    "ip": "102.39.206.186",
    "currency": "USD"
 }
 response: Country specific exchange rate.
