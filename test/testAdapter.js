const expect = require('chai').expect;
const setup = require('@iobroker/legacy-testing');
const { start, stop } = require('./slave');

let objects = null;
let states = null;
let onStateChanged = null;
let modbusValues = null;

const adapterShortName = setup.adapterName.substring(setup.adapterName.indexOf('.') + 1);

function checkConnectionOfAdapter(cb, counter) {
    counter ||= 0;
    console.log(`Try check #${counter}`);
    if (counter > 30) {
        cb?.('Cannot check connection');
        return;
    }

    states.getState(`system.adapter.${adapterShortName}.0.alive`, (err, state) => {
        if (err) {
            console.error(err);
        }
        if (state?.val) {
            cb?.();
        } else {
            setTimeout(() => checkConnectionOfAdapter(cb, counter + 1), 1000);
        }
    });
}

function readState(id) {
    return new Promise((resolve, reject) => {
        states.getState(id, (err, state) => {
            if (err) {
                return reject(err);
            }
            resolve(state);
        });
    });
}

function waitAsync(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkValue(id, expectedValue, maxTries) {
    let counter = 0;
    maxTries ||= 10;
    for (let i = 0; i < maxTries; i++) {
        const value = await readState(id);
        if (value?.ack && value.val === expectedValue) {
            return;
        }
        counter++;
        console.log(`Value of ${id} is ${value?.val}, expected ${expectedValue}. Try ${counter}`);
        await waitAsync(500);
    }
    throw new Error(`Value of ${id} is not ${expectedValue} after ${maxTries} tries`);
}

describe(`Test ${adapterShortName} adapter`, function () {
    before(`Test ${adapterShortName} adapter: Start js-controller`, function (_done) {
        this.timeout(600000); // because of the first installation from npm

        setup.setupController(async () => {
            const config = await setup.getAdapterConfig();
            // enable adapter
            config.common.enabled = true;
            config.common.loglevel = 'debug';
            config.native.params = {
                port: 1502,
                host: 'localhost',
            };

            await setup.setAdapterConfig(config.common, config.native);

            // Start Modbus server
            modbusValues = start(1502);

            setup.startController(
                true,
                () => {},
                (id, state) => {
                    if (onStateChanged) {
                        onStateChanged(id, state);
                    }
                },
                (_objects, _states) => {
                    objects = _objects;
                    states = _states;
                    _done();
                },
            );
        });
    });

    it(`Test ${adapterShortName} adapter: Check if adapter started`, function (done) {
        this.timeout(60000);
        checkConnectionOfAdapter(res => {
            if (res) {
                console.log(res);
            }
            expect(res).not.to.be.equal('Cannot check connection');
            objects.setObject(
                'system.adapter.test.0',
                {
                    common: {},
                    type: 'instance',
                },
                () => {
                    states.subscribeMessage('system.adapter.test.0');
                    done();
                },
            );
        });
    });

    it.only(`Test connection to server`, async function () {
        this.timeout(10000);
        await checkValue(`${adapterShortName}.0.info.connection`, true, 10);
    });

    it.only(`Test values`, async function () {
        this.timeout(10000);
        await checkValue(`${adapterShortName}.0.data.Frequency`, modbusValues.Frequency * 100, 10);
        await checkValue(`${adapterShortName}.0.data.CurrentTotal`, modbusValues.CurrentTotal * 100, 10);
        await checkValue(`${adapterShortName}.0.data.MeterModel`, modbusValues.MeterModel, 10);
    });

    after(`Test ${adapterShortName} adapter: Stop js-controller`, function (done) {
        this.timeout(10000);

        setup.stopController(normalTerminated => {
            // Stop Modbus server
            stop();

            console.log(`Adapter normal terminated: ${normalTerminated}`);
            done();
        });
    });
});
