module.exports = {

	noValues: {},

	Rollback () { throw this.noValues },

	formatError (x, q) {
		return x + '\n in ' + q.text + '\n with ' + JSON.stringify(q.values);
	},
	log (...args) {
		this.logger && this.logger(...args);
	},

	async internalExec (query, values) {
		if(!values || Array.isArray(values) && !values.length) throw `no values for prepares statement ${query}`;
		if(!this.client.extPrepared[query]) {
			this.client.extPrepared[query] = ++this.client.preperedCnt;
		}
		query = {
			name: 'q_' + this.client.extPrepared[query],
			text: query,
			values: values === this.noValues ? []
				: Array.isArray(values) ? values
					: [ values ]
		};

		this.log(`EXECUTING QUERY:\n${query.text}\nWITH ${JSON.stringify(query.values,null,2)}`);

		return await this.client.query(query);
	},
	async internalSelect (query, values) {
		if (!query.match(/^\s*SELECT|^\s*WITH\s/)) query = 'SELECT ' + query;
		return await this.internalExec(query, values);
	},

	__splitMap(kv, args) {
		let keys = [];
		let vals = [];
		args = args || [];
		for(let i in kv) {
			if (!kv.hasOwnProperty(i)) continue;
			keys.push(i);
			args.push(kv[i]);
			vals.push('$' + args.length);
		}
		return {k: keys, v: vals, a: args};
	},
	__makeCond(keys, args) {
		let wkv = this.__splitMap(keys, args);
		return wkv.k.map((k,i) => k + ' = ' + wkv.v[i]).join(' AND ');
	}
};