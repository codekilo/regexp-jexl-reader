const PLUGIN_ID = 'RegExp JEXL reader';

const pkgData = require('./package.json')
const jexl = require("jexl");

module.exports = function (app) {
  let onStop = []

  return {
    start: options => {
      app.debug(options)
      if (options.mappings) {

        options.mappings.forEach(mapping => {
          mapping.regex = new RegExp(mapping.pattern)
          if (mapping.calculations) {
            mapping.calculations.forEach(calculation => {
              calculation.jexl = jexl.compile(calculation.expression)
            });
          }
        });


        const send = message => {
          options.mappings.forEach(mapping => {
            let match = message.match(mapping.regex)
            if (match) {
              mapping.calculations.forEach(calculation => {
                app.debug(`Found match in ${match[0]} and applying ${calculation.expression}`)
                let value = calculation.jexl.evalSync({m: match})
                app.debug(`Calculated new value ${value} for path ${calculation.path}`)

                let delta = {
                  values: [{
                    path: calculation.path,
                    value: value
                  }],
                  context: app.getSelfPath('uuid'),
                  $source: mapping.pattern,
                  timestamp: new Date().toISOString()
                }
                app.handleMessage(PLUGIN_ID, {updates: [delta]});
              });
            }
          });
        }

        if (typeof options.nmea0183 === 'undefined' || options.nmea0183) {
          app.signalk.on('nmea0183', send)
          onStop.push(() => {
            app.signalk.removeListener('nmea0183', send)
          })
        }
        if (typeof options.nmea0183out === 'undefined' || options.nmea0183out) {
          app.on('nmea0183out', send)
          onStop.push(() => {
            app.removeListener('nmea0183out', send)
          })
        }
        app.setProviderStatus('Running')
      } else {
        app.setProviderStatus('No mappings defined')
      }
    },
    stop: () => {
      onStop.forEach(f => f())
      onStop = []
    },
    schema,
    id: PLUGIN_ID,
    name: pkgData.description
  }
}

function schema () {
  return {
    type: 'object',
    properties: {
      nmea0183: {
        type: 'boolean',
        title: 'Use server event nmea0183',
        default: true
      },
      nmea0183out: {
        type: 'boolean',
        title: 'Use server event nmea0183out',
        default: true
      },
      mappings: {
        type: 'array',
        title: 'Mappings:',
        items: {
          type: 'object',
          title: 'Mapping',
          properties: {
            pattern: {
              type: 'string',
              title: "Regular expression pattern"
            },
            calculations: {
              type: 'array',
              title: 'Calculations',
              items: {
                type: 'object',
                title: 'Calculation',
                properties: {
                  expression: {
                    type: 'string',
                    title: 'Expression'
                  },
                  path: {
                    type: 'string',
                    title: 'SignalK path'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
