import { Editor } from 'mobiledoc-kit';
import Helpers from '../test-helpers';
import Position from 'mobiledoc-kit/utils/cursor/position';

const { test, module } = Helpers;

const cards = [{
  name: 'my-card',
  type: 'dom',
  render() {},
  edit() {}
}];

const atoms = [{
  name: 'my-atom',
  type: 'dom',
  render() {
    return document.createTextNode('my-atom');
  }
}];

let editor, editorElement;

module('Acceptance: Cursor Position', {
  beforeEach() {
    editorElement = $('#editor')[0];
  },

  afterEach() {
    if (editor) { editor.destroy(); }
  }
});

test('cursor in a markup section reports its position correctly', assert => {
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([markupSection('p', [marker('abc')])]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement.firstChild.firstChild, 1);
  let { offsets } = editor.cursor;

  assert.ok(offsets.head.section === editor.post.sections.head,
            'Cursor is positioned on first section');
  assert.equal(offsets.head.offset, 1,
               'Cursor is positioned at offset 1');
});

test('cursor blank section reports its position correctly', (assert) => {
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection}) => {
    return post([markupSection('p')]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement.firstChild.firstChild, 0);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.head, editor.post.sections.head.headPosition());
});

test('cursor moved left from section after card is reported as on the card with offset 1', (assert) => {
  // Cannot actually move a cursor, so just emulate what things looks like after
  // the arrow key is pressed
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, cardSection}) => {
    return post([cardSection('my-card'), markupSection('p')]);
  });
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement.firstChild.lastChild, 1);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.head,
                         new Position(editor.post.sections.head, 1));
});

test('cursor moved up from end of section after card is reported as on the card with offset 1', (assert) => {
  // Cannot actually move a cursor, so just emulate what things looks like after
  // the arrow key is pressed
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, cardSection}) => {
    return post([
      cardSection('my-card'),
      markupSection('p')
    ]);
  });
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement.firstChild.lastChild, 0);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.head, editor.post.sections.head.tailPosition());
});

test('cursor moved right from end of section before card is reported as on the card with offset 0', (assert) => {
  // Cannot actually move a cursor, so just emulate what things looks like after
  // the arrow key is pressed
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, cardSection}) => {
    return post([markupSection('p'), cardSection('my-card')]);
  });
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement.lastChild.firstChild, 0);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.head, editor.post.sections.tail.headPosition());
});

test('cursor moved right from end of section before card is reported as on the card with offset 0', (assert) => {
  // Cannot actually move a cursor, so just emulate what things looks like after
  // the arrow key is pressed
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, cardSection}) => {
    return post([markupSection('p'), cardSection('my-card')]);
  });
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement.lastChild.firstChild, 1);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.head, editor.post.sections.tail.headPosition());
});

test('cursor focused on card wrapper with 2 offset', (assert) => {
  // Cannot actually move a cursor, so just emulate what things looks like after
  // the arrow key is pressed
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, cardSection}) => {
    return post([markupSection('p'), cardSection('my-card')]);
  });
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  // We need to create a selection starting from the markup section's node
  // in order for the tail to end up focused on a div instead of a text node
  // This only happens in Firefox
  Helpers.dom.moveCursorTo(editorElement.firstChild.firstChild, 0, 
                           editorElement.lastChild, 2);

  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.tail, editor.post.sections.tail.tailPosition());
});

// This can happen when using arrow+shift keys to select left across a card
test('cursor focused on card wrapper with 0 offset', (assert) => {
  // Cannot actually move a cursor, so just emulate what things looks like after
  // the arrow key is pressed
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, cardSection}) => {
    return post([markupSection('p'), cardSection('my-card')]);
  });
  editor = new Editor({mobiledoc, cards});
  editor.render(editorElement);

  // We need to create a selection starting from the markup section's node
  // in order for the tail to end up focused on a div instead of a text node
  Helpers.dom.moveCursorTo(editorElement.firstChild.firstChild, 0,
                           editorElement.lastChild, 0);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.tail, editor.post.sections.tail.headPosition());
});

// see https://github.com/bustlelabs/mobiledoc-kit/issues/215
test('selecting the entire editor element reports a selection range of the entire post', (assert) => {
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker}) => {
    return post([
      markupSection('p', [marker('abc')]),
      markupSection('p', [marker('1234')])
    ]);
  });
  editor = new Editor({mobiledoc});
  editor.render(editorElement);

  Helpers.dom.moveCursorTo(editorElement, 0,
                           editorElement, editorElement.childNodes.length);
  let { offsets } = editor.cursor;

  assert.positionIsEqual(offsets.head, editor.post.sections.head.headPosition());
  assert.positionIsEqual(offsets.tail, editor.post.sections.tail.tailPosition());
});

test('when at the head of an atom', assert => {
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker, atom}) => {
    return post([markupSection('p', [
      marker('aa'), atom('my-atom'), marker('cc')
    ])]);
  });
  editor = new Editor({mobiledoc, atoms});
  editor.render(editorElement);

  let atomWrapper = editor.post.sections.head.markers.objectAt(1).renderNode.element;

  // Before zwnj
  //
  Helpers.dom.moveCursorTo(atomWrapper.firstChild, 0);
  let range = editor.range;

  let positionBeforeAtom = new Position(editor.post.sections.head, 'aa'.length);

  assert.positionIsEqual(range.head, positionBeforeAtom);

  // After zwnj
  //
  Helpers.dom.moveCursorTo(atomWrapper.firstChild, 1);
  range = editor.range;

  assert.positionIsEqual(range.head, positionBeforeAtom);

  // On wrapper
  //
  [0, 1].forEach(index => {
    Helpers.dom.moveCursorTo(atomWrapper, index);
    range = editor.range;

    assert.positionIsEqual(range.head, positionBeforeAtom);
  });

  // text node before wrapper
  Helpers.dom.moveCursorTo(atomWrapper.previousSibling, 2);
  range = editor.range;

  assert.positionIsEqual(range.head, positionBeforeAtom);
});

test('when at the tail of an atom', assert => {
  let mobiledoc = Helpers.mobiledoc.build(({post, markupSection, marker, atom}) => {
    return post([markupSection('p', [
      marker('aa'), atom('my-atom'), marker('cc')
    ])]);
  });
  editor = new Editor({mobiledoc, atoms});
  editor.render(editorElement);

  let atomWrapper = editor.post.sections.head.markers.objectAt(1).renderNode.element;
  let positionAfterAtom = new Position(editor.post.sections.head, 'aa'.length + 1);

  // Before zwnj
  //
  Helpers.dom.moveCursorTo(atomWrapper.lastChild, 0);
  let range = editor.range;

  assert.positionIsEqual(range.head, positionAfterAtom);

  // After zwnj
  //
  Helpers.dom.moveCursorTo(atomWrapper.lastChild, 1);
  range = editor.range;

  assert.positionIsEqual(range.head, positionAfterAtom);

  // On wrapper
  //
  [2, 3].forEach(index => {
    Helpers.dom.moveCursorTo(atomWrapper, index);
    range = editor.range;
    assert.positionIsEqual(range.head, positionAfterAtom);
  });


  // After wrapper
  //
  Helpers.dom.moveCursorTo(atomWrapper.nextSibling, 0);
  range = editor.range;

  assert.positionIsEqual(range.head, positionAfterAtom);
});