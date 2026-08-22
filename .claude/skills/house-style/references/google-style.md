# Google developer documentation style, applied here

The source is Google's developer documentation style guide. This file keeps the
rules that come up when writing for this repository, in the form they take here.
Where the guide and `CLAUDE.md` disagree, `CLAUDE.md` wins.

## Contents

1. Voice and tense
2. Sentences
3. Headings
4. Lists
5. Punctuation
6. Words
7. Instructions
8. Accuracy and precision
9. Links and references

---

## 1. Voice and tense

**Second person.** Address the reader as "you." Not "the user," not "one," not
"we." "We" is only correct when it means the people who made the thing, and even
then it is usually avoidable.

**Active voice.** The subject performs the verb. Passive is right when the actor
is genuinely unknown, genuinely irrelevant, or when the object is the topic of
the passage — `He was crucified in Jerusalem` is fine in a passage about him.
Passive is wrong when it is hiding an actor you could have named.

**Present tense.** `The workflow deploys the site`, not `will deploy`. For
history on this site, the historical present is the convention: `Constantine
defeats Maxentius`.

**Do not anthropomorphize.** Software does not want, think, know, or try.

---

## 2. Sentences

- One idea per sentence, but vary the length. Uniform short sentences are as bad
  as uniform long ones.
- Put the main clause first when you can. Long preamble buries the point.
- Keep the subject and verb close together.
- Prefer the positive form. `Remember to save` beats `Don't forget to save`.
- Avoid stacked modifiers. `The reading notes export file format` is four nouns
  in a trench coat.

---

## 3. Headings

- Sentence case. `Where reading notes are kept`, not `Where Reading Notes Are
  Kept`.
- No terminal punctuation.
- Headings are labels, not sentences, and not jokes.
- A heading must describe what is under it. If it does not, the section is
  misfiled.
- Do not stack two headings with no text between them.

---

## 4. Lists

- Introduce a list with a sentence ending in a colon.
- Keep items parallel: all fragments, or all sentences, or all imperatives.
- Capitalize the first word of each item.
- Punctuate items as sentences only if they are sentences.
- Use a numbered list only for sequence or count. Otherwise bullets.
- If a list has two items and no structure, write a sentence.

---

## 5. Punctuation

- **Serial comma.** Always. `Rome, Constantinople, and Alexandria.`
- **Em dashes** sparingly, unspaced or spaced consistently with the file. Two per
  page is plenty.
- **Semicolons** join independent clauses that belong together. They are not
  fancy commas.
- **Colons** introduce a list, an example, or an explanation.
- **Quotation marks** for quoted speech and cited text, not for emphasis and not
  for distancing.
- **Parentheses** interrupt. If the content matters, give it a clause.
- Avoid `and/or`, `etc.`, `i.e.`, and `e.g.` in body prose. Write `and`, `or`,
  `that is`, `for example`.

---

## 6. Words

**Never use:** simply, just, easy, easily, obvious, obviously, of course,
straightforward, trivial. A reader who is stuck reads these as an insult.

**Do not use "please"** in instructions. It is not more polite, only longer.

**Precision in modal verbs:**
- `can` — ability
- `might` — possibility
- `must` — requirement
- Avoid `may`; it is ambiguous between permission and possibility.
- Avoid `should` for requirements. Say what happens if the reader does not.

**Define an abbreviation on first use**, then use it consistently. If it appears
once, do not abbreviate at all.

**Prefer the specific term.** `The Worker` is clearer than `the service`.
`localStorage` is clearer than `browser storage` when you mean the API.

---

## 7. Instructions

- **Condition before instruction.** `To export your notes, click Export.` The
  reader needs to know whether the step applies before they read the step.
- **One action per step.** Two actions in one step means a step gets missed.
- **Name the interface element exactly**, matching its capitalization on screen.
- **Say where the element is** when it is not obvious.
- **State the result** when the reader cannot see it happen.
- Do not tell the reader what they will see before telling them what to do.

---

## 8. Accuracy and precision

- Do not claim a thing works unless you watched it work. Say what you checked.
- Give the specific number, date, or name. `Twenty dates` beats `several dates`.
- If a figure is approximate, say `about`, once, and not with a second hedge.
- If you do not know, say you do not know. Do not pad the gap with a construction
  that sounds like knowledge.
- A style edit that changes a fact is a failed edit. Verify names and dates you
  touch.

---

## 9. Links and references

- Link text describes the destination. Never `click here`, never a bare URL in
  prose.
- Reference code as `file_path:line_number` in chat, since it is clickable.
- Do not link the same destination repeatedly in one passage.
