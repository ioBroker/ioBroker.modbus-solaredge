import ModbusTemplate, { tsv2registers } from '@iobroker/modbus';
import type { AdapterOptions } from '@iobroker/adapter-core';

export class ModbusAdapter extends ModbusTemplate {
    public constructor(options: Partial<AdapterOptions> = {}) {
        const holdingRegs = tsv2registers('holdingRegs', `${__dirname}/../data/holdingRegs.tsv`);

        super('modbus-solaredge', options, undefined, { holdingRegs });
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
