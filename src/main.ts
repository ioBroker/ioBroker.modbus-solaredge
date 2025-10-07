import ModbusTemplate, { tsv2registers } from '@iobroker/modbus';
import type { AdapterOptions } from '@iobroker/adapter-core';
import { readFileSync } from 'node:fs';
const adapterName = JSON.parse(readFileSync(`${__dirname}/../io-package.json`, 'utf8')).common.name;

export class ModbusAdapter extends ModbusTemplate {
    public constructor(options: Partial<AdapterOptions> = {}) {
        const holdingRegs = tsv2registers('holdingRegs', `${__dirname}/../data/holding-registers.tsv`);
        holdingRegs.forEach(holdingReg => {
            holdingReg._address = parseInt(holdingReg._address as string, 10) - 40001;
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
                // Do not show addresses in the object IDs
                doNotIncludeAdrInId: true,
                // Remove the leading "_" in the names
                removeUnderscorePrefix: true,
                // Do not show aliases, because we don't want to see addresses
                showAliases: false,
                // Remove holdingRegister (and so on) from name
                registerTypeInName: 'data',
            },
            { holdingRegs },
        );
    }
}

// If started as allInOne mode => return function to create instance
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<AdapterOptions> | undefined) => new ModbusAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new ModbusAdapter())();
}
