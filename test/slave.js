const { server } = require('jsmodbus');
const { Server } = require('node:net');
const tsv2registers = require('@iobroker/modbus/build/convert');

const registers = tsv2registers.default('holdingRegs', `${__dirname}/../data/holding-registers.tsv`);
let netServer;
let modbusServer;

function start(port = 502) {
    netServer = new Server();
    modbusServer = new server.TCP(netServer);
    const modbusValues = {};

    registers.forEach((register, i) => {
        const address = parseInt(register._address, 10) - 40001;

        // Scale factor
        if (register.name.endsWith('SF')) {
            console.log(`Write Scale Factor 2 to address ${register._address} / ${register.name}`);
            modbusServer.holding.writeInt16BE(2, address * 2);
            modbusValues[register.name] = 2;
            return;
        }

        if (register.type === 'uint32be') {
            console.log(`Write uint32be ${i + 1} to address ${register._address} / ${register.name}`);
            modbusServer.holding.writeUInt32BE(i + 1, address * 2);
            modbusValues[register.name] = i + 1;
        } else if (register.type === 'int32be') {
            console.log(`Write int32be ${i + 1} to address ${register._address} / ${register.name}`);
            modbusServer.holding.writeInt32BE(i + 1, address * 2);
            modbusValues[register.name] = i + 1;
        } else if (register.type === 'uint16be') {
            console.log(`Write uint32be ${i + 1} to address ${register._address} / ${register.name}`);
            modbusServer.holding.writeUInt16BE(i + 1, address * 2);
            modbusValues[register.name] = i + 1;
        } else if (register.type === 'int16be') {
            console.log(`Write int16be ${i + 1} to address ${register._address} / ${register.name}`);
            modbusServer.holding.writeInt16BE(i + 1, address * 2);
            modbusValues[register.name] = i + 1;
        } else if (register.type === 'string') {
            // Create a string with length of register.len
            const str = `Str${i + 1}`.padEnd(register.len - 1, '-');
            console.log(`Write string ${str} to address ${register._address} / ${register.name}`);
            for (let j = 0; j < str.length; j++) {
                modbusServer.holding.writeUInt8(str.charCodeAt(j), address * 2 + j, 10);
            }
            modbusValues[register.name] = str;
        }
    });

    netServer.on('connection', (socket) => {
        console.log('New connection from', socket.remoteAddress, 'Port', socket.remotePort);

        socket.on('error', (err) => {
            if (err.code === 'ECONNRESET') {
                console.warn('ECONNRESET on Socket:', err.message);
            } else {
                console.error('Socket-error:', err);
            }
        });
    });

    netServer.listen(port, '0.0.0.0', () => {
        console.log(`Modbus TCP server listening on port ${port}`);
    });
    netServer.on('error', err => {
        console.error('Modbus TCP Server Error:', err);
    });
    return modbusValues;
}

function stop() {
    try {
        netServer?.close(() => {
            console.log('Server wurde geschlossen.');
        });
    } catch (e) {
        console.error('Cannot close server', e);
    }
}
if (require.main === module) {
    const modbusValues = start();
    console.log(JSON.stringify(modbusValues, null, 2));
} else {
    module.exports = {
        start,
        stop,
    };
}
