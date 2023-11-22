const crypto = require ( 'crypto' );
const { redis } = require ( 'eip-cloud-services' );

class WebsocketGroup {
    
    constructor ( groupName ) {
        this.groupName = groupName;
        this.connections = new Map ();
    }

    async initialize () {
        try {
            await redis.subscribe ( `${this.groupName}_broadcast`, this.handleMessage.bind ( this ) );
            await redis.subscribe ( `${this.groupName}_messageReceived`, this.handleUserMessage.bind ( this ) );
        }
        catch ( error ){
            console.log ( error );
        }
    }
    
    handleMessage ( message ) {
        this.broadcastMessageToClients ( message );
    }

    async handleUserMessage ( userMessage ) {
        // don't really need to do anything with this message.
    }

    broadcastMessageToClients ( message ) {
        this.connections.forEach ( conn => {
            conn.socket.send ( JSON.stringify ( message ) );
        } );
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
        } );
    
        connection.socket.on ( 'error', error => {
            console.error ( 'WebSocket error:', error );
            this.connections.delete ( connectionId );
        } );

        return { connectionId, groupName: this.groupName, connection };
    }
}
  
module.exports = WebsocketGroup;