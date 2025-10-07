const { server } = require('jsmodbus');
const { Server } = require('node:net');
const tsv2registers = require('@iobroker/modbus/build/convert');

const registers = tsv2registers.default('holdingRegs', `${__dirname}/../data/holding-registers.tsv`);
let netServer;
let modbusServer;

function start(port = 502) {
    netServer = new Server();
    modbusServer = new server.TCP(netServer);

    registers.forEach((register, i) => {
        const address = parseInt(register._address, 10) - 40001;
        if (register.type === 'uint32be') {
            modbusServer.holding.writeUInt32BE(i + 1, address * 2);
        } else if (register.type === 'uint16be') {
            modbusServer.holding.writeUInt16BE(i + 1, address * 2);
        } else if (register.type === 'string') {
            // Create a string with length of register.len
            const str = `Str${i + 1}`.padEnd(register.len - 1, '-');
            for (let j = 0; j < str.length; j++) {
                modbusServer.holding.writeUInt8(str.charCodeAt(j), address * 2 + j, 10);
            }
        }
    });

    netServer.listen(port, '0.0.0.0', () => {
        console.log(`Modbus TCP server listening on port ${port}`);
    });
}

function stop() {
    if (modbusServer) {
        modbusServer.close(() => {
            if (netServer) {
                netServer.close();
            }
        });
    } else if (netServer) {
        netServer.close();
    }
}
if (require.main === module) {
    start();
} else {
    module.exports = {
        start,
        stop,
    }
}
