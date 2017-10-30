'use strict';

import dom from 'metal-dom';
import DragDrop from '../src/DragDrop';
import DragShim from '../src/helpers/DragShim';
import DragTestHelper from './fixtures/DragTestHelper';

describe('DragDrop', function() {
	var dragDrop;
	var item;
	var target;
	var target2;

	beforeEach(function() {
		// Temporary workaround for https://github.com/metal/metal.js/issues/287
		DragDrop.hasConfiguredState_ = false;

		var html = '<div class="item" style="height:50px;width:50px;"></div><div class="target"></div>';
		dom.append(document.body, html);

		item = document.querySelector('.item');
		target = document.querySelector('.target');
		target.style.position = 'absolute';
		target.style.top = '10px';
		target.style.left = '20px';
		target.style.height = '100px';
		target.style.width = '200px';

		target2 = target.cloneNode(true);
		target2.style.left = '250px';
		dom.append(document.body, target2);

		DragShim.reset();
	});

	afterEach(function() {
		document.body.innerHTML = '';
		dragDrop.dispose();
	});

	it('should add "targetOver" class when dragged element is on top of target', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: target
		});
		assert.ok(!dom.hasClass(target, 'targetOver'));

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		assert.ok(!dom.hasClass(target, 'targetOver'));

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 50);
		assert.ok(dom.hasClass(target, 'targetOver'));

		DragTestHelper.triggerMouseEvent(document, 'mouseup');
		assert.ok(!dom.hasClass(target, 'targetOver'));
	});

	it('should add class defined by "targetOverClass" when dragged element is on top of target', function() {
		dragDrop = new DragDrop({
			sources: item,
			targetOverClass: 'myOverClass',
			targets: target
		});
		assert.ok(!dom.hasClass(target, 'myOverClass'));

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		assert.ok(!dom.hasClass(target, 'myOverClass'));

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 50);
		assert.ok(dom.hasClass(target, 'myOverClass'));

		DragTestHelper.triggerMouseEvent(document, 'mouseup');
		assert.ok(!dom.hasClass(target, 'myOverClass'));
	});

	it('should not add target class to target if mouse is not moved over it', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: target
		});

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 5, 10);
		assert.ok(!dom.hasClass(target, 'targetOver'));
	});

	it('should add "targetOver" class on correct target when there are multiple', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: '.target'
		});

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 50);
		assert.ok(dom.hasClass(target, 'targetOver'));
		assert.ok(!dom.hasClass(target2, 'targetOver'));

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 260, 50);
		assert.ok(!dom.hasClass(target, 'targetOver'));
		assert.ok(dom.hasClass(target2, 'targetOver'));
	});

	it('should ignore targets that match selector but are outside the given "container"', function() {
		var parent = document.createElement('div');
		dom.replace(target, parent);
		dom.append(parent, target);

		dragDrop = new DragDrop({
			container: parent,
			sources: item,
			targets: '.target'
		});

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 50);
		assert.ok(dom.hasClass(target, 'targetOver'));
		assert.ok(!dom.hasClass(target2, 'targetOver'));

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 260, 50);
		assert.ok(!dom.hasClass(target, 'targetOver'));
		assert.ok(!dom.hasClass(target2, 'targetOver'));
	});

	it('should update elements that match "targets" selector when "container" is changed', function() {
		var parent = document.createElement('div');
		dom.replace(target, parent);
		dom.append(parent, target);

		var parent2 = document.createElement('div');
		dom.replace(target2, parent2);
		dom.append(parent2, target2);

		dragDrop = new DragDrop({
			container: parent,
			sources: item,
			targets: '.target'
		});
		assert.deepEqual([target], dragDrop.targets);

		dragDrop.container = parent2;
		assert.deepEqual([target2], dragDrop.targets);
	});

	it('should change target that was given as element when "container" is changed', function() {
		dragDrop = new DragDrop({
			container: parent,
			sources: item,
			targets: target
		});
		assert.deepEqual([target], dragDrop.targets);

		dragDrop.container = document.createElement('div');
		assert.deepEqual([target], dragDrop.targets);
	});

	it('should trigger "targetEnter" event when mouse enters target', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: '.target'
		});

		var listener = sinon.stub();
		dragDrop.on(DragDrop.Events.TARGET_ENTER, listener);

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 50);
		assert.strictEqual(1, listener.callCount);
		assert.strictEqual(target, listener.args[0][0].target);
		assert.deepEqual([target], listener.args[0][0].allActiveTargets);

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 260, 50);
		assert.strictEqual(2, listener.callCount);
		assert.strictEqual(target2, listener.args[1][0].target);
		assert.deepEqual([target2], listener.args[1][0].allActiveTargets);

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 5, 10);
		assert.strictEqual(2, listener.callCount);

	});

	it('should trigger "targetLeave" event when mouse leaves target', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: '.target'
		});

		var listener = sinon.stub();
		dragDrop.on(DragDrop.Events.TARGET_LEAVE, listener);

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 50);
		assert.strictEqual(0, listener.callCount);

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 260, 50);
		assert.strictEqual(1, listener.callCount);
		assert.strictEqual(target, listener.args[0][0].target);
		assert.deepEqual([target], listener.args[0][0].allActiveTargets);

		DragTestHelper.triggerMouseEvent(document, 'mousemove', 5, 10);
		assert.strictEqual(2, listener.callCount);
		assert.strictEqual(target2, listener.args[1][0].target);
		assert.deepEqual([target2], listener.args[1][0].allActiveTargets);
	});

	it('should trigger "targetEnter" event when source is over target via keyboard controls', function() {
		dragDrop = new DragDrop({
			keyboardSpeed: 100,
			sources: item,
			targets: '.target'
		});

		var listener = sinon.stub();
		dragDrop.on(DragDrop.Events.TARGET_ENTER, listener);

		DragTestHelper.triggerKeyEvent(item, 13);
		DragTestHelper.triggerKeyEvent(item, 39);
		DragTestHelper.triggerKeyEvent(item, 40);
		assert.strictEqual(1, listener.callCount);
		assert.strictEqual(target, listener.args[0][0].target);
		assert.deepEqual([target], listener.args[0][0].allActiveTargets);

		DragTestHelper.triggerKeyEvent(item, 39);
		DragTestHelper.triggerKeyEvent(item, 39);
		assert.strictEqual(2, listener.callCount);
		assert.strictEqual(target2, listener.args[1][0].target);
		assert.deepEqual([target2], listener.args[1][0].allActiveTargets);
	});

	it('should trigger "targetLeave" event when source leaves target via keyboard controls', function() {
		dragDrop = new DragDrop({
			keyboardSpeed: 100,
			sources: item,
			targets: '.target'
		});

		var listener = sinon.stub();
		dragDrop.on(DragDrop.Events.TARGET_LEAVE, listener);

		DragTestHelper.triggerKeyEvent(item, 13);
		DragTestHelper.triggerKeyEvent(item, 39);
		DragTestHelper.triggerKeyEvent(item, 40);
		assert.strictEqual(0, listener.callCount);

		DragTestHelper.triggerKeyEvent(item, 39);
		DragTestHelper.triggerKeyEvent(item, 39);
		assert.strictEqual(1, listener.callCount);
		assert.strictEqual(target, listener.args[0][0].target);
		assert.deepEqual([target], listener.args[0][0].allActiveTargets);
	});

	it('should add targets dynamically', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: '.target'
		});
		assert.strictEqual(2, dragDrop.targets.length);

		var newTarget = target.cloneNode(true);
		newTarget.style.top = '250px';
		dom.enterDocument(newTarget);
		assert.strictEqual(2, dragDrop.targets.length);

		dragDrop.addTarget(newTarget);
		assert.strictEqual(3, dragDrop.targets.length);

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 260);
		assert.ok(dom.hasClass(newTarget, 'targetOver'));
	});

	it('should remove targets dynamically', function() {
		dragDrop = new DragDrop({
			sources: item,
			targets: '.target'
		});
		assert.strictEqual(2, dragDrop.targets.length);

		dragDrop.removeTarget(target);
		assert.strictEqual(1, dragDrop.targets.length);

		DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
		DragTestHelper.triggerMouseEvent(document, 'mousemove', 40, 260);
		assert.ok(!dom.hasClass(target, 'targetOver'));
	});

	describe('Multiple Targets', function() {
		var nestedTarget;
		var intersectTarget;

		beforeEach(function() {
			nestedTarget = target.cloneNode(true);
			nestedTarget.style.left = '50px';
			nestedTarget.style.top = '50px';
			nestedTarget.style.height = '50px';
			nestedTarget.style.width = '50px';
			dom.append(target, nestedTarget);

			intersectTarget = target.cloneNode(true);
			intersectTarget.style.left = '150px';
			intersectTarget.style.top = '50px';
			dom.append(document.body, intersectTarget);
		});

		it('should indicate all active targets in the "targetEnter" event', function() {
			dragDrop = new DragDrop({
				sources: item,
				targets: '.target'
			});

			var listener = sinon.stub();
			dragDrop.on(DragDrop.Events.TARGET_ENTER, listener);

			DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
			DragTestHelper.triggerMouseEvent(document, 'mousemove', 160, 60);
			assert.strictEqual(1, listener.callCount);
			assert.strictEqual(target, listener.args[0][0].target);
			assert.deepEqual([target, intersectTarget], listener.args[0][0].allActiveTargets);
		});

		it('should consider nested target as the main active target', function() {
			dragDrop = new DragDrop({
				sources: item,
				targets: '.target'
			});

			var listener = sinon.stub();
			dragDrop.on(DragDrop.Events.TARGET_ENTER, listener);

			DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
			DragTestHelper.triggerMouseEvent(document, 'mousemove', 80, 80);
			assert.strictEqual(1, listener.callCount);
			assert.strictEqual(nestedTarget, listener.args[0][0].target);
			assert.deepEqual([nestedTarget, target], listener.args[0][0].allActiveTargets);
		});

		it('should set "aria-dropeffect" attribute on targets during drag', function() {
			dragDrop = new DragDrop({
				ariaDropEffect: 'move',
				sources: item,
				targets: '.target'
			});
			assert.ok(!target.getAttribute('aria-dropeffect'));
			assert.ok(!target2.getAttribute('aria-dropeffect'));

			DragTestHelper.triggerMouseEvent(item, 'mousedown', 0, 0);
			assert.ok(!target.getAttribute('aria-dropeffect'));
			assert.ok(!target2.getAttribute('aria-dropeffect'));

			DragTestHelper.triggerMouseEvent(document, 'mousemove', 10, 10);
			assert.strictEqual('move', target.getAttribute('aria-dropeffect'));
			assert.strictEqual('move', target2.getAttribute('aria-dropeffect'));

			DragTestHelper.triggerMouseEvent(document, 'mouseup');
			assert.ok(!target.getAttribute('aria-dropeffect'));
			assert.ok(!target2.getAttribute('aria-dropeffect'));
		});
	});
});
