const { Pool } = require('pg');

const dbRoot = require('./libs/db-root');
const dbFunctions = require('./libs/db-functions');

module.exports = initPool;

/**
 * Initialize holder postgresql pool connection
 * with useful functions
 * @param connectionConfig
 * @param params
 * @returns {function(*)}
 */
function initPool (connectionConfig, params = {}) {
	const pool = new Pool(connectionConfig);

	pool.on('error', params.onError || function (err) {
		console.error('PG-DBH ERROR:', err);
	});

	/**
	 * to connect pool
	 * @param callback
	 * @returns {Promise.<*>}
	 */
	let dbh = async (callback) => {
		const client = await pool.connect();
		if(!client.extPrepared) {
			client.extPrepared = {};
			client.preperedCnt = 0;
			//set custom init here!
		}
		try {
			return await callback(getDbForClient(client, params.logger));
		} finally {
			client.release();
		}
	};

	/**
	 * to connect pool with execute dbFunction
	 * @returns {Promise.<*>}
	 */
	appendFastExecDbFunctionsToDbh(dbh);

	/**
	 * to shut down a pool
	 * @returns {Promise.<void>}
	 */
	dbh.end = async () => {
		return await pool.end();
	};

	return dbh;
}

function getDbForClient(client, logger) {
	return Object.assign({ client, logger }, dbRoot, dbFunctions);
}

function appendFastExecDbFunctionsToDbh (dbh) {
	for (let key in dbFunctions) {
		if (!dbFunctions.hasOwnProperty(key)) continue;
		dbh[key] = async (...args) => {
			return await dbh(async (db) => {
				return await db[key](...args);
			});
		}
	}
}