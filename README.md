# basalt
Basalt Technical assesment

 Using a passed in public IP, this script will retrieve the Geolocation data of that IP address using the RapidAPI IP Geolocation API.
 Thereafter it will retrieve the Exchange rate of your local currency compared to the rest of the world or a specific currency, depends on the options you use.
 The default IP is set for a South African public ip, meaning it will use this IP if no IP address is supplied.

 How-to:

This example will return the Exchange rate between ZAR and USD:
    node ipLocationExchangeRate.js --ip 102.39.206.186 --currency USD

This example will return the Exchange rate between ZAR and the rest of the world:
    node ipLocationExchangeRate.js --ip 102.39.206.186
 
