import ModbusTemplate, { tsv2registers } from '@iobroker/modbus';
import type { AdapterOptions } from '@iobroker/adapter-core';
import { readFileSync } from 'node:fs';
const adapterName = JSON.parse(readFileSync(`${__dirname}/../io-package.json`, 'utf8')).common.name;

export class ModbusAdapter extends ModbusTemplate {
    public constructor(options: Partial<AdapterOptions> = {}) {
        const holdingRegs = tsv2registers('holdingRegs', `${__dirname}/../data/holding-registers.tsv`);

        super(adapterName, options, {
            // Do not show addresses in the object IDs
            doNotIncludeAdrInId: true,
            // Remove the leading "_" in the names
            removeUnderscorePrefix: true,
        }, { holdingRegs });
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
