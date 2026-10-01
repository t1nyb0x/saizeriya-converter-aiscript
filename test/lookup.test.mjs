import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter, Parser, utils } from '@syuilo/aiscript';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const core = read('../src/menu.is') + '\n' + read('../src/lookup.is');

// menu.is + lookup.is のあとに code を実行し、print された値を JS の値で返す
async function run(code) {
	const out = [];
	const interpreter = new Interpreter({}, {
		out: (v) => out.push(utils.valToJs(v)),
		err: (e) => { throw e; },
	});
	await interpreter.exec(Parser.parse(core + '\n' + code));
	return out;
}

test('normalize: 前後の空白を取り除く', async () => {
	assert.deepEqual(await run('<: normalize("  2101 ")'), ['2101']);
});

test('normalize: 全角数字と全角スペースを半角にそろえる', async () => {
	assert.deepEqual(await run('<: normalize("　２１０１　")'), ['2101']);
});

test('lookup: 既知の番号はメニューを返す', async () => {
	assert.deepEqual(await run('<: lookup("2101")'), [{ name: 'ミラノ風ドリア', price: 300 }]);
});

test('lookup: 存在しない番号は null を返す', async () => {
	assert.deepEqual(await run('<: lookup("9999")'), [null]);
});

test('format: 番号 名前 価格 の順で書く', async () => {
	assert.deepEqual(
		await run('<: format("2101", { name: "ミラノ風ドリア", price: 300 })'),
		['2101 ミラノ風ドリア 300円（税込）'],
	);
});

test('describe: 全角で入力しても見つかる', async () => {
	assert.deepEqual(await run('<: describe("１２０２")'), ['1202 小エビのサラダ 350円（税込）']);
});

test('describe: 見つからない番号はその旨を返す', async () => {
	assert.deepEqual(await run('<: describe("9999")'), ['9999 はメニューにありませんでした']);
});

test('describe: 空入力は空文字を返す', async () => {
	assert.deepEqual(await run('<: describe("  ")'), ['']);
});

test('MENU: すべての番号が4桁で、名前は文字列、価格は正の数', async () => {
	const [menu] = await run('<: MENU');
	const entries = Object.entries(menu);
	assert.ok(entries.length > 0);
	for (const [code, item] of entries) {
		assert.match(code, /^\d{4}$/, `番号の形式: ${code}`);
		assert.equal(typeof item.name, 'string', `名前: ${code}`);
		assert.ok(item.name.length > 0, `名前が空: ${code}`);
		assert.ok(Number.isInteger(item.price) && item.price > 0, `価格: ${code}`);
	}
});

test('dist/widget.is は構文エラーなくパースできる', () => {
	assert.doesNotThrow(() => Parser.parse(read('../dist/widget.is')));
});
