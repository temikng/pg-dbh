const env = process.env;
const Koa = require('koa');
const pg = require('pg');
const Router = new require('koa-router')();
const pgDbhInit = require('./../index');

const App = new Koa();
const debug = env.NODE_ENV !== 'production';
const port = env.PORT || 3000;

let paramsDbConnect = {
	onError: (err) => {
		console.error(err);
		process.exit(1);
	}
};
if (debug) {
	//TODO: use winston logger instead of console
	paramsDbConnect.logger = console.log.bind(console);
}

/**
 * initialize pool connection to postgresql database with params
 */
App.context.dbh = pgDbhInit(pg, {connectionString: 'postgresql://user:123@server.db.ru:5432/test'}, paramsDbConnect);

/**
 * example route
 */
Router.post('/:uid', async (ctx) => {
	const uid = ctx.params.uid;

	/**
	 * exec sql and return result to client
	 */
	ctx.body = await ctx.dbh(async (db) => {
		/**
		 * get one row of user by received uid
		 */
		const rowUser = await db.SelectRowByKey('* FROM sec.users', { id: uid });
		if (!rowUser) {
			//TODO: throw error to the client
		}

		try {
			/**
			 * begin transaction to update and insert data
			 */
			return await db.Transaction(async (db) => {

				/**
				 * insert new row with check returning id
				 */
				const newRequestId = await db.checkInsert('log.requests RETURNING id', {user_id: uid});

				const count = Number(rowUser.count) + 1;
				/**
				 * update row with check updated count rows
				 */
				await db.checkUpdate('sec.users', {id: uid}, {count});

				return {success: true, new_id: newRequestId, count};
			});
		} catch (err) {

			return {success: false};
		}
	});
});

/**
 * middleware log routes
 */
App.use(async (ctx, next) => {
	await next();
	console.log(`${ctx.req.method} ${ctx.req.url} ${ctx.res.statusCode}`);
});
App.use(Router.routes());
//TODO: add handler routes error

App.listen(port, () => {
	console.log(`Server start listening on ${port}`);
});