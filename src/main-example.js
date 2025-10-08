const IoBrokerModbus = require ('@iobroker/modbus');
const { readFileSync } = require('node:fs');
const adapterName = JSON.parse(readFileSync(`${__dirname}/../io-package.json`, 'utf8')).common.name;

class ModbusAdapter extends IoBrokerModbus.default {
    constructor(options) {
        const holdingRegs = IoBrokerModbus.tsv2registers('holdingRegs', `${__dirname}/../data/holding-registers.tsv`);
        holdingRegs.forEach(holdingReg => {
            holdingReg._address = parseInt(holdingReg._address, 10) - 40001;
            if (holdingReg.formula) {
                const match = holdingReg.formula.match(/sf\['(\d+)']/);
                if (match) {
                    holdingReg.formula = holdingReg.formula.replace(
                        match[1],
                        (parseInt(match[1], 10) - 40001).toString(),
                    );
                }
            }
        });

        super(
            adapterName,
            options,
            {
                params: {
                    // Do not show addresses in the object IDs
                    doNotIncludeAdrInId: true,
                    // Remove the leading "_" in the names
                    removeUnderscorePrefix: true,
                    // Do not show aliases, because we don't want to see addresses
                    showAliases: false,
                    // Remove holdingRegister (and so on) from name
                    registerTypeInName: 'data',
                },
                holdingRegs,
            },
        );
    }
}

// If started as allInOne mode => return function to create instance
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = options => new ModbusAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new ModbusAdapter())();
}
