const api = require ( '../api' );
const chai = require ( 'chai' );
const chaiAsPromised = require ( 'chai-as-promised' );
chai.use ( chaiAsPromised );
const { expect } = chai;

describe ( 'API Unit Tests', () => {
    describe ( 'API User functionality', () => {
        it ( 'Should successfully start and return a HTTP Server ', async () => {
            const server = await api ( { docRoot: './example/routes' } );
            expect ( server.addresses () ).to.be.an ( 'array' );
        } );
        it ( 'Should fail to start a HTTP Server ', async () => {
            await expect ( api () ).to.be.rejectedWith ( Error );
        } );
    } );
} );