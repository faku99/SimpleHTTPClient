// Modules imports.
const colors = require('colors/safe');
const prompt = require('prompt');
const request = require('request');

// We define the prompts we want from the user.
var prompt_schema = {
    properties: {
        address: {
            description: colors.white('URL'),
            format: 'url',
            message: 'Address must be an URL.',
            required: true,
            type: 'string'
        },
        method: {
            default: 'GET',
            description: colors.white('Method'),
            message: 'Method must be GET or POST.',
            pattern: '(GET)|(POST)',
            type: 'string'
        },
        body: {
            ask: function() {
                return prompt.history('method').value === 'POST';
            },
            conform: function(value) {
                var result = true;

                try {
                    result = JSON.parse(value) != null;
                } catch (err) {
                    result = false;
                }

                return result;
            },
            description: colors.white('Body (must be a valid JSON)'),
            message: 'Data must be a valid JSON.',
            required: true,
            type: 'string'
        },
        headers: {
            before: function(value) {
                return (typeof value === 'array') ? value.filter(item => item.split(' ').length == 2) : [];
            },
            description: colors.white('Headers (<key> <value>), end with CTRL-C'),
            message: 'Headers must be entered with the format "<key> <value>".',
            default: [],
            required: false,
            type: 'array'
        }
    }
};

prompt.delimiter = colors.white(':');
prompt.message = '';

// Start the prompt.
prompt.start();

prompt.get(prompt_schema, function(err, data) {
    if (err) {
        console.log();
        console.log('Prompt canceled. Aborting...');

        return;
    }

    console.log('Method : ' + data.method);
    console.log('URL    : ' + data.address);
    console.log('Headers: ', data.headers);
    console.log('Body   : ', data.body);

    // Start request.
    request({
        method: data.method,
        uri: data.address,
        headers: data.headers.reduce(function (total, current) {
            var splitted = current.split(' ');
            total[splitted[0]] = splitted[1];

            return total;
        }, {}),
        body: (data.body != '') ? JSON.parse(data.body) : {},
        json: true
    }, function(err, res, body) {
        if (err) {
            console.log('ERROR: ' + err);

            return;
        }

        console.log('Received response...');
        console.log(' Status code: ' + res.statusCode);

        var prompt_schema = {
            properties: {
                display: {
                    before: function(value) {
                        if (value === 'yes' || value === 'y' || value === 'Y') {
                            return true;
                        } else {
                            return false;
                        }
                    },
                    description: colors.white('Would you like to display body? (yes/no)'),
                    required: true,
                    type: 'string'
                }
            }
        };

        prompt.delimiter = '';

        prompt.start();

        prompt.get(prompt_schema, function(err, data) {
            if (data.display && !err) {
                console.log('Body:');
                console.log(body);
            }
        });
    });
});
