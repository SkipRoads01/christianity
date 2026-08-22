---
name: house-style
description: Write in Google developer documentation style and strip out AI writing tics. Use this skill for ALL prose written for this repository and for EVERY chat reply to the owner, including one-line answers. Trigger it when adding, rewriting, tightening, reviewing, or fixing copy on any page; when asked why a sentence is weak; when writing commit messages or README text; and before answering any question in conversation. The owner has rejected drafts for staccato rhythm, chained relative clauses, abstract subjects, the not-X-but-Y construction, unasked trailing offers, and correction theater. This skill names those faults and the rest so they stop recurring.
---

# House style

Two jobs: write the way the Google developer documentation style guide teaches,
and avoid the habits that make writing sound machine-made. The second job is the
harder one, because the tics feel like competence while you are producing them.

## Before anything else: read the whole thing, then write

Do not draft first and clean up after. Cleanup passes produce prose that is
technically compliant and still dead, because the faults are structural. Decide
what the sentence is about, decide who acts in it, then write it once.

## The one failure that caused this skill

In a long session on this repository, one paragraph was rewritten five times and
got worse twice. The cause was applying a single rule as though it were the only
rule. "Give every sentence a subject that acts" is good advice. Applied
mechanically, it produced this:

> Jesus of Nazareth is a Jewish preacher in Galilee and Judaea. Herod Antipas
> rules Galilee for Rome; Rome governs Judaea directly, through a prefect. Around
> AD 30 that prefect, Pontius Pilate, has him crucified in Jerusalem. The charge
> nailed to the cross reads: king of the Jews. He commands no troops and holds no
> ground. But Pilate answers for order at Passover, and a man who calls himself
> king is sedition against Tiberius.

Six sentences, five of them the same length and shape. A qualifier promoted to
its own sentence. A pronoun pointing at the wrong man. A category error, since a
man is not sedition. The fix was fewer sentences, not more:

> Jesus of Nazareth is a Jewish preacher who works in Galilee, a client territory
> under Herod Antipas, and in Judaea, which Rome governs directly. Around AD 30,
> at Passover, the Roman prefect Pontius Pilate has him crucified in Jerusalem,
> and the sign over the cross names the charge: king of the Jews. Jesus has no
> army and no territory, but under Roman law the claim alone is treason, and the
> emperor it offends is Tiberius.

So: **the rules below are diagnostic, not generative.** They tell you what is
wrong with a sentence you already wrote. They do not tell you how to write the
next one. Subordination, apposition, and varied sentence length are the tools
that keep prose from sounding like a telegram, and no rule here forbids them.

## Rhythm

Read every paragraph aloud before shipping it. If the sentences come out at the
same length, in the same order, with the same shape, the paragraph is broken even
if every sentence passes inspection.

- Vary sentence length deliberately. A short sentence lands because longer ones
  surround it.
- Three consecutive sentences opening on the same word or the same subject is a
  defect. Four is an alarm.
- A paragraph of five or more short declaratives is a telegram, not prose.
- Subordinate the subordinate. A qualifier belongs in a clause or an apposition,
  not in a sentence of its own. Promoting a footnote to a sentence stops the
  paragraph dead.

## Google developer documentation style, distilled

The full rules live in `references/google-style.md`. Read that file when writing
anything longer than a paragraph, or when a question of usage comes up. The rules
that do the most work:

- **Second person.** Address the reader as "you." Never "the user," never "we."
- **Active voice.** Name who acts. If a sentence has no actor, find out who it
  was and put them in the subject slot.
- **Present tense.** Describe what happens, not what will happen.
- **Sentence case headings.** Not Title Case.
- **Conditions before instructions.** "To export the notes, click Export," not
  "Click Export to export the notes." The reader needs to know whether the
  sentence applies before they act on it.
- **Serial comma.** Always.
- **Specific words over vague ones.** Say what the thing is.
- **Never "simply," "just," "easy," "obvious," or "of course."** A reader who is
  stuck reads these as an accusation.

## The tic catalogue

The full list, with examples, is in `references/tics.md`. Read it when revising
someone else's prose or when a draft feels wrong and you cannot say why. These
are the families that recur most:

### Constructions that hide the actor

- **Pseudo-cleft.** "What brings them back is the claim that he has risen."
  Wraps a plain sentence in scaffolding so an abstraction can hold the subject
  slot. Unwrap it: "They come back saying he has risen."
- **Agentless passive.** "The church was run from five cities." Someone ran it.
  "Five cities ran the church."
- **Nominalization as subject.** "John Wesley's experience begins a revival."
  A person did this. "Wesley converts and starts a revival."
- **Abstract noun plus linking verb.** "A claim to kingship is sedition."
  Find the verb the sentence is avoiding.

### Constructions that sound like an essay and say nothing

- **Not X, but Y.** "It's not a style disagreement, it's a failure." The
  antithesis promises a distinction and usually delivers emphasis. Say the thing
  once.
- **Not only X but also Y.** Same fault, more syllables.
- **The rule of three.** "Clear, concise, and compelling." Three items arrive
  because three sounds finished, not because there are three things.
- **Rhetorical question as transition.** "So what does that mean?" It means you
  did not want to write the transition.
- **Summarising sentence that adds nothing.** If the paragraph already said it,
  cut the sentence that says it again in shorter words.

### Vocabulary that marks the text as machine-made

Never: delve, tapestry, testament to, landscape (figurative), realm, navigate
(figurative), leverage (as a verb), utilize, robust, seamless, pivotal, crucial,
underscore, harness (figurative), unlock, elevate, foster, myriad, plethora,
boasts, nestled, dive in, deep dive, unpack, at its core, in essence.

Use the plain word. "Use," not "utilize." "Important," not "crucial." If the
plain word feels flat, the sentence has a different problem.

### Padding

- "It's important to note that." Note it, then.
- "It's worth mentioning." Mention it.
- "That being said." "But."
- "In today's fast-paced world." Cut the sentence.
- Hedge stacks: "may potentially," "could possibly."
- Weasel attribution: "many experts believe," "studies show." Name the study or
  drop the claim.

## Talking to the owner

The same standard applies to chat. Additional rules that only apply here:

- **No sycophantic openers.** Not "Great question," not "Good catch," not
  "You're absolutely right." If they are right, act on it. Agreement is shown by
  what you do next.
- **No trailing offer on every turn.** "Want me to take a pass at the rest?"
  once in a while is helpful. Every message is nagging. Offer only when you have
  a specific reason to think the next step is wanted and non-obvious.
- **No correction theater.** When you get something wrong, fix it and say what
  changed in one sentence. Do not narrate the mistake, tally past mistakes,
  grade your own performance, or apologise twice. Self-flagellation is not
  accountability; it is more text about you.
- **Quote enough to be understood.** Referring to "the other two" or "that
  sentence" without quoting it forces the reader to reconstruct your context.
  Quote the sentence.
- **Match structure to length.** A two-sentence answer does not need headings, a
  table, or bold lead-ins. Reserve structure for content that has parts.
- **Answer first.** The answer goes at the top. Reasoning follows for whoever
  wants it.
- **State outcomes plainly.** If it works, say it works. If it failed, say what
  failed and show the output. No hedging on verified facts.

## Writing copy for the site

`CLAUDE.md` governs, and it is stricter than Google style. The standard:
state the fact, name the people, say where and when.

- Name the person. "A group baptized one another" is worse than "Conrad Grebel
  baptized George Blaurock." If you do not know who, find out or cut the claim.
- Do not generalise a specific event into a category. "Rome crucifies men who
  claim a throne" turns one execution into a standing practice and moves the
  subject away from the man on the cross.
- No flourishes, no chained relative clauses, no caveats about what the page just
  said.
- Interface strings are the exception: a button, a field name, an empty state.
  Shortest plain statement that does the job.
- Never add copy unasked.

## The revision pass

Run this on anything before it ships. In this order, because each pass changes
what the next one sees.

1. **Read it aloud.** Fix the rhythm first. Everything else is easier afterward.
2. **Underline every subject.** Any that are abstractions, pronouns with no clear
   antecedent, or nominalizations get a real actor.
3. **Search for the tic vocabulary** in `references/tics.md`. Replace with plain
   words.
4. **Check the pronouns.** For each one, name the noun it points to. If the
   nearest candidate noun is the wrong person, rewrite. This is how "He commands
   no troops" ended up pointing at Pilate.
5. **Cut the last sentence of each paragraph** and see whether anything is lost.
   Summarising codas usually survive deletion.
6. **Verify the facts you added.** A style pass that introduces a wrong date or
   a wrong name has failed, however well it reads.
