/**
 * This is the Singleton, this is shared across entire app
 *
 * @class Singleton
 * @constructor
 */
class Singleton {
    constructor() {
        this.instance = {};
    }
    /**
    * Get current instance from the singleton
    *
    * @method getInstance
    * @return {Object} Returns current singleton instance
    */
    static getInstance() {
        if (!this.instance) {
            this.instance = {};
        }
        return this.instance;
    }
}

module.exports = Singleton;
