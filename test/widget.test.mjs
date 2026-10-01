import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter, Parser, utils, values } from '@syuilo/aiscript';

const widget = readFileSync(new URL('../dist/widget.is', import.meta.url), 'utf8');

// Misskey の Ui:C:* と Ui:render を最小限まねる。
// 部品は定義（def）を保持し、update で書き換えられた値を state に反映する
function createUiMock() {
	const components = [];
	const create = (type) => values.FN_NATIVE(([def]) => {
		const state = { type, def, props: Object.fromEntries(def.value) };
		components.push(state);
		return values.OBJ(new Map([
			['update', values.FN_NATIVE(([patch]) => {
				for (const [k, v] of patch.value) state.props[k] = v;
			})],
		]));
	});
	let rendered = null;
	const consts = {
		'Ui:C:text': create('text'),
		'Ui:C:textInput': create('textInput'),
		'Ui:C:button': create('button'),
		'Ui:render': values.FN_NATIVE(([children]) => { rendered = children; }),
	};
	const find = (type) => components.find((c) => c.type === type);
	return { consts, find, isRendered: () => rendered !== null };
}

async function setup() {
	const ui = createUiMock();
	const interpreter = new Interpreter(ui.consts, { err: (e) => { throw e; } });
	await interpreter.exec(Parser.parse(widget));
	const type = (text) => interpreter.execFn(ui.find('textInput').props.onInput, [values.STR(text)]);
	const click = () => interpreter.execFn(ui.find('button').props.onClick, []);
	const resultText = () => utils.valToJs(ui.find('text').props.text);
	return { ui, type, click, resultText };
}

test('ウィジェットが描画される', async () => {
	const { ui, resultText } = await setup();
	assert.ok(ui.isRendered());
	assert.equal(resultText(), '番号を入れて「調べる」を押してください');
});

test('番号を入れて調べるとメニューが表示される', async () => {
	const { type, click, resultText } = await setup();
	await type('2101');
	await click();
	assert.equal(resultText(), '2101 ミラノ風ドリア 300円（税込）');
});

test('存在しない番号を調べるとその旨が表示される', async () => {
	const { type, click, resultText } = await setup();
	await type('0000');
	await click();
	assert.equal(resultText(), '0000 はメニューにありませんでした');
});

test('何も入れずに調べると入力を促す', async () => {
	const { click, resultText } = await setup();
	await click();
	assert.equal(resultText(), '番号を入れてください');
});
