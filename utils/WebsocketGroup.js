const crypto = require ( 'crypto' );
const { redis } = require ( 'eip-cloud-services' );

class WebsocketGroup {
    
    constructor ( groupName, destroy, messageReceivedHandler, connectionClosedHandler ) {
        this.timeOfCreation = Date.now ();
        this.groupName = groupName;
        this.destroy = destroy;
        this.groupUuid = crypto.randomUUID ().substring ( 0, 8 );
        this.connections = new Map ();
        this.messageReceivedHandler = messageReceivedHandler || ( async () => {} );
        this.connectionClosedHandler = connectionClosedHandler;
    }

    async initialize () {
        try {
            await redis.subscribe ( `${this.groupName}_individualMessage`, this.#handleIndividualMessage.bind ( this ) );
            await redis.subscribe ( `${this.groupName}_broadcast`, this.#broadcastMessageToClients.bind ( this ) );
            await redis.subscribe ( `${this.groupName}_messageReceived`, this.#handleUserMessage.bind ( this ) );
        }
        catch ( error ){
            console.error ( error );
        }
    }
    
    async #handleUserMessage ( jsonMessage ) {
        const userMessage = JSON.parse ( jsonMessage );
        await this.messageReceivedHandler ( userMessage );
    }

    #broadcastMessageToClients ( message ) {
        this.connections.forEach ( conn => {
            conn.socket.send ( typeof message === 'string' ? message : JSON.stringify ( message ) );
        } );
    }

    #handleIndividualMessage ( individualMessage ) {
        const { connectionId, message } = JSON.parse ( individualMessage );
        if(this.connections.has(connectionId)) {
            this.connections.get(connectionId).socket.send(message);
        }
    }

    getConnections () {
        return this.connections;
    }

    individualMessage ( connectionId, message ) {
        redis.publish ( `${this.groupName}_individualMessage`, JSON.stringify ( { connectionId, message } ) );
    }  

    broadcastMessage ( message ) {
        redis.publish ( `${this.groupName}_broadcast`, JSON.stringify ( message ) );
    }

    addNewConnection ( connection, connectionId = crypto.randomUUID () ) {
        this.connections.set ( connectionId, connection );

        connection.socket.on ( 'message', async message => {
            const userMessage = {
                groupName: this.groupName,
                connectionId,
                message: message.toString ()
            };
            await redis.publish ( `${this.groupName}_messageReceived`, JSON.stringify ( userMessage ) );
        } );
        
        connection.socket.on ( 'close', () => {
            this.connections.delete ( connectionId );
            this.#clean(connectionId);
        } );
        
        connection.socket.on ( 'error', error => {
            console.error ( 'WebSocket error:', error );
            this.connections.delete ( connectionId );
            this.#clean(connectionId);
        } );

        return { connectionId, groupName: this.groupName, connection };
    }

    async #clean (connectionId) {

        if ( this.connectionClosedHandler !== null && typeof this.connectionClosedHandler === 'function') {
            try{
                await this.connectionClosedHandler ( {groupName:this.groupName, connectionId} );
            }
            catch (error) {
                console.error('Error in connectionClosedHandler:', error);
            }
        }

        if ( this.connections.size === 0 ) {
            this.connections.clear ();
            await redis.unsubscribe ( `${this.groupName}_individualMessage` );
            await redis.unsubscribe ( `${this.groupName}_broadcast` );
            await redis.unsubscribe ( `${this.groupName}_messageReceived` );
            this.destroy(this.groupName);
        }
    }
}
  
module.exports = WebsocketGroup;