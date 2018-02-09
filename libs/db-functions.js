module.exports = {

	async Exec(query, values) {
		//TODO: add formatError for error
		return await this.internalExec(query, values);
	},

	async SelectAll(query, values) {
		let result = await this.internalSelect(query, values);
		return result.rows;
	},
	async SelectRow(query, values) {
		return (await this.SelectAll(query, values))[0];
	},
	async SelectValue(query, values) {
		let rows = await this.SelectAll(query, values);
		if(!rows[0]) return null;
		for (let i in rows[0]) return rows[0][i];
		return null;
	},

	async SelectRowByKey(query, keys) {
		let a = [];
		return await this.SelectRow(`${query} WHERE ${this.__makeCond(keys, a)} LIMIT 1`, a);
	},
	async SelectValueByKey(query, keys) {
		let a = [];
		return await this.SelectValue(`${query} WHERE ${this.__makeCond(keys, a)} LIMIT 1`, a);
	},

	async Insert(table, values) {
		let rt = '';
		if(table.match(/^\s*(\S+)\s+(RETURNING\s+.*)/)) {
			rt = RegExp.$2;
			table = RegExp.$1;
		}
		let kva = this.__splitMap(values);
		let query = `INSERT INTO ${table} ( ${kva.k} ) VALUES ( ${kva.v} ) ${rt}`;
		let result = await this.Exec(query, kva.a);
		if(!result.rows[0]) return null;
		for (let i in result.rows[0]) return result.rows[0][i];
		return null;
	},
	async checkInsert(table, values) {
		if (!table.includes('RETURNING')) throw new Error('Required set RETURNING column');
		let resultInsert = await this.Insert(table, values);
		this.log('check result Insert', resultInsert);
		if (!resultInsert || resultInsert <= 0) throw Error('Insert error ' + resultInsert);
		return resultInsert;
	},

	async Update(table, keys, values) {
		let kva = this.__splitMap(values);
		let query = `UPDATE ${table} SET ${kva.k.map((k,i) => k + ' = ' + kva.v[i])} WHERE ${this.__makeCond(keys, kva.a)}`;
		return await this.Exec(query, kva.a);
	},
	async checkUpdate(table, keys, values) {
		let resultUpdate = await this.Update(table, keys, values);
		this.log('check result Update', resultUpdate);
		if (resultUpdate.rowCount <= 0) throw Error('Update error ' + resultUpdate);
		return resultUpdate.rowCount;
	},

	async Delete(table, keys) {
		let a = [];
		let query = `DELETE FROM ${table} WHERE ${this.__makeCond(keys, a)}`;
		return await this.Exec(query, a);
	},
	async checkDelete(table, keys) {
		let resultDelete = await this.Delete(table, keys);
		this.log('check result Delete', resultDelete);
		if (resultDelete.rowCount <= 0) throw Error('Delete error ' + resultDelete);
		return resultDelete.rowCount;
	},

	async Transaction(cb) {
		let result;
		await this.client.query('BEGIN');
		try {
			result = await cb(this);
			await this.client.query('COMMIT');
		} catch (err) {
			await this.client.query('ROLLBACK');
			if (err !== this.noValues) throw err;
		}
		return result;
	}
};