'use strict';

let Promise = require('bluebird');
let sonos = require('sonos');
let DeviceTunnel = require('./tunnel');


var PORT = 3000;


class AirSonos {

  constructor(options) {
    this.tunnels = {};
    this.options = options || {};

    this.options.port = PORT;
  }

  get searchForDevices() {
    return Promise.promisify(sonos.LogicalDevice.search);
  }

  start() {
    return this.searchForDevices().then((devices) => {
      let promises = devices.map((device) => {
        return DeviceTunnel.createFor(device, this.options).then((tunnel) => {

          tunnel.on('error', function(err) {
            if (err.code === 415) {
              console.error('Warning!', err.message);
              console.error('AirSonos currently does not support codecs used by applications such as iTunes or AirFoil.');
              console.error('Progress on this issue: https://github.com/stephen/nodetunes/issues/1');
            } else {
              console.error('Unknown error:');
              console.error(err);
            }
          });
          this.tunnels[tunnel.device.groupId] = tunnel;
          tunnel.start();
          return tunnel;
        });
      });

      return Promise.all(promises).then((tunnel) => {
        console.log('Tunnel: ' + tunnel.deviceName);
      });
    });
  }

  refresh() {
    return this.searchForDevices().then((devices) => {
      // remove old groups
      // add new groups
      // update existing groups with new configurations
    });
  }

  stop() {
    return Promise.all(this.tunnels.map(tunnel.stop));
  }
}

module.exports = AirSonos;